import { Bell, Wallet, CalendarClock, Info, ShoppingCart } from "lucide-react";
import { useData } from "../context/DataContext";
import { markNotificationRead, markAllNotificationsRead } from "../api/notifications";
import { timeAgo } from "../utils/format";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";

const TYPE_ICON = {
  payment: ShoppingCart,
  schedule: CalendarClock,
  wallet: Wallet,
  system: Info,
};

export default function Notifications() {
  const { notifications, unreadCount, refreshNotifications } = useData();

  async function handleClick(n) {
    if (!n.isRead) {
      await markNotificationRead(n.id);
      refreshNotifications();
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    refreshNotifications();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        </p>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={handleMarkAll}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] || Info;
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  n.isRead
                    ? "border-white/10 bg-[#111111]"
                    : "border-brand-500/30 bg-brand-500/[0.06]"
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{n.message}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
