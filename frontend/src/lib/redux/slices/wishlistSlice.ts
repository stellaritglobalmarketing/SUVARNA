import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

interface WishlistState {
  productIds: string[];
}

const initialState: WishlistState = {
  productIds: [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.productIds = state.productIds.includes(productId)
        ? state.productIds.filter((id) => id !== productId)
        : [...state.productIds, productId];
    },
    /** Replaces the list with the server's copy (login, or recovering from a failed sync). */
    setWishlist: (state, action: PayloadAction<string[]>) => {
      state.productIds = action.payload;
    },
  },
});

export const { toggleWishlist, setWishlist } = wishlistSlice.actions;

export const selectWishlistIds = (state: RootState) => state.wishlist.productIds;
export const selectWishlistCount = (state: RootState) => state.wishlist.productIds.length;

export default wishlistSlice.reducer;
