import { useContext, useEffect, useState } from "react";
import { userServiceApi, restaurantServiceApi } from '../../utils/api';
import { AuthContext } from "../../context/AuthContext";
import { 
  MdPerson, 
  MdRestaurant, 
  MdShoppingCart, 
  MdAccessTime,
  MdTrendingUp,
  MdNotifications
} from "react-icons/md";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    users: 0,
    restaurantAdmins: 0,
    orders: 0,
    pendingRequests: 0,
    totalRevenue: 0,
    ordersToday: 0
  });
  
  const [orderData, setOrderData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, restaurantAdminsRes, ordersRes, pendingRes, revenueRes, ordersTodayRes] =
          await Promise.all([
            userServiceApi.get("/api/users?role=customer"),
            userServiceApi.get("/api/users?role=restaurant_admin"),
            restaurantServiceApi.get("/api/orders"),
            userServiceApi.get("/api/users?status=pending"),
            restaurantServiceApi.get("/api/orders/revenue"),
            restaurantServiceApi.get("/api/orders/today"),
          ]);

        setStats({
          users: usersRes.data.results,
          restaurantAdmins: restaurantAdminsRes.data.results,
          orders: ordersRes.data.results,
          pendingRequests: pendingRes.data.results,
          totalRevenue: revenueRes.data.total || 0,
          ordersToday: ordersTodayRes.data.count || 0
        });
        
        // Fetch order data for the last 7 days
        const orderHistoryRes = await restaurantServiceApi.get("/api/orders/history");
        setOrderData(orderHistoryRes.data.history || generateMockOrderData());
        
        // Fetch recent activities
        const activitiesRes = await userServiceApi.get("/api/activities");
        setRecentActivities(activitiesRes.data.activities || generateMockActivities());
        
        // Fetch top restaurants
        const topRestaurantsRes = await restaurantServiceApi.get("/api/restaurants/top");
        setTopRestaurants(topRestaurantsRes.data.restaurants || generateMockRestaurants());
        
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        // Set mock data if API calls fail
        setOrderData(generateMockOrderData());
        setRecentActivities(generateMockActivities());
        setTopRestaurants(generateMockRestaurants());
      }
    };

    fetchStats();
  }, []);
  
  // Mock data generator functions
  const generateMockOrderData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      name: day,
      orders: Math.floor(Math.random() * 100),
      revenue: Math.floor(Math.random() * 5000)
    }));
  };
  
  const generateMockActivities = () => {
    return [
      { id: 1, type: 'user_registered', user: 'John Doe', time: '2 hours ago' },
      { id: 2, type: 'order_placed', user: 'Sarah Smith', restaurant: 'Pizza Palace', amount: '$42.50', time: '3 hours ago' },
      { id: 3, type: 'restaurant_approved', restaurant: 'Burger Kingdom', admin: 'Admin User', time: '5 hours ago' },
      { id: 4, type: 'order_delivered', order: '#12345', restaurant: 'Taco Town', time: 'Yesterday' },
      { id: 5, type: 'user_feedback', user: 'Mike Johnson', restaurant: 'Sushi Express', rating: 5, time: 'Yesterday' }
    ];
  };
  
  const generateMockRestaurants = () => {
    return [
      { name: 'Pizza Palace', orders: 120, revenue: 4500 },
      { name: 'Burger Kingdom', orders: 90, revenue: 3200 },
      { name: 'Taco Town', orders: 75, revenue: 2800 },
      { name: 'Sushi Express', orders: 60, revenue: 3600 },
      { name: 'Pasta Paradise', orders: 45, revenue: 2100 }
    ];
  };
  
  const getActivityIcon = (type) => {
    switch(type) {
      case 'user_registered':
        return <MdPerson className="text-blue-500" />;
      case 'order_placed':
        return <MdShoppingCart className="text-green-500" />;
      case 'restaurant_approved':
        return <MdRestaurant className="text-purple-500" />;
      case 'order_delivered':
        return <MdShoppingCart className="text-orange-500" />;
      case 'user_feedback':
        return <MdNotifications className="text-yellow-500" />;
      default:
        return <MdAccessTime className="text-gray-500" />;
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <MdPerson className="text-blue-500 text-2xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Total Users</h3>
            <p className="text-2xl font-bold">{stats.users}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <MdRestaurant className="text-purple-500 text-2xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Restaurants</h3>
            <p className="text-2xl font-bold">{stats.restaurantAdmins}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <MdShoppingCart className="text-green-500 text-2xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold">{stats.orders}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-orange-100 p-3 mr-4">
            <MdAccessTime className="text-orange-500 text-2xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Pending Requests</h3>
            <p className="text-2xl font-bold">{stats.pendingRequests}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <MdTrendingUp className="text-green-500 text-2xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <MdShoppingCart className="text-blue-500 text-2xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Orders Today</h3>
            <p className="text-2xl font-bold">{stats.ordersToday}</p>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders & Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Orders & Revenue (Last 7 Days)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" activeDot={{ r: 8 }} name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Top Restaurants */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Top Performing Restaurants</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRestaurants}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#8884d8" name="Orders" />
                <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="overflow-y-auto max-h-96">
            <ul className="divide-y divide-gray-200">
              {recentActivities.map(activity => (
                <li key={activity.id} className="py-4 flex">
                  <div className="mr-4">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type === 'user_registered' && `New user registered: ${activity.user}`}
                        {activity.type === 'order_placed' && `New order placed by ${activity.user} at ${activity.restaurant}`}
                        {activity.type === 'restaurant_approved' && `Restaurant "${activity.restaurant}" approved by ${activity.admin}`}
                        {activity.type === 'order_delivered' && `Order ${activity.order} from ${activity.restaurant} delivered`}
                        {activity.type === 'user_feedback' && `${activity.user} rated ${activity.restaurant} (${activity.rating}/5)`}
                      </p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    {activity.type === 'order_placed' && (
                      <p className="text-sm text-gray-500">{activity.amount}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* User Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Users', value: stats.users },
                    { name: 'Restaurants', value: stats.restaurantAdmins },
                    { name: 'Pending', value: stats.pendingRequests }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {[0, 1, 2].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Users</span>
              </div>
              <span className="text-sm font-medium">{stats.users}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Restaurants</span>
              </div>
              <span className="text-sm font-medium">{stats.restaurantAdmins}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="text-sm font-medium">{stats.pendingRequests}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;