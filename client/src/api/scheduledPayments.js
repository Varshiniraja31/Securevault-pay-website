import { api } from "./client";

export const fetchScheduledPayments = () =>
  api.get("/scheduled-payments").then((r) => r.data.scheduledPayments);
export const createScheduledPayment = (payload) =>
  api.post("/scheduled-payments", payload).then((r) => r.data.scheduledPayment);
export const updateScheduledPayment = (id, payload) =>
  api.patch(`/scheduled-payments/${id}`, payload).then((r) => r.data.scheduledPayment);
export const updateScheduledPaymentStatus = (id, status) =>
  api.patch(`/scheduled-payments/${id}/status`, { status }).then((r) => r.data.scheduledPayment);
export const deleteScheduledPayment = (id) =>
  api.delete(`/scheduled-payments/${id}`).then((r) => r.data);
