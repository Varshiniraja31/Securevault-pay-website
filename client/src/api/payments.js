import { api } from "./client";

export const makePayment = (payload) => api.post("/payments/pay", payload).then((r) => r.data);
export const fetchTransactions = (params) =>
  api.get("/payments/transactions", { params }).then((r) => r.data.transactions);
