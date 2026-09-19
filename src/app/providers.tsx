"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as ReduxProvider } from "react-redux";
import { createQueryClient } from "@/lib/query/queryClient";
import { makeStore, type AppStore } from "@/lib/redux/store";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState (not module scope) so each request/browser tab gets its own
  // client + store instead of leaking state across users on the server.
  const [queryClient] = useState(createQueryClient);
  const [store] = useState<AppStore>(makeStore);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
