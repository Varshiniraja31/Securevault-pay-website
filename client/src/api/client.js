import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("svp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    return Promise.reject(new Error(message));
  }
);
