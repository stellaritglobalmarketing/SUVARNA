import { useMutation } from "@tanstack/react-query";
import { checkPincodeServiceability } from "@/lib/api/pincode";

/** Mutation, not a query — a user-triggered one-off check, nothing to cache/refetch by key. */
export function usePincodeCheck() {
  return useMutation({
    mutationFn: (pincode: string) => checkPincodeServiceability(pincode),
  });
}
