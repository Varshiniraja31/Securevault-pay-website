import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  WalletCards,
  CalendarClock,
  BarChart3,
  Bell,
  User,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/wallets", label: "Wallets", icon: WalletCards },
  { to: "/schedule", label: "Scheduled Payments", icon: CalendarClock },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useData();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a0a0a] px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2a0f0f] text-red-500">
          <ShieldCheck size={20} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">SecureVault</p>
          <p className="text-[11px] leading-tight text-gray-500">Pay</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {label === "Notifications" && unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: user?.avatarColor }}
        >
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg p-2 text-gray-500 hover:bg-white/10 hover:text-rose-400"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
