import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, KeyRound, ArrowRight } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { AuthLabel, AuthInput } from "../components/AuthInput";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-center text-3xl font-bold text-white">Create your vault</h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Set up your Main Wallet and start organizing your money
      </p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <div>
          <AuthLabel>Full Name</AuthLabel>
          <AuthInput
            icon={User}
            required
            placeholder="Enter your full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <AuthLabel>Mobile Number</AuthLabel>
          <AuthInput
            icon={Phone}
            prefix="+91"
            type="tel"
            placeholder="Enter mobile number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div>
          <AuthLabel>Email Address</AuthLabel>
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
            minLength={6}
            placeholder="At least 6 characters"
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
          {loading ? "Creating account..." : "Create Account"}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-gray-500">Already have an account?</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        onClick={() => navigate("/login")}
        className="w-full rounded-xl border border-red-500/40 py-3.5 text-sm font-bold text-red-500 transition hover:bg-red-500/10"
      >
        Log In
      </button>
    </AuthLayout>
  );
}
