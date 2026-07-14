import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ScanLine, QrCode, Store, X } from "lucide-react";
import PayModal from "../components/modals/PayModal";
import MyQRModal from "../components/modals/MyQRModal";
import QRScannerView from "../components/QRScannerView";
import { useToast } from "../context/ToastContext";
import { parsePaymentPayload } from "../utils/qr";

const RECENT_MERCHANTS = [
  "Starbucks Coffee",
  "McDonald's",
  "DMart",
  "Big Bazaar",
  "Reliance Fresh",
];

function IdleScannerFrame() {
  const corner = "absolute h-8 w-8 border-red-500";
  return (
    <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black">
      <span className={`${corner} left-4 top-4 rounded-tl-lg border-l-2 border-t-2`} />
      <span className={`${corner} right-4 top-4 rounded-tr-lg border-r-2 border-t-2`} />
      <span className={`${corner} bottom-4 left-4 rounded-bl-lg border-b-2 border-l-2`} />
      <span className={`${corner} bottom-4 right-4 rounded-br-lg border-b-2 border-r-2`} />
      <p className="absolute bottom-8 text-xs text-gray-500">Point camera at QR code</p>
    </div>
  );
}

export default function QRPayment() {
  const navigate = useNavigate();
  const toast = useToast();
  const [payMerchant, setPayMerchant] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [showMyQR, setShowMyQR] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  function openPay(name, amount) {
    setPayAmount(amount ? String(amount) : "");
    setPayMerchant(name);
  }

  function handleDetected(rawText) {
    setCameraOpen(false);
    const { merchantName, amount } = parsePaymentPayload(rawText);
    toast.success(`Scanned ${merchantName}${amount ? ` · ₹${amount}` : ""}`);
    openPay(merchantName, amount);
  }

  function handleManualEntry() {
    setCameraOpen(false);
    openPay("", null);
  }

  return (
    <div className="min-h-screen bg-black px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white">QR Payment</h1>
        </div>

        {cameraOpen ? (
          <QRScannerView onDetected={handleDetected} onManualEntry={handleManualEntry} />
        ) : (
          <IdleScannerFrame />
        )}

        <div className="grid grid-cols-2 gap-3">
          {cameraOpen ? (
            <button
              onClick={() => setCameraOpen(false)}
              className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#131313] py-3 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
            >
              <X size={16} />
              Cancel Scanning
            </button>
          ) : (
            <>
              <button
                onClick={() => setCameraOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5449] to-[#e2362b] py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(226,54,43,0.35)] transition hover:brightness-105"
              >
                <ScanLine size={16} />
                Scan QR
              </button>
              <button
                onClick={() => setShowMyQR(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#131313] py-3 text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
              >
                <QrCode size={16} />
                My QR
              </button>
            </>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold text-white">Recent Merchants</h3>
          <div className="space-y-2.5">
            {RECENT_MERCHANTS.map((name) => (
              <button
                key={name}
                onClick={() => openPay(name, null)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#111111] p-4 text-left transition hover:border-white/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Store size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-gray-500">Retail · UPI</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <PayModal
        open={payMerchant !== null}
        onClose={() => setPayMerchant(null)}
        defaultMerchantName={payMerchant || ""}
        defaultAmount={payAmount}
      />
      <MyQRModal open={showMyQR} onClose={() => setShowMyQR(false)} />
    </div>
  );
}
