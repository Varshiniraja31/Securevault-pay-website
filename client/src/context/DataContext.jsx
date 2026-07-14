import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { fetchWallets } from "../api/wallets";
import { fetchTransactions } from "../api/payments";
import { fetchScheduledPayments } from "../api/scheduledPayments";
import { fetchNotifications } from "../api/notifications";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshWallets = useCallback(async () => {
    const data = await fetchWallets();
    setWallets(data);
    return data;
  }, []);

  const refreshTransactions = useCallback(async () => {
    const data = await fetchTransactions();
    setTransactions(data);
    return data;
  }, []);

  const refreshScheduledPayments = useCallback(async () => {
    const data = await fetchScheduledPayments();
    setScheduledPayments(data);
    return data;
  }, []);

  const refreshNotifications = useCallback(async () => {
    const data = await fetchNotifications();
    setNotifications(data);
    return data;
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshWallets(),
      refreshTransactions(),
      refreshScheduledPayments(),
      refreshNotifications(),
    ]);
  }, [refreshWallets, refreshTransactions, refreshScheduledPayments, refreshNotifications]);

  useEffect(() => {
    if (!user) {
      setWallets([]);
      setTransactions([]);
      setScheduledPayments([]);
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshAll().finally(() => setLoading(false));
  }, [user, refreshAll]);

  const mainWallet = wallets.find((w) => w.type === "main");
  const purposeWallets = wallets.filter((w) => w.type === "purpose");
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DataContext.Provider
      value={{
        wallets,
        mainWallet,
        purposeWallets,
        transactions,
        scheduledPayments,
        notifications,
        unreadCount,
        loading,
        refreshWallets,
        refreshTransactions,
        refreshScheduledPayments,
        refreshNotifications,
        refreshAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
