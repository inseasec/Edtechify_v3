import axios from "axios";

const api = axios.create({
  baseURL: window._CONFIG_.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (
    token &&
    token !== "null" &&
    token !== "undefined" &&
    !String(token).startsWith("Bearer null")
  ) {
    config.headers.Authorization = String(token).startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return config;
});

export default api;
