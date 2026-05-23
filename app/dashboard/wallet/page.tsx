import { PageHeader, SectionHeader } from "@/components/claimr/page-header";
import { WalletAddressCard } from "@/components/claimr/wallet-address-card";
import { WalletBalances } from "@/components/claimr/wallet-balances";
import { TransactionsList } from "@/components/claimr/transactions-list";
import { SwapCard } from "@/components/claimr/swap-card";
import { GuestBanner } from "@/components/claimr/guest-banner";

export default function WalletPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Creator"
        title="Wallet"
        subtitle="Your Claimr address, balances, and recent transactions."
      />

      <GuestBanner
        message="Sign in to see your Claimr wallet, balances, and transaction history."
        returnPath="/dashboard/wallet"
      />

      <section>
        <SectionHeader title="Address" />
        <WalletAddressCard />
      </section>

      <section>
        <SectionHeader title="Balances" />
        <WalletBalances />
      </section>

      <section>
        <SectionHeader title="Recent transactions" />
        <TransactionsList />
      </section>

      <section>
        <SectionHeader
          title="Swap"
          subtitle="Convert between stablecoins"
        />
        <div className="max-w-md">
          <SwapCard />
        </div>
      </section>
    </div>
  );
}
