import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("[INTERCEPTOR] Sending token:", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
