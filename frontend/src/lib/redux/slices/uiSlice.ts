import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export interface Toast {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
}

interface UiState {
  toasts: Toast[];
  isDeliverySheetOpen: boolean;
  deliveryPincode: string | null;
}

const initialState: UiState = {
  toasts: [],
  isDeliverySheetOpen: false,
  deliveryPincode: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    pushToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.toasts.push(action.payload);
      },
      prepare: (message: string, tone: Toast["tone"] = "info") => ({
        payload: { id: crypto.randomUUID(), message, tone },
      }),
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    openDeliverySheet: (state) => {
      state.isDeliverySheetOpen = true;
    },
    closeDeliverySheet: (state) => {
      state.isDeliverySheetOpen = false;
    },
    setDeliveryPincode: (state, action: PayloadAction<string>) => {
      state.deliveryPincode = action.payload;
    },
  },
});

export const { pushToast, dismissToast, openDeliverySheet, closeDeliverySheet, setDeliveryPincode } = uiSlice.actions;

export const selectToasts = (state: RootState) => state.ui.toasts;
export const selectIsDeliverySheetOpen = (state: RootState) => state.ui.isDeliverySheetOpen;
export const selectDeliveryPincode = (state: RootState) => state.ui.deliveryPincode;

export default uiSlice.reducer;
