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
  },
});

export const { toggleWishlist } = wishlistSlice.actions;

export const selectWishlistIds = (state: RootState) => state.wishlist.productIds;
export const selectWishlistCount = (state: RootState) => state.wishlist.productIds.length;

export default wishlistSlice.reducer;
