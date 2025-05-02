import { useContext, useEffect, useState, useRef } from "react";
import { restaurantServiceApi } from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";

const RestaurantAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "main",
  });
  const [editMode, setEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.restaurantId) {
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          setTimeout(() => {
            console.log(`Retrying fetch (attempt ${retryCountRef.current}/${maxRetries})...`);
            fetchData();
          }, 1000);
          return;
        }
        setError("No restaurant ID found for this user");
        setLoading(false);
        toast.error("No restaurant ID found", { theme: "colored" });
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching restaurant data for ID:", user.restaurantId);

        const restaurantRes = await restaurantServiceApi.get(`/api/restaurants/${user.restaurantId}`);
        console.log("Restaurant API response:", restaurantRes);

        const restaurantData = restaurantRes.data.data?.restaurant || restaurantRes.data.restaurant;
        if (!restaurantData) {
          throw new Error("Restaurant data not found in response");
        }

        setRestaurant(restaurantData);
        const menu = restaurantData.menu || [];
        setMenuItems(Array.isArray(menu) ? menu : []);
        retryCountRef.current = 0;
      } catch (err) {
        console.error("Fetch error:", err);
        console.error("Error response:", err.response?.data);
        setError(err.response?.data?.message || err.message || "Failed to fetch restaurant data");
        toast.error("Failed to load restaurant data", { theme: "colored" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const validateForm = () => {
    const errors = {};
    if (!newMenuItem.name.trim()) errors.name = "Name is required";
    if (!newMenuItem.price || parseFloat(newMenuItem.price) <= 0) errors.price = "Price must be a positive number";
    if (newMenuItem.description && newMenuItem.description.length > 200) errors.description = "Description must be 200 characters or less";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMenuItem((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await restaurantServiceApi.post(
        `/api/restaurants/${user.restaurantId}/menu`,
        newMenuItem
      );

      console.log("Add menu item response:", response);

      if (response.data.status === "success") {
        setMenuItems((prev) => [...prev, response.data.data.menuItem]);
        resetForm();
        setShowModal(false);
        toast.success("Menu item added successfully", { theme: "colored" });
      } else {
        throw new Error(response.data.message || "Failed to add menu item");
      }
    } catch (err) {
      console.error("Add menu item error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Failed to add menu item", {
        theme: "colored",
      });
    }
  };

  const handleEditMenuItem = (item) => {
    setEditMode(true);
    setCurrentItemId(item._id);
    setNewMenuItem({
      name: item.name || "",
      description: item.description || "",
      price: item.price ? item.price.toString() : "",
      category: item.category || "main",
    });
    setShowModal(true);
  };

  const handleUpdateMenuItem = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await restaurantServiceApi.put(
        `/api/restaurants/${user.restaurantId}/menu/${currentItemId}`,
        newMenuItem
      );

      console.log("Update menu item response:", response);

      const updatedItems = menuItems.map((item) => (item._id === currentItemId ? response.data.data.menuItem : item));
      setMenuItems(updatedItems);
      resetForm();
      setShowModal(false);
      toast.success("Menu item updated successfully", { theme: "colored" });
    } catch (err) {
      console.error("Update menu item error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to update menu item", { theme: "colored" });
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;

    try {
      const response = await restaurantServiceApi.delete(`/api/restaurants/${user.restaurantId}/menu/${itemId}`);
      console.log("Delete menu item response:", response);

      const updatedItems = menuItems.filter((item) => item._id !== itemId);
      setMenuItems(updatedItems);
      toast.success("Menu item deleted successfully", { theme: "colored" });
    } catch (err) {
      console.error("Delete menu item error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to delete menu item", { theme: "colored" });
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setCurrentItemId(null);
    setNewMenuItem({
      name: "",
      description: "",
      price: "",
      category: "main",
    });
    setFormErrors({});
  };

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case "appetizer":
        return "bg-orange-100 text-orange-800";
      case "main":
        return "bg-green-100 text-green-800";
      case "dessert":
        return "bg-pink-100 text-pink-800";
      case "beverage":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    switch (activeTab) {
      case "appetizer":
        return matchesSearch && item.category === "appetizer";
      case "main":
        return matchesSearch && item.category === "main";
      case "dessert":
        return matchesSearch && item.category === "dessert";
      case "beverage":
        return matchesSearch && item.category === "beverage";
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
        <p>{error}</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
        <p>No restaurant data found. Please check the restaurant ID or API configuration.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">{restaurant.name} - Menu Management</h1>
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search menu items by name or description..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search menu items"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {["all", "appetizer", "main", "dessert", "beverage"].map((tab) => {
                const tabLabels = {
                  all: "All Items",
                  appetizer: "Appetizers",
                  main: "Main Courses",
                  dessert: "Desserts",
                  beverage: "Beverages",
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    aria-label={`Filter by ${tabLabels[tab]}`}
                  >
                    {tabLabels[tab]}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Add Menu Item Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            aria-label="Add new menu item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Menu Item
          </button>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMenuItems.length > 0 ? (
                  filteredMenuItems.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{`LKR ${item.price.toFixed(2)}`}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 max-w-xs truncate">{item.description || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditMenuItem(item)}
                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            aria-label="Edit menu item"
                          >
                            <MdEdit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item._id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                            aria-label="Delete menu item"
                          >
                            <MdDelete className="h-4 w-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No menu items found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Menu Item Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-md max-w-lg w-full mx-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editMode ? "Edit Menu Item" : "Add Menu Item"}
              </h2>
              <form onSubmit={editMode ? handleUpdateMenuItem : handleAddMenuItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newMenuItem.name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? "border-red-500" : ""
                    }`}
                    required
                    placeholder="Enter item name"
                    aria-describedby={formErrors.name ? "name-error" : undefined}
                  />
                  {formErrors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    name="category"
                    value={newMenuItem.category}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="appetizer">Appetizer</option>
                    <option value="main">Main Course</option>
                    <option value="dessert">Dessert</option>
                    <option value="beverage">Beverage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price (LKR)</label>
                  <input
                    type="number"
                    name="price"
                    value={newMenuItem.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.price ? "border-red-500" : ""
                    }`}
                    required
                    placeholder="Enter price"
                    aria-describedby={formErrors.price ? "price-error" : undefined}
                  />
                  {formErrors.price && (
                    <p id="price-error" className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={newMenuItem.description}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.description ? "border-red-500" : ""
                    }`}
                    placeholder="Enter description (optional)"
                    maxLength="200"
                    aria-describedby={formErrors.description ? "description-error" : undefined}
                  />
                  {formErrors.description && (
                    <p id="description-error" className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowModal(false);
                    }}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    aria-label="Cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    aria-label={editMode ? "Update menu item" : "Add menu item"}
                  >
                    {editMode ? "Update Item" : "Add Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantAdminDashboard;