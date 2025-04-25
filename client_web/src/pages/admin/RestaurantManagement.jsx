import RestaurantAdminAssignment from "../../components/RestaurantAdminAssignment";
import { useState, useEffect } from "react";
import { restaurantServiceApi } from "../../utils/api";
import { useNavigate } from "react-router-dom";

const RestaurantManagement = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    description: "",
    address: {
      street: "",
      city: "",
      country: "",
      geoCoordinates: {
        longitude: "",
        latitude: "",
      },
    },
    operatingHours: {
      from: "",
      to: ""
    },
    menu: [
      {
        name: "",
        description: "",
        price: "",
        category: "",
        image: null
      }
    ]
  });
  const [coverImage, setCoverImage] = useState(null);
  const [menuItemImages, setMenuItemImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Fetch restaurants when component mounts
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantServiceApi.get("/api/restaurants");
        if (response.data?.status === "success" && Array.isArray(response.data?.data?.restaurants)) {
          setRestaurants(response.data.data.restaurants);
        } else {
          setError("Invalid response format: Expected an array.");
        }
      } catch (err) {
        setError("Error fetching restaurants.");
      }
    };

    fetchRestaurants();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewRestaurant(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewRestaurant(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value,
      },
    }));
  };

  const handleGeoCoordinatesChange = (e) => {
    const { name, value } = e.target;
    setNewRestaurant(prev => ({
      ...prev,
      address: {
        ...prev.address,
        geoCoordinates: {
          ...prev.address.geoCoordinates,
          [name]: value,
        },
      },
    }));
  };

  const handleOperatingHoursChange = (e) => {
    const { name, value } = e.target;
    setNewRestaurant(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [name]: value,
      },
    }));
  };

  const handleCoverImageChange = (e) => {
    setCoverImage(e.target.files[0]);
  };

  const handleMenuItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedMenu = [...newRestaurant.menu];
    updatedMenu[index] = {
      ...updatedMenu[index],
      [name]: value
    };
    setNewRestaurant(prev => ({
      ...prev,
      menu: updatedMenu
    }));
  };

  const handleMenuItemImageChange = (index, e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const updatedImages = [...menuItemImages];
      updatedImages[index] = files[0];
      setMenuItemImages(updatedImages);
    }
  };

  const addMenuItem = () => {
    setNewRestaurant(prev => ({
      ...prev,
      menu: [
        ...prev.menu,
        {
          name: "",
          description: "",
          price: "",
          category: "",
          image: null
        }
      ]
    }));
  };

  const removeMenuItem = (index) => {
    const updatedMenu = [...newRestaurant.menu];
    updatedMenu.splice(index, 1);
    setNewRestaurant(prev => ({
      ...prev,
      menu: updatedMenu
    }));
    
    const updatedImages = [...menuItemImages];
    updatedImages.splice(index, 1);
    setMenuItemImages(updatedImages);
  };

    const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        // Validate required fields before sending
        if (!newRestaurant.name || !newRestaurant.address.geoCoordinates.longitude || !newRestaurant.address.geoCoordinates.latitude) {
        throw new Error('Name and geo coordinates are required');
        }

        const formData = new FormData();
        
        // Append basic fields
        formData.append("name", newRestaurant.name.trim());
        formData.append("description", newRestaurant.description?.trim() || '');
        
        // Append address with proper numeric conversion
        formData.append("address", JSON.stringify({
        street: newRestaurant.address.street?.trim() || '',
        city: newRestaurant.address.city?.trim() || '',
        country: newRestaurant.address.country?.trim() || '',
        geoCoordinates: {
            longitude: parseFloat(newRestaurant.address.geoCoordinates.longitude),
            latitude: parseFloat(newRestaurant.address.geoCoordinates.latitude)
        }
        }));
        
        // Append operating hours with defaults
        formData.append("operatingHours", JSON.stringify({
        from: newRestaurant.operatingHours.from || '09:00',
        to: newRestaurant.operatingHours.to || '21:00'
        }));
        
        // Process and validate menu items
        const validatedMenu = newRestaurant.menu.map(item => ({
        name: item.name?.trim() || 'Unnamed Item',
        description: item.description?.trim() || '',
        price: parseFloat(item.price) || 0,
        category: item.category?.trim() || 'other'
        }));
        
        formData.append("menu", JSON.stringify(validatedMenu));
        
        // Handle file uploads
        if (coverImage) {
        if (!coverImage.type.match('image.*')) {
            throw new Error('Cover image must be an image file');
        }
        formData.append("coverImage", coverImage);
        }

        menuItemImages.forEach((image, index) => {
        if (image) {
            if (!image.type.match('image.*')) {
            throw new Error(`Menu item image ${index + 1} must be an image file`);
            }
            formData.append("menuItemImages", image);
        }
        });

        // Debug: Log formData contents
        for (let [key, value] of formData.entries()) {
        console.log(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }

        const response = await restaurantServiceApi.post("/api/restaurants", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem('token')}` // Ensure auth token is sent
        },
        timeout: 10000 // 10 second timeout
        });

        // Handle success response
        if (response.data?.status === 'success') {
        // Refresh restaurant list
        const restaurantResponse = await restaurantServiceApi.get("/api/restaurants");
        setRestaurants(restaurantResponse.data.data.restaurants);
        
        // Reset form
        setNewRestaurant({
            name: "",
            description: "",
            address: {
            street: "",
            city: "",
            country: "",
            geoCoordinates: {
                longitude: "",
                latitude: "",
            },
            },
            operatingHours: {
            from: "",
            to: ""
            },
            menu: [
            {
                name: "",
                description: "",
                price: "",
                category: "",
                image: null
            }
            ]
        });
        setCoverImage(null);
        setMenuItemImages([]);
        setShowModal(false);
        }
    } catch (err) {
        console.error("Error creating restaurant:", err);
        setError(err.response?.data?.message || 
                err.message || 
                "Error creating restaurant. Please check your inputs and try again.");
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Restaurant Management</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <button
        className="btn-primary mb-6"
        onClick={() => setShowModal(true)}
      >
        Create Restaurant
      </button>

      {showModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-1/2 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create New Restaurant</h2>
            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
                <input
                  type="text"
                  name="name"
                  value={newRestaurant.name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  name="description"
                  value={newRestaurant.description}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="border p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Street</label>
                    <input
                      type="text"
                      name="street"
                      value={newRestaurant.address.street}
                      onChange={handleAddressChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={newRestaurant.address.city}
                      onChange={handleAddressChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={newRestaurant.address.country}
                      onChange={handleAddressChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Longitude</label>
                    <input
                      type="number"
                      name="longitude"
                      value={newRestaurant.address.geoCoordinates.longitude}
                      onChange={handleGeoCoordinatesChange}
                      step="any"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Latitude</label>
                    <input
                      type="number"
                      name="latitude"
                      value={newRestaurant.address.geoCoordinates.latitude}
                      onChange={handleGeoCoordinatesChange}
                      step="any"
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">Operating Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From</label>
                    <input
                      type="time"
                      name="from"
                      value={newRestaurant.operatingHours.from}
                      onChange={handleOperatingHoursChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">To</label>
                    <input
                      type="time"
                      name="to"
                      value={newRestaurant.operatingHours.to}
                      onChange={handleOperatingHoursChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Menu Items</h3>
                  <button
                    type="button"
                    onClick={addMenuItem}
                    className="btn-secondary"
                  >
                    Add Menu Item
                  </button>
                </div>

                {newRestaurant.menu.map((item, index) => (
                  <div key={index} className="border p-4 mb-4 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Menu Item #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeMenuItem(index)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={item.name}
                          onChange={(e) => handleMenuItemChange(index, e)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                          type="text"
                          name="category"
                          value={item.category}
                          onChange={(e) => handleMenuItemChange(index, e)}
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <input
                          type="number"
                          name="price"
                          value={item.price}
                          onChange={(e) => handleMenuItemChange(index, e)}
                          className="input-field"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                          type="text"
                          name="description"
                          value={item.description}
                          onChange={(e) => handleMenuItemChange(index, e)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Image</label>
                        <input
                          type="file"
                          onChange={(e) => handleMenuItemImageChange(index, e)}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Cover Image
                </label>
                <input
                  type="file"
                  onChange={handleCoverImageChange}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">All Restaurants</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Operating Hours</th>
              <th className="px-4 py-2 text-left">Menu Items</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((restaurant) => (
              <tr key={restaurant._id} className="border-b">
                <td className="px-4 py-2">{restaurant.name}</td>
                <td className="px-4 py-2">{restaurant.description}</td>
                <td className="px-4 py-2">
                  {restaurant.address?.street}, {restaurant.address?.city}, {restaurant.address?.country}
                </td>
                <td className="px-4 py-2">
                  {restaurant.operatingHours?.from} - {restaurant.operatingHours?.to}
                </td>
                <td className="px-4 py-2">
                  {restaurant.menu?.length || 0} items
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                    onClick={() => {
                    setSelectedRestaurant(restaurant._id);
                    setShowAdminModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                >
                    Manage Admins
                </button>
                <button className="text-yellow-600 hover:text-yellow-900 mr-4">
                    Edit
                </button>
                <button className="text-red-600 hover:text-red-900">
                    Delete
                </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdminModal && (
                <RestaurantAdminAssignment 
                  restaurantId={selectedRestaurant}
                  onClose={() => setShowAdminModal(false)}
                />
        )}
    </div>
  );
};

export default RestaurantManagement;