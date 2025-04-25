import { useContext, useEffect, useState } from "react";
import { userServiceApi } from "../../utils/api"; // Import userServiceApi
import { AuthContext } from "../../context/AuthContext";

const AdminDeliveryPersonnel = () => {
  const { user } = useContext(AuthContext);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeliveryPersons = async () => {
      try {
        const response = await userServiceApi.get("/api/users?role=delivery_personnel"); // Use userServiceApi
        setDeliveryPersons(response.data.users);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch delivery personnel"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryPersons();
  }, []);

  const approveDeliveryPerson = async (userId) => {
    try {
      await userServiceApi.patch("/api/users/delivery/approve", { userId }); // Use userServiceApi
      setDeliveryPersons(
        deliveryPersons.map((person) =>
          person._id === userId
            ? { ...person, isActive: true, status: "approved" }
            : person
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to approve delivery person"
      );
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Delivery Personnel Management</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
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
            {deliveryPersons.map((person) => (
              <tr key={person._id}>
                <td className="px-6 py-4 whitespace-nowrap">{person.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{person.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {person.vehicleInfo?.type} ({person.vehicleInfo?.number})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      person.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : person.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {person.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!person.isActive && (
                    <button
                      onClick={() => approveDeliveryPerson(person._id)}
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

export default AdminDeliveryPersonnel;