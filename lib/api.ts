import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem("accessToken", data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(error.config);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);
