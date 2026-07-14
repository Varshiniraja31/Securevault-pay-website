import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight, ScanLine, Trash2 } from "lucide-react";
import { useData } from "../context/DataContext";
import { fetchTransactions } from "../api/payments";
import { deleteWallet } from "../api/wallets";
import { walletMeta } from "../utils/categories";
import { formatCurrency } from "../utils/format";
import TransactionRow from "../components/TransactionRow";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import TransferModal from "../components/modals/TransferModal";
import PayModal from "../components/modals/PayModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../context/ToastContext";

export default function WalletDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { wallets, refreshWallets } = useData();
  const [txns, setTxns] = useState([]);
  const [modal, setModal] = useState(null);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const wallet = wallets.find((w) => w.id === id);

  useEffect(() => {
    setLoadingTxns(true);
    fetchTransactions({ walletId: id })
      .then(setTxns)
      .finally(() => setLoadingTxns(false));
  }, [id]);

  if (!wallet) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center text-gray-500">
        Wallet not found.{" "}
        <Link to="/wallets" className="font-semibold text-brand-500">
          Back to wallets
        </Link>
      </div>
    );
  }

  const meta = walletMeta(wallet.category);
  const Icon = meta.icon;

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteWallet(wallet.id);
      await refreshWallets();
      toast.success("Wallet deleted");
      navigate("/wallets");
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-white"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div
        className="rounded-3xl p-6 text-white shadow-xl"
        style={{
          background: `linear-gradient(135deg, ${wallet.color}, ${wallet.color}CC)`,
        }}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Icon size={16} />
          {wallet.type === "main" ? "Main Wallet" : meta.label}
        </div>
        <p className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          {formatCurrency(wallet.balance)}
        </p>
        <p className="mt-1 text-xs text-white/60">{wallet.name}</p>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => setModal("transfer")}>
          <ArrowLeftRight size={16} /> Transfer
        </Button>
        {wallet.type === "purpose" && (
          <Button variant="dark" className="flex-1" onClick={() => setModal("pay")}>
            <ScanLine size={16} /> Pay
          </Button>
        )}
        {wallet.type === "purpose" && (
          <Button variant="outline" onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#111111] p-5">
        <h3 className="mb-1 text-sm font-bold text-white">Transaction History</h3>
        {!loadingTxns && txns.length === 0 ? (
          <EmptyState title="No transactions yet" description="Activity for this wallet will show up here." />
        ) : (
          <div className="divide-y divide-white/5">
            {txns.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} walletId={wallet.id} />
            ))}
          </div>
        )}
      </section>

      <TransferModal
        open={modal === "transfer"}
        onClose={() => setModal(null)}
        defaultFromWalletId={wallet.id}
      />
      <PayModal
        open={modal === "pay"}
        onClose={() => setModal(null)}
        defaultWalletId={wallet.id}
      />

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete wallet"
        message={`Delete ${wallet.name}? This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
