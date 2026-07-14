import { Link } from "react-router-dom";
import { Bell, ShieldCheck } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Header({ title }) {
  const { unreadCount } = useData();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/90 px-4 py-3.5 backdrop-blur sm:px-6 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2a0f0f] text-red-500">
          <ShieldCheck size={16} />
        </div>
        <p className="text-sm font-bold text-white">{title || "SecureVault Pay"}</p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/notifications" className="relative rounded-full p-2 text-gray-400 hover:bg-white/10">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
          )}
        </Link>
        <Link
          to="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: user?.avatarColor }}
        >
          {user?.name?.[0]?.toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
