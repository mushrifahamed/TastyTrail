import axios from "axios";

// Create an axios instance for user service (running on port 3000)
const userServiceApi = axios.create({
  baseURL: "http://localhost:3000", // User service running on port 3000
});

// Create an axios instance for restaurant service (running on port 3001)
const restaurantServiceApi = axios.create({
  baseURL: "http://localhost:3001", // Restaurant service running on port 3001
});

const orderServiceApi = axios.create({
  baseURL: "http://localhost:3002", // Order service running on port 3002
});

// Add a request interceptor to include the token for both services
const addAuthToken = (config) => {
  const token = localStorage.getItem("token");
  console.log("[INTERCEPTOR] Sending token:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Interceptor for User Service API
userServiceApi.interceptors.request.use(
  addAuthToken,
  (error) => Promise.reject(error)
);

// Interceptor for Restaurant Service API
restaurantServiceApi.interceptors.request.use(
  addAuthToken,
  (error) => Promise.reject(error)
);

// Add request interceptor to include auth token
orderServiceApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor (Optional): Can be used to handle token expiration or error logging
const handleResponseError = (error) => {
  if (error.response && error.response.status === 401) {
    console.error("Unauthorized request. Please login again.");
  }
  return Promise.reject(error);
};

// Add response interceptors for both services
userServiceApi.interceptors.response.use(
  (response) => response,
  handleResponseError
);

restaurantServiceApi.interceptors.response.use(
  (response) => response,
  handleResponseError
);

// Export the instances to use for different services
export { userServiceApi, restaurantServiceApi, orderServiceApi };