import { api } from "./client";

export const fetchWallets = () => api.get("/wallets").then((r) => r.data.wallets);
export const createWallet = (payload) => api.post("/wallets", payload).then((r) => r.data.wallet);
export const deleteWallet = (id) => api.delete(`/wallets/${id}`).then((r) => r.data);
export const topUpMainWallet = (payload) =>
  api.post("/wallets/topup", payload).then((r) => r.data);
export const withdrawFromMainWallet = (payload) =>
  api.post("/wallets/withdraw", payload).then((r) => r.data);
export const transferBetweenWallets = (payload) =>
  api.post("/wallets/transfer", payload).then((r) => r.data);
