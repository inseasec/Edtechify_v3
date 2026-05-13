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

// Redirect to sign-in on auth failures so users aren't stuck on screens
// where every request silently fails (e.g. expired JWT after 10h).
// Only acts when the request actually carried a token, so flows like
// wrong-password on the signin page continue to surface their own errors.
let isRedirectingToSignin = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const hadToken = !!localStorage.getItem("authToken");

    if (status === 401 && hadToken && !isRedirectingToSignin) {
      isRedirectingToSignin = true;
      localStorage.removeItem("authToken");

      if (window.location.pathname !== "/signin") {
        window.location.replace("/signin?expired=1");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
