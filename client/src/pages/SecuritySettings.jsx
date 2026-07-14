import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldCheck, Lock, LockOpen, BadgeCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Switch from "../components/Switch";
import ConfirmDialog from "../components/ConfirmDialog";
import { maskPhone, maskEmail } from "../utils/format";
import { disablePin as disablePinApi } from "../api/auth";

function SectionLabel({ children }) {
  return (
    <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </p>
  );
}

export default function SecuritySettings() {
  const navigate = useNavigate();
  const { user, updateUser, syncUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(null);
  const [confirmDisable2FA, setConfirmDisable2FA] = useState(false);
  const [confirmDisablePin, setConfirmDisablePin] = useState(false);

  const otpDestination = user?.phone ? maskPhone(user.phone) : maskEmail(user?.email);

  async function setTwoFactor(value) {
    setSaving("twoFactorEnabled");
    try {
      await updateUser({ twoFactorEnabled: value });
      toast.success(value ? "Two-factor authentication enabled" : "Two-factor authentication disabled");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(null);
      setConfirmDisable2FA(false);
    }
  }

  async function handleDisablePin() {
    setSaving("pin");
    try {
      const data = await disablePinApi();
      syncUser(data.user);
      toast.success("PIN Lock disabled");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(null);
      setConfirmDisablePin(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-lg font-bold text-white">Security Settings</h1>
      </div>

      <div>
        <SectionLabel>Login Security</SectionLabel>
        <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white">Two-Factor Authentication</p>
                {(user?.twoFactorEnabled ?? true) && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <BadgeCheck size={11} />
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                Send a one-time code to {otpDestination || "your account"} at every login
              </p>
            </div>
            <Switch
              checked={user?.twoFactorEnabled ?? true}
              disabled={saving === "twoFactorEnabled"}
              onChange={(v) => (v ? setTwoFactor(true) : setConfirmDisable2FA(true))}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>App Lock</SectionLabel>
        <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
              {user?.pinEnabled ? <Lock size={18} /> : <LockOpen size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">PIN Lock</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {user?.pinEnabled
                  ? "A 4-digit PIN is required for quick account access"
                  : "Set a 4-digit PIN as a backup way to unlock your account"}
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex gap-2.5 pl-[52px]">
            {user?.pinEnabled ? (
              <>
                <button
                  onClick={() => navigate("/security/pin")}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 hover:bg-white/10"
                >
                  Change PIN
                </button>
                <button
                  onClick={() => setConfirmDisablePin(true)}
                  className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                >
                  Turn off
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/security/pin")}
                className="rounded-lg bg-gradient-to-r from-[#ff5449] to-[#e2362b] px-3.5 py-1.5 text-xs font-bold text-white"
              >
                Set Up PIN
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDisable2FA}
        onClose={() => setConfirmDisable2FA(false)}
        onConfirm={() => setTwoFactor(false)}
        loading={saving === "twoFactorEnabled"}
        title="Disable Two-Factor Authentication?"
        message="Without an OTP step, anyone with your password can sign in. This makes your account less secure."
        confirmLabel="Disable Anyway"
      />

      <ConfirmDialog
        open={confirmDisablePin}
        onClose={() => setConfirmDisablePin(false)}
        onConfirm={handleDisablePin}
        loading={saving === "pin"}
        title="Turn off PIN Lock?"
        message="You'll need to set it up again from scratch if you want to re-enable it later."
        confirmLabel="Turn Off"
      />
    </div>
  );
}
