import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

const MAX_ENTRIES = 8;

interface RecentlyViewedState {
  productIds: string[];
}

const initialState: RecentlyViewedState = {
  productIds: [],
};

const recentlyViewedSlice = createSlice({
  name: "recentlyViewed",
  initialState,
  reducers: {
    addRecentlyViewed: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.productIds = [productId, ...state.productIds.filter((id) => id !== productId)].slice(0, MAX_ENTRIES);
    },
  },
});

export const { addRecentlyViewed } = recentlyViewedSlice.actions;

export const selectRecentlyViewedIds = (state: RootState) => state.recentlyViewed.productIds;

export default recentlyViewedSlice.reducer;
