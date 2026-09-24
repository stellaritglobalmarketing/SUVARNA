import type { Address, AddressInput } from "@/types/address";
import { apiDelete, apiGet, apiPost, apiPut } from "./http";

/** The logged-in customer's saved addresses, default first (see backend/README.md — Addresses). */
export async function fetchAddresses(): Promise<Address[]> {
  return apiGet<Address[]>("/user/addresses");
}

export async function createAddress(input: AddressInput): Promise<Address> {
  return apiPost<Address>("/user/addresses", input);
}

export async function updateAddress(id: number, input: AddressInput): Promise<Address> {
  return apiPut<Address>(`/user/addresses/${id}`, input);
}

export async function deleteAddress(id: number): Promise<void> {
  await apiDelete<null>(`/user/addresses/${id}`);
}
