import { api } from "./client";

export const registerUser = (payload) => api.post("/auth/register", payload).then((r) => r.data);
export const loginUser = (payload) => api.post("/auth/login", payload).then((r) => r.data);
export const fetchMe = () => api.get("/auth/me").then((r) => r.data);
export const updateProfile = (payload) => api.patch("/auth/me", payload).then((r) => r.data);
export const setPin = (pin) => api.post("/auth/pin", { pin }).then((r) => r.data);
export const verifyPinLogin = (userId, pin) =>
  api.post("/auth/verify-pin", { userId, pin }).then((r) => r.data);
export const disablePin = () => api.delete("/auth/pin").then((r) => r.data);
