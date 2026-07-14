import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, KeyRound, ArrowRight, Smartphone, ChevronLeft, Check } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { AuthLabel, AuthInput } from "../components/AuthInput";
import OtpInput from "../components/OtpInput";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function Login() {
  const { verifyCredentials, finalizeSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials");
  const [form, setForm] = useState({ mobile: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [pendingSession, setPendingSession] = useState(null);
  const [otp, setOtp] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  function sendOtp() {
    const code = generateOtp();
    setExpectedOtp(code);
    setOtp("");
    setSecondsLeft(RESEND_SECONDS);
    toast.success(`Demo OTP: ${code}`);
  }

  async function finishLogin(session) {
    setStep("verified");
    await new Promise((resolve) => setTimeout(resolve, 1100));
    finalizeSession(session.token, session.user);
    navigate("/dashboard");
  }

  async function handleCredentialsSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await verifyCredentials(form.email, form.password);
      setPendingSession(session);
      if (session.user.twoFactorEnabled) {
        sendOtp();
        setStep("otp");
      } else {
        await finishLogin(session);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) return;
    if (otp !== expectedOtp) {
      setError("Incorrect code. Please try again.");
      return;
    }
    setError("");
    await finishLogin(pendingSession);
  }

  if (step === "verified") {
    return (
      <AuthLayout icon={null}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_50px_rgba(34,197,94,0.25)]">
            <Check size={44} className="text-emerald-400" />
          </div>
          <h1 className="mt-7 text-3xl font-bold text-white">Identity Verified!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back, {pendingSession?.user?.name}!
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (step === "otp") {
    const target = form.mobile ? `+91 ${form.mobile}` : form.email;
    return (
      <AuthLayout icon={Smartphone}>
        <button
          onClick={() => setStep("credentials")}
          className="mb-6 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>

        <h1 className="text-3xl font-bold text-white">Verify your number</h1>
        <p className="mt-2 text-sm text-gray-500">
          6-digit code sent to <span className="font-semibold text-white">{target}</span>
        </p>

        <form onSubmit={handleVerifyOtp} className="mt-9 space-y-5">
          <OtpInput length={OTP_LENGTH} value={otp} onChange={setOtp} />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={otp.length !== OTP_LENGTH}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5449] to-[#e2362b] py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(226,54,43,0.35)] transition hover:brightness-105 disabled:opacity-40"
          >
            Verify OTP
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {secondsLeft > 0 ? (
            <>
              Resend in <span className="font-semibold text-red-500">0:{String(secondsLeft).padStart(2, "0")}</span>
            </>
          ) : (
            <button onClick={sendOtp} className="font-semibold text-red-500 hover:text-red-400">
              Resend OTP
            </button>
          )}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-center text-3xl font-bold text-white">Welcome back</h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Sign in to manage your finances securely
      </p>

      <form onSubmit={handleCredentialsSubmit} className="mt-9 space-y-5">
        <div>
          <AuthLabel>Mobile Number</AuthLabel>
          <AuthInput
            icon={Phone}
            prefix="+91"
            type="tel"
            placeholder="Enter mobile number"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
        </div>

        <div>
          <AuthLabel>Or Email Address</AuthLabel>
          <AuthInput
            icon={Mail}
            type="email"
            required
            placeholder="Enter email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <AuthLabel>Password</AuthLabel>
          <AuthInput
            icon={KeyRound}
            type="password"
            required
            placeholder="Enter password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff5449] to-[#e2362b] py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(226,54,43,0.35)] transition hover:brightness-105 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Continue"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-gray-500">New to SecureVault?</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        onClick={() => navigate("/signup")}
        className="w-full rounded-xl border border-red-500/40 py-3.5 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
      >
        Create Account
      </button>
    </AuthLayout>
  );
}
