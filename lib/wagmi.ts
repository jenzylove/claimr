import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet } from "./chains";

// MetaMask (and any other injected wallet like Rabby, Brave, Coinbase Wallet
// extension, etc.) is detected via the standard injected provider. Circle
// users still go through the API and SDK; this connector is only for users
// who pick "Connect Wallet" instead of the email flow.
export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [arcTestnet.id]: http(),
  },
});
