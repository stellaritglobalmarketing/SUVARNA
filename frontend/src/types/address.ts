export type AddressType = "home" | "work" | "other";

/** A saved delivery address, as returned by GET /user/addresses. */
export interface Address {
  id: number;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  address_type: AddressType;
  is_default: boolean;
}

export interface AddressInput {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  address_type: AddressType;
  is_default?: boolean;
}
