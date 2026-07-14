import { useState } from "react";
import { Plus } from "lucide-react";
import { useData } from "../context/DataContext";
import { MainVaultCard, PurposeWalletCard } from "../components/WalletCard";
import EmptyState from "../components/EmptyState";
import AddMoneyModal from "../components/modals/AddMoneyModal";
import WithdrawModal from "../components/modals/WithdrawModal";
import TransferModal from "../components/modals/TransferModal";
import CreateWalletModal from "../components/modals/CreateWalletModal";

export default function Wallets() {
  const { wallets, mainWallet, purposeWallets, loading } = useData();
  const [modal, setModal] = useState(null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">My Wallets</h2>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          {wallets.length} Active
        </span>
      </div>

      <MainVaultCard
        wallet={mainWallet}
        onLoad={() => setModal("addMoney")}
        onWithdraw={() => setModal("withdraw")}
        onTransfer={() => setModal("transfer")}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Purpose Wallets</h3>
        <span className="text-xs font-medium text-gray-500">{purposeWallets.length} wallets</span>
      </div>

      {purposeWallets.length === 0 && !loading ? (
        <EmptyState
          icon={Plus}
          title="No purpose wallets yet"
          description="Separate your spending into wallets like Grocery, Utility, Travel, or anything custom."
          action={
            <button onClick={() => setModal("wallet")} className="text-sm font-semibold text-brand-500">
              + Create your first wallet
            </button>
          }
        />
      ) : (
        <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
          {purposeWallets.map((w) => (
            <PurposeWalletCard key={w.id} wallet={w} />
          ))}
        </div>
      )}

      <button
        onClick={() => setModal("wallet")}
        className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ff5449] to-[#e2362b] text-white shadow-[0_8px_24px_rgba(226,54,43,0.45)] transition hover:brightness-105 lg:bottom-8"
        title="Add wallet"
      >
        <Plus size={24} />
      </button>

      <AddMoneyModal open={modal === "addMoney"} onClose={() => setModal(null)} />
      <WithdrawModal open={modal === "withdraw"} onClose={() => setModal(null)} />
      <TransferModal open={modal === "transfer"} onClose={() => setModal(null)} />
      <CreateWalletModal open={modal === "wallet"} onClose={() => setModal(null)} />
    </div>
  );
}
