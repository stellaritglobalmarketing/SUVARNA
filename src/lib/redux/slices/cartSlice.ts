import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartLineItem } from "@/types/cart";
import type { RootState } from "../store";

interface CartState {
  items: CartLineItem[];
  isDrawerOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isDrawerOpen: false,
};

export interface AddToCartPayload {
  productId: string;
  productSlug: string;
  productName: string;
  image: string;
  variantLabel: string;
  unitPrice: number;
  unitMrp: number;
  quantity?: number;
}

function makeLineId(productId: string, variantLabel: string): string {
  return `${productId}__${variantLabel}`;
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const { quantity = 1, ...rest } = action.payload;
      const lineId = makeLineId(rest.productId, rest.variantLabel);
      const existing = state.items.find((item) => item.lineId === lineId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ lineId, quantity, ...rest });
      }
      state.isDrawerOpen = true;
    },
    updateQuantity: (state, action: PayloadAction<{ lineId: string; quantity: number }>) => {
      const item = state.items.find((line) => line.lineId === action.payload.lineId);
      if (!item) return;
      if (action.payload.quantity <= 0) {
        state.items = state.items.filter((line) => line.lineId !== action.payload.lineId);
      } else {
        item.quantity = action.payload.quantity;
      }
    },
    removeFromCart: (state, action: PayloadAction<{ lineId: string }>) => {
      state.items = state.items.filter((line) => line.lineId !== action.payload.lineId);
    },
    clearCart: (state) => {
      state.items = [];
    },
    openCartDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    closeCartDrawer: (state) => {
      state.isDrawerOpen = false;
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart, openCartDrawer, closeCartDrawer } =
  cartSlice.actions;

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectIsCartDrawerOpen = (state: RootState) => state.cart.isDrawerOpen;
export const selectCartCount = (state: RootState) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartSubtotal = (state: RootState) =>
  state.cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
export const selectCartMrpTotal = (state: RootState) =>
  state.cart.items.reduce((sum, item) => sum + item.unitMrp * item.quantity, 0);

export default cartSlice.reducer;
