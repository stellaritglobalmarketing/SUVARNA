"use client";

import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ReduxProvider } from "react-redux";
import { createQueryClient } from "@/lib/query/queryClient";
import { makeStore, type AppStore } from "@/lib/redux/store";
import { setCredentials } from "@/lib/redux/slices/authSlice";
import { getStoredUser, getToken } from "@/lib/auth/token";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState (not module scope) so each request/browser tab gets its own
  // client + store instead of leaking state across users on the server.
  const [queryClient] = useState(createQueryClient);
  const [store] = useState<AppStore>(makeStore);

  // Session lives in localStorage (read by the plain fetch helpers in lib/api/http.ts
  // outside the React tree); rehydrate Redux from it once we're on the client so the
  // first paint stays SSR-safe (logged-out) and swaps in almost immediately after.
  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (token && user) {
      store.dispatch(setCredentials({ token, user }));
    }
  }, [store]);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
