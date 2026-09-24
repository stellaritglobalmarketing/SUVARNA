import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import filtersReducer from "./slices/filtersSlice";
import uiReducer from "./slices/uiSlice";
import wishlistReducer from "./slices/wishlistSlice";
import recentlyViewedReducer from "./slices/recentlyViewedSlice";
import { syncMiddleware } from "./sync";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      filters: filtersReducer,
      ui: uiReducer,
      wishlist: wishlistReducer,
      recentlyViewed: recentlyViewedReducer,
    },
    // Mirrors a logged-in customer's cart/wishlist changes to the backend (see ./sync.ts).
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(syncMiddleware.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
