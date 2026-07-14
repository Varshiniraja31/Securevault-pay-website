import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Pencil,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  CalendarClock,
  Bell,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Button from "../components/Button";
import EditProfileModal from "../components/modals/EditProfileModal";

export default function Profile() {
  const { user, logout } = useAuth();
  const { wallets, scheduledPayments } = useData();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const activeSchedules = scheduledPayments.filter((p) => p.status === "active").length;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";

  const rows = [
    {
      icon: ShieldCheck,
      color: "#ef4444",
      title: "Security Settings",
      subtitle: user?.twoFactorEnabled ? "2FA active" : "2FA off",
      onClick: () => navigate("/security"),
    },
    {
      icon: Wallet,
      color: "#a855f7",
      title: "Manage Wallets",
      subtitle: `${wallets.length} active wallets`,
      onClick: () => navigate("/wallets"),
    },
    {
      icon: CalendarClock,
      color: "#f59e0b",
      title: "Scheduled Payments",
      subtitle: `${activeSchedules} active schedules`,
      onClick: () => navigate("/schedule"),
    },
    {
      icon: Bell,
      color: "#3b82f6",
      title: "Notifications",
      subtitle: "All alerts enabled",
      onClick: () => navigate("/notifications"),
    },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-[#2a0f0f] to-black p-5">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
          style={{ backgroundColor: user?.avatarColor }}
        >
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-white">{user?.name}</p>
          {user?.phone && <p className="text-sm text-gray-400">{user.phone}</p>}
          <p className="truncate text-sm text-gray-400">{user?.email}</p>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-gray-300 hover:bg-white/20"
        >
          <Pencil size={15} />
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
        <CheckCircle2 size={22} className="shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">KYC Verified</p>
          <p className="text-xs text-gray-400">
            Full access enabled{memberSince ? ` · Since ${memberSince}` : ""}
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
          Active
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.map(({ icon: Icon, color, title, subtitle, onClick }) => (
          <button
            key={title}
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#111111] p-4 text-left transition hover:border-white/20"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}22`, color }}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-gray-600" />
          </button>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={logout}>
        <LogOut size={16} /> Log Out
      </Button>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
