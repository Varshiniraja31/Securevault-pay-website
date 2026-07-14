import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Modal from "../Modal";
import { useAuth } from "../../context/AuthContext";
import { buildPaymentPayload } from "../../utils/qr";

export default function MyQRModal({ open, onClose }) {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const [error, setError] = useState("");

  const upiId = user?.email ? `${user.email.split("@")[0]}@securevault` : "user@securevault";

  useEffect(() => {
    if (!open || !user) return;
    const payload = buildPaymentPayload({ name: user.name, upiId });
    QRCode.toCanvas(canvasRef.current, payload, { width: 220, margin: 1 }, (err) => {
      if (err) setError("Couldn't generate the QR code.");
    });
  }, [open, user, upiId]);

  return (
    <Modal open={open} onClose={onClose} title="My QR Code">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl bg-white p-3">
          {error ? (
            <p className="flex h-[220px] w-[220px] items-center justify-center text-center text-xs text-rose-500">
              {error}
            </p>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white">{user?.name}</p>
          <p className="text-xs text-gray-500">{upiId}</p>
        </div>
        <p className="text-center text-xs text-gray-500">
          Anyone scanning this with SecureVault Pay's QR Payment screen can pay you directly.
        </p>
      </div>
    </Modal>
  );
}
