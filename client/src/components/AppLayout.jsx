import { Outlet, useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import Header from "./Header";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

const TITLES = {
  "/dashboard": "Dashboard",
  "/wallets": "Wallets",
  "/schedule": "Scheduled Payments",
  "/history": "Transaction History",
  "/analytics": "Analytics",
  "/notifications": "Notifications",
  "/profile": "Profile",
};

export default function AppLayout() {
  const location = useLocation();
  const { unreadCount } = useData();
  const { user } = useAuth();

  const title =
    Object.entries(TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    "SecureVault Pay";

  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header title={title} />
        <header className="hidden items-center justify-between border-b border-white/10 bg-black px-8 py-4 lg:flex">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/notifications"
              className="relative rounded-full p-2 text-gray-400 hover:bg-white/10"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-rose-500" />
              )}
            </Link>
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ring-offset-2 ring-offset-black transition hover:ring-2 hover:ring-brand-500"
              style={{ backgroundColor: user?.avatarColor }}
              title="View profile"
            >
              {user?.name?.[0]?.toUpperCase()}
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
