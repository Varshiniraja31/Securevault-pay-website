import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Delete, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { setPin as setPinApi } from "../api/auth";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"];

function PinDots({ value }) {
  return (
    <div className="flex justify-center gap-4">
      {Array.from({ length: PIN_LENGTH }).map((_, i) => (
        <span
          key={i}
          className={`h-4 w-4 rounded-full border-2 transition-colors ${
            i < value.length ? "border-brand-500 bg-brand-500" : "border-white/20"
          }`}
        />
      ))}
    </div>
  );
}

export default function PinSetup() {
  const navigate = useNavigate();
  const { syncUser } = useAuth();
  const toast = useToast();
  const [stage, setStage] = useState("create"); // create | confirm
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleDigit(key) {
    if (saving) return;
    if (key === "delete") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (!key || pin.length >= PIN_LENGTH) return;
    if (pin.length === 0) setError("");

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      if (stage === "create") {
        setTimeout(() => {
          setFirstPin(next);
          setPin("");
          setStage("confirm");
        }, 150);
      } else {
        if (next === firstPin) {
          setSaving(true);
          try {
            const data = await setPinApi(next);
            syncUser(data.user);
            toast.success("PIN Lock enabled");
            navigate("/security");
          } catch (err) {
            setError(err.message);
            setPin("");
            setSaving(false);
          }
        } else {
          setError("PINs don't match. Try again.");
          setTimeout(() => {
            setPin("");
            setFirstPin("");
            setStage("create");
          }, 600);
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-8 text-center">
      <div className="flex items-center gap-3 text-left">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">PIN Lock</h1>
      </div>

      <div className="flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2a0f0f] text-red-500">
          <Lock size={28} />
        </div>
        <h2 className="mt-5 text-xl font-bold text-white">
          {stage === "create" ? "Create your PIN" : "Confirm your PIN"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {stage === "create"
            ? `Choose a ${PIN_LENGTH}-digit PIN to lock your account`
            : "Enter the same PIN again to confirm"}
        </p>

        <div className="mt-8">
          <PinDots value={pin} />
        </div>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <div className="mt-10 grid grid-cols-3 gap-4">
          {KEYS.map((key, i) =>
            key === "" ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                onClick={() => handleDigit(key)}
                disabled={saving}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#131313] text-xl font-semibold text-white transition hover:bg-[#1e1e1e] disabled:opacity-50"
              >
                {key === "delete" ? <Delete size={20} /> : key}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
