import { useContext, useEffect, useState } from "react";
import api from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    users: 0,
    restaurantAdmins: 0,
    deliveryPersonnel: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, restaurantAdminsRes, deliveryRes, pendingRes] =
          await Promise.all([
            api.get("/api/users?role=customer"),
            api.get("/api/users?role=restaurant_admin"),
            api.get("/api/users?role=delivery_personnel"),
            api.get("/api/users?status=pending"),
          ]);

        setStats({
          users: usersRes.data.results,
          restaurantAdmins: restaurantAdminsRes.data.results,
          deliveryPersonnel: deliveryRes.data.results,
          pendingRequests: pendingRes.data.results,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-3xl font-bold">{stats.users}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Restaurant Admins</h3>
          <p className="text-3xl font-bold">{stats.restaurantAdmins}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Delivery Personnel</h3>
          <p className="text-3xl font-bold">{stats.deliveryPersonnel}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Pending Requests</h3>
          <p className="text-3xl font-bold">{stats.pendingRequests}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
        {/* Recent activities list would go here */}
      </div>
    </div>
  );
};

export default AdminDashboard;
