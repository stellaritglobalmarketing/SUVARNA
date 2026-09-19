import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./slices/cartSlice";
import filtersReducer from "./slices/filtersSlice";
import uiReducer from "./slices/uiSlice";
import wishlistReducer from "./slices/wishlistSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      cart: cartReducer,
      filters: filtersReducer,
      ui: uiReducer,
      wishlist: wishlistReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
