// client/src/services/api.js
import axios from "axios";

const rawBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
const baseURL = rawBase.replace(/\/+$/, "") + "/api";

const API = axios.create({ baseURL });

// ✅ Add token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Prevent broken tokens like "null" or "undefined"
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

// ✅ If token becomes invalid, logout automatically
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.error;

    if (status === 401 && (msg === "Invalid token" || msg === "No token provided")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(err);
  }
);

export default API;