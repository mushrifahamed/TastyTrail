import { useContext, useEffect, useState } from "react";
import { restaurantServiceApi } from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { MdEdit, MdDelete, MdAddPhotoAlternate, MdImage } from "react-icons/md";

const RestaurantAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "main",
    image: null
  });
  const [editMode, setEditMode] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    popularCategory: "",
    averagePrice: 0
  });

  // API base URL
  const API_BASE_URL = "http://localhost:3001"; // Adjust this to your actual API base URL

  // Fetch restaurant and menu data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch restaurant details
        const restaurantRes = await restaurantServiceApi.get(
          `/api/restaurants/${user.restaurantId}`
        );
        setRestaurant(restaurantRes.data.data);
        
        // Set menu items from restaurant data
        if (restaurantRes.data.data?.menu) {
          setMenuItems(restaurantRes.data.data.menu);
          calculateStats(restaurantRes.data.data.menu);
        }
        
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch data");
        toast.error("Failed to load restaurant data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.restaurantId) {
      fetchData();
    }
  }, [user]);

  const calculateStats = (items) => {
    if (!items || items.length === 0) return;
    
    // Calculate total items
    const totalItems = items.length;
    
    // Find popular category
    const categoryCount = {};
    items.forEach(item => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
    });
    const popularCategory = Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b
    );
    
    // Calculate average price
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const averagePrice = totalPrice / items.length;
    
    setStats({
      totalItems,
      popularCategory,
      averagePrice: parseFloat(averagePrice.toFixed(2))
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMenuItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewMenuItem(prev => ({
        ...prev,
        image: e.target.files[0]
      }));
    }
  };

  // Add new menu item
  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Append menu item data
      formData.append("name", newMenuItem.name);
      formData.append("description", newMenuItem.description);
      formData.append("price", newMenuItem.price);
      formData.append("category", newMenuItem.category);
      
      if (newMenuItem.image) {
        formData.append("menuItemImage", newMenuItem.image);
      }

      const response = await restaurantServiceApi.post(
        `/api/restaurants/${user.restaurantId}/menu`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        }
      );

      if (response.data.status === "success") {
        setMenuItems(prev => [...prev, response.data.data.menuItem]);
        setNewMenuItem({
          name: "",
          description: "",
          price: "",
          category: "main",
          image: null
        });
        toast.success("Menu item added successfully");
      } else {
        throw new Error(response.data.message || "Failed to add menu item");
      }
    } catch (err) {
      console.error("Full error details:", err);
      console.error("Error response data:", err.response?.data);
      toast.error(
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        "Failed to add menu item"
      );
    }
  };

  const handleEditMenuItem = (item) => {
    setEditMode(true);
    setCurrentItemId(item._id);
    setNewMenuItem({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: null
    });
  };

  // Update menu item
  const handleUpdateMenuItem = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Append menu item data
      formData.append("name", newMenuItem.name);
      formData.append("description", newMenuItem.description);
      formData.append("price", newMenuItem.price);
      formData.append("category", newMenuItem.category);
      
      if (newMenuItem.image) {
        formData.append("menuItemImage", newMenuItem.image);
      }

      const response = await restaurantServiceApi.put(
        `/api/restaurants/${user.restaurantId}/menu/${currentItemId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );
      
      const updatedItems = menuItems.map(item => 
        item._id === currentItemId ? response.data.data.menuItem : item
      );
      setMenuItems(updatedItems);
      calculateStats(updatedItems);
      setEditMode(false);
      setNewMenuItem({
        name: "",
        description: "",
        price: "",
        category: "main",
        image: null
      });
      toast.success("Menu item updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update menu item");
    }
  };

  // Delete menu item
  const handleDeleteMenuItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;
    
    try {
      await restaurantServiceApi.delete(
        `/api/restaurants/${user.restaurantId}/menu/${itemId}`
      );
      
      const updatedItems = menuItems.filter(item => item._id !== itemId);
      setMenuItems(updatedItems);
      calculateStats(updatedItems);
      toast.success("Menu item deleted successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete menu item");
    }
  };

  // Function to get the image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // Check if the image path already includes the base URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Ensure the path doesn't start with a slash if it's already in the image path
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${API_BASE_URL}${path}`;
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!restaurant) return <div className="p-6">No restaurant data found</div>;

  return (
    <div className="p-4 max-w-full">
      <h1 className="text-2xl font-bold mb-6">
        {restaurant.name} - Dashboard
      </h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total Menu Items</h3>
          <p className="text-3xl font-bold">{stats.totalItems}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Popular Category</h3>
          <p className="text-3xl font-bold capitalize">{stats.popularCategory || "N/A"}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Average Price</h3>
          <p className="text-3xl font-bold">{`LKR ${stats.averagePrice.toFixed(2)}`}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editMode ? "Edit Menu Item" : "Add New Menu Item"}
        </h2>
        <form onSubmit={editMode ? handleUpdateMenuItem : handleAddMenuItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={newMenuItem.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={newMenuItem.category}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="appetizer">Appetizer</option>
                <option value="main">Main Course</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="number"
                name="price"
                value={newMenuItem.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                name="description"
                value={newMenuItem.description}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                {editMode ? "Update Image (leave blank to keep current)" : "Image"}
              </label>
              <div className="mt-1 flex items-center">
                <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <span className="flex items-center">
                    <MdAddPhotoAlternate className="mr-2" />
                    {newMenuItem.image ? newMenuItem.image.name : "Choose File"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            {editMode && (
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setNewMenuItem({
                    name: "",
                    description: "",
                    price: "",
                    category: "main",
                    image: null
                  });
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {editMode ? "Update Item" : "Add Item"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Current Menu</h2>
        {menuItems.length === 0 ? (
          <p className="text-gray-500">No menu items added yet</p>
        ) : (
          <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {item.image ? (
                          <img 
                            src={getImageUrl(item.image)} 
                            alt={item.name}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              console.log('Image failed to load:', item.image);
                              e.target.onerror = null;
                              e.target.src = ''; // Fallback to placeholder
                              e.target.classList.add('bg-gray-200');
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <MdImage className="text-gray-400 text-xl" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{item.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm capitalize">{item.category}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{`LKR ${item.price.toFixed(2)}`}</td>
                      <td className="hidden md:table-cell px-4 py-4 text-sm">
                        <div className="max-w-xs truncate">{item.description || "-"}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditMenuItem(item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            title="Edit"
                          >
                            <MdEdit className="mr-1" /> 
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item._id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="Delete"
                          >
                            <MdDelete className="mr-1" /> 
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantAdminDashboard;