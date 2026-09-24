import { createListenerMiddleware } from "@reduxjs/toolkit";
import {
  addServerCartItem,
  clearServerCart,
  fetchServerCart,
  removeServerCartItem,
  updateServerCartItem,
} from "@/lib/api/cart";
import { addServerWishlistItem, fetchServerWishlistSlugs, removeServerWishlistItem } from "@/lib/api/wishlist";
import { USE_MOCK_API } from "@/lib/api/config";
import { isSessionExpiredError } from "@/lib/api/http";
import { clearCredentials, setCredentials } from "./slices/authSlice";
import {
  addToCart,
  cartLineSynced,
  clearCart,
  removeFromCart,
  setCartItems,
  updateQuantity,
} from "./slices/cartSlice";
import { setWishlist, toggleWishlist } from "./slices/wishlistSlice";
import { pushToast } from "./slices/uiSlice";
import type { AppDispatch, RootState } from "./store";

/**
 * Keeps a logged-in customer's cart and wishlist in sync with the backend.
 *
 * Components keep dispatching the plain cart/wishlist actions, so the UI updates instantly
 * (optimistic). These listeners then mirror each change to the server. If a request fails
 * (e.g. not enough stock), the server's copy is reloaded so the UI can't drift from it.
 * Guests (and mock mode) stay local-only; on login their cart and wishlist are merged in.
 */
export const syncMiddleware = createListenerMiddleware();
const listen = syncMiddleware.startListening.withTypes<RootState, AppDispatch>();

type Api = { getState: () => RootState; dispatch: AppDispatch };

/** Cart/wishlist APIs are customer-only; admins and guests never sync. */
function isCustomer(state: RootState): boolean {
  return !USE_MOCK_API && Boolean(state.auth.token) && state.auth.user?.role === "user";
}

// Server writes run one at a time, in dispatch order — e.g. a quick "add" then "+1" can't
// reach the server out of order, and a line's server id exists before it's updated.
let queue: Promise<void> = Promise.resolve();
function enqueue(task: () => Promise<void>): Promise<void> {
  queue = queue.then(task, task);
  return queue;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Couldn't update your cart. Please try again.";
}

async function reloadCart(api: Api) {
  try {
    api.dispatch(setCartItems(await fetchServerCart()));
  } catch {
    // Leave the local cart as-is; the next successful action or page load resyncs it.
  }
}

async function reloadWishlist(api: Api) {
  try {
    api.dispatch(setWishlist(await fetchServerWishlistSlugs()));
  } catch {
    // Same as reloadCart — keep the local copy until the next successful sync.
  }
}

/**
 * Shows why a sync failed and reloads the server copy. A session that ended is skipped here —
 * app/providers.tsx logs the user out and shows one toast for it instead of one per request.
 */
async function reportSyncError(api: Api, error: unknown, reload: (api: Api) => Promise<void>) {
  if (isSessionExpiredError(error)) return;
  api.dispatch(pushToast(errorMessage(error), "error"));
  await reload(api);
}

/** The server row id for a local line, looked up when the queued task runs (not when it was queued). */
function serverIdFor(api: Api, lineId: string): number | undefined {
  return api.getState().cart.items.find((line) => line.lineId === lineId)?.serverId;
}

// ---- Login / session restore: merge the guest cart + wishlist, then adopt the server's copy ----
listen({
  actionCreator: setCredentials,
  effect: async (_action, api) => {
    if (!isCustomer(api.getState())) return;

    await enqueue(async () => {
      const { cart, wishlist } = api.getState();
      const guestLines = cart.items.filter((line) => line.variantId != null && line.serverId == null);
      const skipped: string[] = [];

      for (const line of guestLines) {
        try {
          await addServerCartItem(line.variantId!, line.quantity);
        } catch {
          skipped.push(line.productName);
        }
      }
      await Promise.allSettled(wishlist.productIds.map((slug) => addServerWishlistItem(slug)));

      await Promise.all([reloadCart(api), reloadWishlist(api)]);

      if (skipped.length > 0) {
        api.dispatch(pushToast(`Some items couldn't be added to your saved cart: ${skipped.join(", ")}`, "error"));
      }
    });
  },
});

// ---- Logout: the server keeps the customer's cart/wishlist; this device forgets it ----
listen({
  actionCreator: clearCredentials,
  effect: (_action, api) => {
    api.dispatch(clearCart());
    api.dispatch(setWishlist([]));
  },
});

// ---- Cart ----
listen({
  actionCreator: addToCart,
  effect: async (action, api) => {
    const { variantId, quantity = 1, productId, variantLabel } = action.payload;
    if (!isCustomer(api.getState()) || variantId == null) return;

    await enqueue(async () => {
      try {
        const synced = await addServerCartItem(variantId, quantity);
        // The local line was keyed from the product's own fields; key the server copy the same way.
        api.dispatch(cartLineSynced({ ...synced, lineId: `${productId}__${variantLabel}` }));
      } catch (error) {
        await reportSyncError(api, error, reloadCart);
      }
    });
  },
});

listen({
  actionCreator: updateQuantity,
  effect: async (action, api) => {
    const { lineId, quantity } = action.payload;
    // A quantity of 0 removes the line — the listener below handles that case.
    if (!isCustomer(api.getState()) || quantity <= 0) return;

    await enqueue(async () => {
      const serverId = serverIdFor(api, lineId);
      try {
        if (serverId == null) return;
        api.dispatch(cartLineSynced({ ...(await updateServerCartItem(serverId, quantity)), lineId }));
      } catch (error) {
        await reportSyncError(api, error, reloadCart);
      }
    });
  },
});

listen({
  actionCreator: removeFromCart,
  effect: async (action, api) => {
    if (!isCustomer(api.getState())) return;
    // Captured now, before the line is gone from state.
    const removed = api.getOriginalState().cart.items.find((line) => line.lineId === action.payload.lineId);
    if (removed?.serverId == null) return;
    const serverId = removed.serverId;

    await enqueue(async () => {
      try {
        await removeServerCartItem(serverId);
      } catch (error) {
        await reportSyncError(api, error, reloadCart);
      }
    });
  },
});

// Quantity steppers can reach 0; removing that line must also hit the server.
listen({
  predicate: (action, currentState, originalState) =>
    updateQuantity.match(action) &&
    action.payload.quantity <= 0 &&
    currentState.cart.items.length < originalState.cart.items.length,
  effect: async (action, api) => {
    if (!isCustomer(api.getState()) || !updateQuantity.match(action)) return;
    const removed = api.getOriginalState().cart.items.find((line) => line.lineId === action.payload.lineId);
    if (removed?.serverId == null) return;
    const serverId = removed.serverId;

    await enqueue(async () => {
      try {
        await removeServerCartItem(serverId);
      } catch (error) {
        await reportSyncError(api, error, reloadCart);
      }
    });
  },
});

listen({
  actionCreator: clearCart,
  effect: async (_action, api) => {
    // Also fires on logout, after the token is gone — isCustomer() is false then, so the
    // customer's saved server cart is left alone.
    if (!isCustomer(api.getState())) return;
    await enqueue(async () => {
      try {
        await clearServerCart();
      } catch (error) {
        await reportSyncError(api, error, reloadCart);
      }
    });
  },
});

// ---- Wishlist ----
listen({
  actionCreator: toggleWishlist,
  effect: async (action, api) => {
    if (!isCustomer(api.getState())) return;
    const slug = action.payload;
    const saved = api.getState().wishlist.productIds.includes(slug);

    await enqueue(async () => {
      try {
        if (saved) await addServerWishlistItem(slug);
        else await removeServerWishlistItem(slug);
      } catch (error) {
        await reportSyncError(api, error, reloadWishlist);
      }
    });
  },
});
