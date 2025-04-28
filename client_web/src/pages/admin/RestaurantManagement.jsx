import RestaurantAdminAssignment from "../../components/RestaurantAdminAssignment";
import { useState, useEffect } from "react";
import { restaurantServiceApi } from "../../utils/api";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow
});

// Component to handle map click events
function LocationMarker({ position, setPosition, setAddressFromCoordinates }) {
  const map = useMapEvents({
    async click(e) {
      const newPosition = e.latlng;
      setPosition(newPosition);
      map.flyTo(newPosition, map.getZoom());
      
      // Fetch address details when position changes
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}`
        );
        const data = await response.json();
        
        if (data.address) {
          setAddressFromCoordinates({
            street: data.address.road || data.address.pedestrian || '',
            city: data.address.city || data.address.town || data.address.village || '',
            country: data.address.country || ''
          });
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Restaurant location</Popup>
    </Marker>
  );
}

const RestaurantManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
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
  const [position, setPosition] = useState(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // Set default position to a reasonable location (e.g., Colombo, Sri Lanka)
  const defaultPosition = [6.9271, 79.8612];

  // Fetch restaurants when component mounts
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantServiceApi.get("/api/restaurants");
        if (response.data?.status === "success" && Array.isArray(response.data?.data?.restaurants)) {
          const restaurantData = response.data.data.restaurants;
          setRestaurants(restaurantData);
          setFilteredRestaurants(restaurantData);
        } else {
          setError("Invalid response format: Expected an array.");
        }
      } catch (err) {
        setError("Error fetching restaurants.");
      }
    };

    fetchRestaurants();
  }, []);

  // Update form data when position changes
  useEffect(() => {
    if (position) {
      setNewRestaurant(prev => ({
        ...prev,
        address: {
          ...prev.address,
          geoCoordinates: {
            longitude: position.lng.toString(),
            latitude: position.lat.toString()
          }
        }
      }));
    }
  }, [position]);

  // Filter restaurants based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRestaurants(restaurants);
      return;
    }
    
    const filtered = restaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address?.street.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredRestaurants(filtered);
  }, [searchTerm, restaurants]);

  const setAddressFromCoordinates = (address) => {
    setNewRestaurant(prev => ({
      ...prev,
      address: {
        ...prev.address,
        street: address.street,
        city: address.city,
        country: address.country
      }
    }));
  };

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
      // Validate that a location has been selected
      if (!position) {
        throw new Error('Please select a location on the map');
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
          longitude: position.lng,
          latitude: position.lat
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

      const response = await restaurantServiceApi.post("/api/restaurants", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 10000
      });

      if (response.data?.status === 'success') {
        const restaurantResponse = await restaurantServiceApi.get("/api/restaurants");
        const newRestaurants = restaurantResponse.data.data.restaurants;
        setRestaurants(newRestaurants);
        setFilteredRestaurants(newRestaurants);
        
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
        setPosition(null);
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Restaurant Management</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition duration-200"
            onClick={() => setShowModal(true)}
          >
            + Create Restaurant
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Create New Restaurant</h2>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleCreateRestaurant} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={newRestaurant.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="e.g. Burger King"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                      <input
                        type="text"
                        name="description"
                        value={newRestaurant.description}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                        placeholder="Short description about the restaurant"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Location</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Click on the map to select the restaurant location. Address fields will be automatically filled.
                    </p>
                    <div className="h-64 w-full rounded-lg overflow-hidden">
                      <MapContainer 
                        center={defaultPosition} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationMarker 
                          position={position ? [position.lat, position.lng] : null} 
                          setPosition={setPosition}
                          setAddressFromCoordinates={setAddressFromCoordinates}
                        />
                      </MapContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                        <input
                          type="text"
                          value={position ? position.lat.toFixed(6) : ''}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                        <input
                          type="text"
                          value={position ? position.lng.toFixed(6) : ''}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Address Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street*</label>
                        <input
                          type="text"
                          name="street"
                          value={newRestaurant.address.street}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="Street address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                        <input
                          type="text"
                          name="city"
                          value={newRestaurant.address.city}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country*</label>
                        <input
                          type="text"
                          name="country"
                          value={newRestaurant.address.country}
                          onChange={handleAddressChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Operating Hours</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time*</label>
                        <input
                          type="time"
                          name="from"
                          value={newRestaurant.operatingHours.from}
                          onChange={handleOperatingHoursChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time*</label>
                        <input
                          type="time"
                          name="to"
                          value={newRestaurant.operatingHours.to}
                          onChange={handleOperatingHoursChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Menu Items</h3>
                      <button
                        type="button"
                        onClick={addMenuItem}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Item
                      </button>
                    </div>

                    {newRestaurant.menu.map((item, index) => (
                      <div key={index} className="bg-white p-4 mb-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-700">Menu Item #{index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => removeMenuItem(index)}
                            className="text-red-500 hover:text-red-700 text-sm flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name*</label>
                            <input
                              type="text"
                              name="name"
                              value={item.name}
                              onChange={(e) => handleMenuItemChange(index, e)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                              placeholder="e.g. Cheeseburger"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                            <input
                              type="text"
                              name="category"
                              value={item.category}
                              onChange={(e) => handleMenuItemChange(index, e)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                              placeholder="e.g. Burgers"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price*</label>
                            <input
                              type="number"
                              name="price"
                              value={item.price}
                              onChange={(e) => handleMenuItemChange(index, e)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              step="0.01"
                              min="0"
                              required
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              name="description"
                              value={item.description}
                              onChange={(e) => handleMenuItemChange(index, e)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Item description"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                            <input
                              type="file"
                              onChange={(e) => handleMenuItemImageChange(index, e)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              accept="image/*"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image*
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        onChange={handleCoverImageChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                        required
                        accept="image/*"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">This will be the main image for your restaurant</p>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition duration-200 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </span>
                      ) : 'Create Restaurant'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">All Restaurants</h2>
          </div>

          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search restaurants by name, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Description</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Hours</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Menu</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRestaurants.map((restaurant) => (
                  <tr key={restaurant._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{restaurant.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-[200px] truncate">{restaurant.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {restaurant.address?.street}, {restaurant.address?.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {restaurant.operatingHours?.from} - {restaurant.operatingHours?.to}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {restaurant.menu?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRestaurant(restaurant._id);
                            setShowAdminModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Admins
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-900 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredRestaurants.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500 text-lg font-medium mb-1">No restaurants found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your search term</p>
                    </div>
                  </td>
                </tr>
              )}
            </table>
          </div>
        </div>
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