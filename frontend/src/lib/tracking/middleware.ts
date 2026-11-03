import { createListenerMiddleware } from "@reduxjs/toolkit";
import { addToCart, removeFromCart, updateQuantity } from "@/lib/redux/slices/cartSlice";
import { setSearch } from "@/lib/redux/slices/filtersSlice";
import { toggleWishlist } from "@/lib/redux/slices/wishlistSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import { track } from "./track";

const SEARCH_PAUSE_MS = 1500;
const MIN_SEARCH_LENGTH = 2;

/**
 * Tracks what shoppers do with the cart, wishlist and search. Several components dispatch these actions,
 * so listening here covers all of them. The server-sync actions (setCartItems, setWishlist) aren't
 * listened to, so reloading a saved cart doesn't count as adding to it.
 */
export const trackingMiddleware = createListenerMiddleware();
const listen = trackingMiddleware.startListening.withTypes<RootState, AppDispatch>();

listen({
  actionCreator: addToCart,
  effect: ({ payload }) => {
    const quantity = payload.quantity ?? 1;
    track("add_to_cart", {
      label: payload.productName,
      product_slug: payload.productSlug,
      variant: payload.variantLabel,
      quantity,
      value: payload.unitPrice * quantity,
    });
  },
});

listen({
  predicate: (action) => removeFromCart.match(action) || (updateQuantity.match(action) && action.payload.quantity <= 0),
  effect: (action, api) => {
    const lineId = (action.payload as { lineId: string }).lineId;
    const removed = api.getOriginalState().cart.items.find((line) => line.lineId === lineId);
    if (removed) track("remove_from_cart", { label: removed.productName, product_slug: removed.productSlug, variant: removed.variantLabel });
  },
});

listen({
  actionCreator: toggleWishlist,
  effect: ({ payload: slug }, api) => {
    if (api.getState().wishlist.productIds.includes(slug)) track("add_to_wishlist", { product_slug: slug });
  },
});

// The header searches live while typing; wait for a pause so only what they settled on is recorded.
listen({
  actionCreator: setSearch,
  effect: async ({ payload }, api) => {
    api.cancelActiveListeners();
    const query = payload.trim();
    if (query.length < MIN_SEARCH_LENGTH) return;
    await api.delay(SEARCH_PAUSE_MS);
    track("search", { label: query });
  },
});
