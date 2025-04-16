import { useContext, useEffect, useState } from "react";
import api from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";

const AdminRestaurantAdmins = () => {
  const { user } = useContext(AuthContext);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await api.get("/api/users?role=restaurant_admin");
        setAdmins(response.data.users);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch admins");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  const approveAdmin = async (userId, restaurantId) => {
    try {
      await api.patch("/api/users/restaurant-admin/approve", {
        userId,
        restaurantId,
      });
      setAdmins(
        admins.map((admin) =>
          admin._id === userId
            ? { ...admin, isActive: true, status: "approved" }
            : admin
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve admin");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Restaurant Admins Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Restaurant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin._id}>
                <td className="px-6 py-4 whitespace-nowrap">{admin.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{admin.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {admin.restaurantDetails?.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      admin.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : admin.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {admin.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!admin.isActive && (
                    <button
                      onClick={() =>
                        approveAdmin(admin._id, "restaurant-id-here")
                      }
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRestaurantAdmins;
