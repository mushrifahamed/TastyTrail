import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Auth/Login";
import RestaurantAdminRequest from "./pages/Auth/RestaurantAdminRequest";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminRestaurantAdmins from "./pages/admin/RestaurantAdmins";
import RestaurantManagement from "./pages/admin/RestaurantManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import RestaurantAdminDashboard from "./pages/restaurant-admin/Dashboard";
import RestaurantAdminProfile from "./pages/restaurant-admin/Profile";
import RestaurantAdminOrders from "./pages/restaurant-admin/Orders";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route
            path="/restaurant-admin/request"
            element={<RestaurantAdminRequest />}
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={<ProtectedRoute allowedRoles={["admin"]} />}
          >
            <Route element={<Layout role="admin" />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route
                path="restaurant-admins"
                element={<AdminRestaurantAdmins />}
              />
              <Route
                path="restaurant-management"
                element={<RestaurantManagement />}
              />

              <Route path="orders" 
              element={<OrderManagement />}
              />

            </Route>
          </Route>

          {/* Restaurant admin routes */}
          <Route
            path="/restaurant-admin"
            element={<ProtectedRoute allowedRoles={["restaurant_admin"]} />}
          >
            <Route element={<Layout role="restaurant_admin" />}>
              <Route index element={<RestaurantAdminDashboard />} />
              <Route path="profile" element={<RestaurantAdminProfile />} />
              <Route path="orders" element={<RestaurantAdminOrders />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

