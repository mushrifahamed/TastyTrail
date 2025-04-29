/* File: ./client_web\src\pages\restaurant-admin\Orders.jsx */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { orderServiceApi } from "../../utils/api";
import { format } from "date-fns";
import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";
import debounce from "lodash/debounce";
import {
  MdShoppingCart,
  MdAccessTime,
  MdCheckCircle,
  MdLocalShipping,
  MdRestaurant,
  MdDoneAll,
  MdCancel,
} from "react-icons/md";

const RestaurantAdminOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const navigate = useNavigate();

  const fetchOrders = useCallback(
    debounce(async (search) => {
      try {
        setLoading(true);
        setError(null);

        if (!user?.restaurantId) {
          setError("No restaurant assigned to this admin");
          return;
        }

        const params = {
          search: search || undefined,
        };

        // Remove undefined or empty params
        Object.keys(params).forEach(
          (key) => (params[key] === undefined || params[key] === "") && delete params[key]
        );

        const response = await orderServiceApi.get(
          `/api/orders/restaurant/${user.restaurantId}`,
          { params }
        );

        const ordersData =
          response.data?.data?.orders ||
          response.data?.orders ||
          response.data ||
          [];

        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (err) {
        console.error("Fetch orders error:", err);
        setError(err.response?.data?.message || "Failed to fetch orders. Please try again.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    [user?.restaurantId]
  );

  useEffect(() => {
    fetchOrders(searchTerm);
    return () => fetchOrders.cancel();
  }, [searchTerm, fetchOrders]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderServiceApi.patch(`/api/orders/${orderId}/status`, {
        status: newStatus,
      });
      fetchOrders(searchTerm);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update order status");
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "placed":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-purple-100 text-purple-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "ready_for_pickup":
        return "bg-orange-100 text-orange-800";
      case "out_for_delivery":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "placed":
        return <MdShoppingCart className="mr-1" />;
      case "confirmed":
        return <MdCheckCircle className="mr-1" />;
      case "preparing":
        return <MdRestaurant className="mr-1" />;
      case "ready_for_pickup":
        return <MdAccessTime className="mr-1" />;
      case "out_for_delivery":
        return <MdLocalShipping className="mr-1" />;
      case "delivered":
        return <MdDoneAll className="mr-1" />;
      case "cancelled":
        return <MdCancel className="mr-1" />;
      default:
        return <MdAccessTime className="mr-1" />;
    }
  };

  const getPaymentBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRefresh = () => {
    fetchOrders(searchTerm);
  };

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
          <div className="flex items-center space-x-4">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search orders by ID or customer..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Order ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Payment
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => viewOrderDetails(order)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order._id?.substring(0, 8) || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.customerInfo?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customerInfo?.phone || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {order.createdAt
                            ? format(new Date(order.createdAt), "MMM dd, yyyy HH:mm")
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${order.totalAmount?.toFixed(2) || "0.00"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(order.trackingStatus)}
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                              order.trackingStatus
                            )}`}
                          >
                            {order.trackingStatus
                              ? order.trackingStatus
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                  )
                                  .join(" ")
                              : "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentBadgeColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus
                            ? order.paymentStatus.charAt(0).toUpperCase() +
                              order.paymentStatus.slice(1)
                            : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewOrderDetails(order);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          No orders found
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Try adjusting your search criteria
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Order Details - #{selectedOrder._id?.substring(0, 8) || "N/A"}
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Name: {selectedOrder.customerInfo?.name || "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Phone: {selectedOrder.customerInfo?.phone || "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Address: {selectedOrder.deliveryAddress || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Date: {selectedOrder.createdAt
                        ? format(new Date(selectedOrder.createdAt), "MMM dd, yyyy HH:mm")
                        : "N/A"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Total: ${selectedOrder.totalAmount?.toFixed(2) || "0.00"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Payment Method: {selectedOrder.paymentType || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                  <div className="mt-2 border-t border-gray-200">
                    {selectedOrder.items?.length > 0 ? (
                      selectedOrder.items.map((item, index) => (
                        <div key={index} className="py-3 border-b border-gray-200">
                          <div className="flex justify-between">
                            <p className="text-sm text-gray-600">
                              {item.name || "Unknown Item"} {item.variation ? `(${item.variation})` : ""}
                            </p>
                            <p className="text-sm text-gray-600">
                              ${item.price?.toFixed(2) || "0.00"} x {item.quantity || 1}
                            </p>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-gray-500 mt-1">Notes: {item.notes}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600 py-3">No items found</p>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Status Updates</h3>
                  <div className="mt-4 space-y-4">
                    {selectedOrder.statusUpdates?.map((update, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {update.status.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(update.timestamp), "MMM dd, yyyy HH:mm")}
                          </p>
                          {update.note && (
                            <p className="text-sm text-gray-500 mt-1">{update.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Update Status</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["confirmed", "preparing", "ready_for_pickup"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => {
                            updateOrderStatus(selectedOrder._id, status);
                            setShowDetailsModal(false);
                          }}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            selectedOrder.trackingStatus === status
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {status
                            .split("_")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, "cancelled");
                        setShowDetailsModal(false);
                      }}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        selectedOrder.trackingStatus === "cancelled"
                          ? "bg-red-500 text-white"
                          : "bg-red-200 text-red-700 hover:bg-red-300"
                      }`}
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantAdminOrders;