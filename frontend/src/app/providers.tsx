"use client";

import { TokenProvider } from "@/lib/token";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TokenProvider>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#25a828",
              accentColorForeground: "white",
              borderRadius: "large",
              fontStack: "system",
              overlayBlur: "small",
            })}
            modalSize="compact"
          >
            {children}
          </RainbowKitProvider>
        </TokenProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}