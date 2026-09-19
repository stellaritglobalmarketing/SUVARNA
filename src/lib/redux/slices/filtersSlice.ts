import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { HealthBenefit, ProductCategory, ProductListParams, ProductOrigin, ProductProcessing } from "@/types/product";
import type { RootState } from "../store";

interface FiltersState {
  category?: ProductCategory;
  search: string;
  priceMin?: number;
  priceMax?: number;
  weights: string[];
  origins: ProductOrigin[];
  processing: ProductProcessing[];
  healthBenefits: HealthBenefit[];
  sort: NonNullable<ProductListParams["sort"]>;
  page: number;
  pageSize: number;
}

const initialState: FiltersState = {
  category: undefined,
  search: "",
  priceMin: undefined,
  priceMax: undefined,
  weights: [],
  origins: [],
  processing: [],
  healthBenefits: [],
  sort: "popularity",
  page: 1,
  pageSize: 8,
};

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setCategory: (state, action: PayloadAction<ProductCategory | undefined>) => {
      state.category = action.payload;
      state.page = 1;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1;
    },
    setPriceRange: (state, action: PayloadAction<{ min?: number; max?: number }>) => {
      state.priceMin = action.payload.min;
      state.priceMax = action.payload.max;
      state.page = 1;
    },
    toggleWeight: (state, action: PayloadAction<string>) => {
      state.weights = toggleValue(state.weights, action.payload);
      state.page = 1;
    },
    toggleOrigin: (state, action: PayloadAction<ProductOrigin>) => {
      state.origins = toggleValue(state.origins, action.payload);
      state.page = 1;
    },
    toggleProcessing: (state, action: PayloadAction<ProductProcessing>) => {
      state.processing = toggleValue(state.processing, action.payload);
      state.page = 1;
    },
    toggleHealthBenefit: (state, action: PayloadAction<HealthBenefit>) => {
      state.healthBenefits = toggleValue(state.healthBenefits, action.payload);
      state.page = 1;
    },
    setSort: (state, action: PayloadAction<FiltersState["sort"]>) => {
      state.sort = action.payload;
      state.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
    },
    resetFilters: () => initialState,
  },
});

export const {
  setCategory,
  setSearch,
  setPriceRange,
  toggleWeight,
  toggleOrigin,
  toggleProcessing,
  toggleHealthBenefit,
  setSort,
  setPage,
  setPageSize,
  resetFilters,
} = filtersSlice.actions;

export const selectFilters = (state: RootState) => state.filters;

export const selectProductListParams = createSelector(
  [selectFilters],
  (filters): ProductListParams => ({
    page: filters.page,
    pageSize: filters.pageSize,
    category: filters.category,
    search: filters.search || undefined,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    weights: filters.weights.length ? filters.weights : undefined,
    origins: filters.origins.length ? filters.origins : undefined,
    processing: filters.processing.length ? filters.processing : undefined,
    healthBenefits: filters.healthBenefits.length ? filters.healthBenefits : undefined,
    sort: filters.sort,
  }),
);

export const selectActiveFilterCount = (state: RootState): number => {
  const filters = state.filters;
  return (
    filters.weights.length +
    filters.origins.length +
    filters.processing.length +
    filters.healthBenefits.length +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0)
  );
};

export default filtersSlice.reducer;
