import { useContext, useEffect, useState } from "react";
import api from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";

const RestaurantAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    ordersToday: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // These endpoints would need to be implemented in your backend
        const [todayRes, pendingRes, completedRes, revenueRes] =
          await Promise.all([
            api.get(`/api/restaurants/${user.restaurantId}/orders/today`),
            api.get(
              `/api/restaurants/${user.restaurantId}/orders?status=pending`
            ),
            api.get(
              `/api/restaurants/${user.restaurantId}/orders?status=completed`
            ),
            api.get(`/api/restaurants/${user.restaurantId}/revenue`),
          ]);

        setStats({
          ordersToday: todayRes.data.count,
          pendingOrders: pendingRes.data.count,
          completedOrders: completedRes.data.count,
          totalRevenue: revenueRes.data.amount,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    if (user?.restaurantId) {
      fetchStats();
    }
  }, [user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Restaurant Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Orders Today</h3>
          <p className="text-3xl font-bold">{stats.ordersToday}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Pending Orders</h3>
          <p className="text-3xl font-bold">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Completed Orders</h3>
          <p className="text-3xl font-bold">{stats.completedOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total Revenue</h3>
          <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        {/* Recent orders list would go here */}
        <p className="text-gray-500">No recent orders</p>
      </div>
    </div>
  );
};

export default RestaurantAdminDashboard;
