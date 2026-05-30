import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Access token lives only in memory — never in localStorage
// Refresh token lives in an HttpOnly cookie managed by the server
let _accessToken: string | null = null;
let _refreshPromise: Promise<string> | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export const api = axios.create({
  baseURL: BASE,
  adapter: "fetch",
  withCredentials: true, // send HttpOnly refresh cookie on every request
});

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && typeof window !== "undefined") {
      original._retry = true;
      try {
        const token = await refreshSilently();
        original.headers.Authorization = `Bearer ${token}`;
        return api.request(original);
      } catch {
        setAccessToken(null);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export async function refreshSilently(): Promise<string> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = axios
    .post(`${BASE}/auth/refresh`, {}, { withCredentials: true })
    .then(({ data }) => {
      setAccessToken(data.accessToken);
      _refreshPromise = null;
      return data.accessToken as string;
    })
    .catch((err) => {
      _refreshPromise = null;
      setAccessToken(null);
      throw err;
    });

  return _refreshPromise;
}
