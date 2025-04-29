const axios = require("axios");
const mongoose = require('mongoose');
const path = require('path');
const Restaurant = require("../models/restaurantModel");
const { calculateDistance } = require("../utils/geolocation");
const upload = require("../config/multerConfig");

const addRestaurant = async (req, res) => {
  console.log("Request body:", req.body); // Debugging log
  console.log("Request files:", req.files); // Debugging log

  try {
    // Parse the incoming data (handling both stringified and direct objects)
    const name = req.body.name;
    const description = req.body.description;

    const address =
      typeof req.body.address === "string"
        ? JSON.parse(req.body.address)
        : req.body.address;

    const operatingHours =
      typeof req.body.operatingHours === "string"
        ? JSON.parse(req.body.operatingHours)
        : req.body.operatingHours;

    let menu = [];
    try {
      menu =
        typeof req.body.menu === "string"
          ? JSON.parse(req.body.menu)
          : req.body.menu || [];

      if (!Array.isArray(menu)) {
        throw new Error("Menu must be an array");
      }
    } catch (err) {
      console.error("Error parsing menu:", err);
      return res.status(400).json({ message: "Invalid menu format" });
    }

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        message: "Name and address are required",
        details: {
          received: { name, address },
        },
      });
    }

    // Validate address structure
    if (
      !address.geoCoordinates ||
      typeof address.geoCoordinates !== "object" ||
      isNaN(parseFloat(address.geoCoordinates.longitude)) ||
      isNaN(parseFloat(address.geoCoordinates.latitude))
    ) {
      return res.status(400).json({
        message: "Valid geo coordinates are required",
        details: {
          receivedCoordinates: address.geoCoordinates,
        },
      });
    }

    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ name });
    if (existingRestaurant) {
      return res.status(400).json({
        message: "Restaurant already exists",
        existingId: existingRestaurant._id,
      });
    }

    // Handle file uploads
    const coverImage = req.files?.coverImage?.[0]?.path || null;
    const menuItemImages = req.files?.menuItemImages || [];

    // Validate menu items match uploaded images
    if (menuItemImages.length > 0 && menuItemImages.length !== menu.length) {
      console.warn(
        `Mismatch: ${menuItemImages.length} images for ${menu.length} menu items`
      );
    }

    // Create new restaurant with proper data types
    const newRestaurant = new Restaurant({
      name: name.trim(),
      description: description ? description.trim() : "",
      address: {
        street: address.street ? address.street.trim() : "",
        city: address.city ? address.city.trim() : "",
        country: address.country ? address.country.trim() : "",
        geoCoordinates: {
          type: "Point",
          coordinates: [
            parseFloat(address.geoCoordinates.longitude),
            parseFloat(address.geoCoordinates.latitude),
          ],
        },
      },
      menu: menu.map((item, index) => ({
        name: item.name ? item.name.trim() : `Item ${index + 1}`,
        description: item.description ? item.description.trim() : "",
        price: parseFloat(item.price) || 0,
        category: item.category ? item.category.trim() : "other",
        image: menuItemImages[index]?.path || null,
      })),
      operatingHours: {
        from: operatingHours?.from || "09:00",
        to: operatingHours?.to || "21:00",
      },
      availability: true,
      coverImage,
    });

    // Validate the restaurant document before saving
    const validationError = newRestaurant.validateSync();
    if (validationError) {
      return res.status(400).json({
        message: "Validation failed",
        error: validationError.message,
        details: validationError.errors,
      });
    }

    // Additional validation for coordinates
    const longitude = parseFloat(address.geoCoordinates.longitude);
    const latitude = parseFloat(address.geoCoordinates.latitude);
    
    if (isNaN(longitude)) {
      return res.status(400).json({ message: "Invalid longitude value" });
    }
    
    if (isNaN(latitude)) {
      return res.status(400).json({ message: "Invalid latitude value" });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: "Longitude must be between -180 and 180" });
    }
    
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ message: "Latitude must be between -90 and 90" });
    }

    await newRestaurant.save();

    res.status(201).json({
      status: "success",
      data: {
        restaurant: newRestaurant,
      },
    });
  } catch (err) {
    console.error("Error creating restaurant:", err);

    // Handle duplicate key errors separately
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Restaurant with this name already exists",
        error: err.message,
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        error: err.message,
        details: err.errors,
      });
    }

    res.status(500).json({
      message: "Error creating restaurant",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Update a restaurant
const updateRestaurant = async (req, res) => {
  console.log("Update request body:", req.body);
  console.log("Update request files:", req.files);

  try {
    const { id } = req.params;

    // Validate restaurant ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid restaurant ID" });
    }

    // Parse incoming data
    const name = req.body.name;
    const description = req.body.description;
    const address = typeof req.body.address === "string" ? JSON.parse(req.body.address) : req.body.address;
    const operatingHours = typeof req.body.operatingHours === "string" ? JSON.parse(req.body.operatingHours) : req.body.operatingHours;
    let menu = [];
    try {
      menu = typeof req.body.menu === "string" ? JSON.parse(req.body.menu) : req.body.menu || [];
      if (!Array.isArray(menu)) {
        throw new Error("Menu must be an array");
      }
    } catch (err) {
      console.error("Error parsing menu:", err);
      return res.status(400).json({ message: "Invalid menu format" });
    }

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({ message: "Name and address are required" });
    }

    // Validate address structure
    if (
      !address.geoCoordinates ||
      isNaN(parseFloat(address.geoCoordinates.longitude)) ||
      isNaN(parseFloat(address.geoCoordinates.latitude))
    ) {
      return res.status(400).json({ message: "Valid geo coordinates are required" });
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Handle file uploads
    const coverImage = req.files?.coverImage?.[0]?.path || restaurant.coverImage;
    const menuItemImages = req.files?.menuItemImages || [];

    // Update restaurant data
    restaurant.name = name.trim();
    restaurant.description = description ? description.trim() : "";
    restaurant.address = {
      street: address.street ? address.street.trim() : "",
      city: address.city ? address.city.trim() : "",
      country: address.country ? address.country.trim() : "",
      geoCoordinates: {
        type: "Point",
        coordinates: [
          parseFloat(address.geoCoordinates.longitude),
          parseFloat(address.geoCoordinates.latitude),
        ],
      },
    };
    restaurant.operatingHours = {
      from: operatingHours?.from || "09:00",
      to: operatingHours?.to || "21:00",
    };
    restaurant.menu = menu.map((item, index) => ({
      name: item.name ? item.name.trim() : `Item ${index + 1}`,
      description: item.description ? item.description.trim() : "",
      price: parseFloat(item.price) || 0,
      category: item.category ? item.category.trim() : "other",
      image: menuItemImages[index]?.path || (restaurant.menu[index]?.image || null),
    }));
    restaurant.coverImage = coverImage;

    // Validate coordinates
    const longitude = parseFloat(address.geoCoordinates.longitude);
    const latitude = parseFloat(address.geoCoordinates.latitude);
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({ message: "Invalid geo coordinates" });
    }

    // Save updated restaurant
    await restaurant.save();

    res.status(200).json({
      status: "success",
      data: { restaurant },
    });
  } catch (err) {
    console.error("Error updating restaurant:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Restaurant with this name already exists" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed",
        error: err.message,
        details: err.errors,
      });
    }
    res.status(500).json({
      message: "Error updating restaurant",
      error: err.message,
    });
  }
};

// Delete a restaurant
const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate restaurant ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid restaurant ID" });
    }

    // Check if restaurant exists
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Delete restaurant
    await Restaurant.deleteOne({ _id: id });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    console.error("Error deleting restaurant:", err);
    res.status(500).json({
      message: "Error deleting restaurant",
      error: err.message,
    });
  }
};

// Get all restaurants within a certain radius (nearby restaurants)
const getNearbyRestaurants = async (req, res) => {
  const { longitude, latitude, radius } = req.query;

  try {
    // Perform the geospatial query to find nearby restaurants
    const nearbyRestaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance", // Ensure this is added
          maxDistance: radius * 1000,
          spherical: true,
          includeLocs: "address.geoCoordinates", // Include coordinates
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          coverImage: 1,
          menu: 1,
          availability: 1,
          operatingHours: 1, // Explicitly include
          distance: 1, // Include calculated distance
        },
      },
    ]);

    if (nearbyRestaurants.length === 0) {
      return res.status(404).json({ message: "No nearby restaurants found" });
    }

    res.status(200).json(nearbyRestaurants);
  } catch (err) {
    console.error("Error fetching nearby restaurants:", err);
    res.status(500).json({ message: "Error fetching nearby restaurants", err });
  }
};

// Update restaurant availability
const toggleAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      console.error("Error fetching restaurant tog:", err);
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.availability = !restaurant.availability; // Toggle availability
    await restaurant.save();

    res
      .status(200)
      .json({ message: "Restaurant availability updated", restaurant });
  } catch (err) {
    res.status(500).json({ message: "Error updating availability", err });
  }
};

// Get restaurant availability status
const getRestaurantAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);

    if (!restaurant) {
      console.error("Error fetching restaurant aval:", err);
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.status(200).json({
      restaurantId: restaurant._id,
      isAvailable: restaurant.availability,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error checking restaurant availability", err });
  }
};

// Get restaurant by ID
const getRestaurantById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error(`Invalid restaurant ID: ${id}`);
    return res.status(400).json({ 
      status: "fail",
      message: "Invalid restaurant ID format",
      receivedId: id
    });
  }

  try {
    const restaurant = await Restaurant.findById(id).lean();
    
    if (!restaurant) {
      console.error(`Restaurant not found: ${id}`);
      return res.status(404).json({ 
        status: "fail",
        message: "Restaurant not found",
        restaurantId: id
      });
    }

    // Ensure required fields have fallback values
    if (!restaurant.name) {
      console.warn(`Restaurant ${id} has no name field`);
      restaurant.name = "Unnamed Restaurant";
    }

    res.status(200).json({ 
      status: "success",
      data: {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          description: restaurant.description || "",
          address: restaurant.address,
          menu: restaurant.menu || [],
          coverImage: restaurant.coverImage || null,
          operatingHours: restaurant.operatingHours || { from: "09:00", to: "21:00" },
          availability: restaurant.availability ?? true
        }
      }
    });

  } catch (err) {
    console.error(`Error fetching restaurant ${id}:`, err);
    res.status(500).json({ 
      status: "error",
      message: "Server error fetching restaurant",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Verify Restaurant Existence
const verifyRestaurant = async (req, res) => {
  const { restaurantId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    return res.status(400).json({ 
      status: 'fail',
      message: 'Invalid restaurant ID format' 
    });
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ 
        status: 'fail',
        message: 'Restaurant not found' 
      });
    }

    res.status(200).json({ 
      status: 'success',
      data: {
        exists: true,
        restaurant: {
          id: restaurant._id,
          name: restaurant.name
        }
      }
    });
  } catch (err) {
    console.error('Error verifying restaurant:', err);
    res.status(500).json({ 
      status: 'error',
      message: 'Error verifying restaurant' 
    });
  }
};

//get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    // Fetch all restaurants from the database
    const restaurants = await Restaurant.find(); // You can add query filters if needed

    if (restaurants.length === 0) {
      return res.status(404).json({ message: "No restaurants found" });
    }

    res.status(200).json({
      status: "success",
      data: {
        restaurants, // Return the list of restaurants
      },
    });
  } catch (err) {
    console.error("Error fetching restaurants:", err);
    res.status(500).json({ message: "Error fetching restaurants", err });
  }
};

// Add menu item to restaurant
const addMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItem = req.body;
    const menuItemImage = req.file ? 
      path.join('uploads', 'menu-items', req.file.filename).replace(/\\/g, '/') : 
      null;

    // Validate required fields
    if (!menuItem.name || !menuItem.price) {
      return res.status(400).json({
        status: "fail",
        message: "Name and price are required for menu items"
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant not found"
      });
    }

    const newItem = {
      ...menuItem,
      _id: new mongoose.Types.ObjectId(),
      image: menuItemImage,
      price: parseFloat(menuItem.price)
    };

    restaurant.menu.push(newItem);
    const updatedRestaurant = await restaurant.save();

    return res.status(201).json({
      status: "success",
      data: {
        menuItem: updatedRestaurant.menu.slice(-1)[0]
      }
    });
  } catch (err) {
    console.error('Error in addMenuItem:', err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Update menu item
const updateMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuItemId } = req.params;
    const menuItem = req.body;
    const menuItemImage = req.file ? 
      path.join('uploads', 'menu-items', req.file.filename).replace(/\\/g, '/') : 
      null;

    // Validate required fields
    if (!menuItem.name || !menuItem.price) {
      return res.status(400).json({
        status: "fail",
        message: "Name and price are required for menu items"
      });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant not found"
      });
    }

    const itemIndex = restaurant.menu.findIndex(item => item._id.toString() === menuItemId);
    if (itemIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "Menu item not found"
      });
    }

    restaurant.menu[itemIndex] = {
      ...restaurant.menu[itemIndex],
      ...menuItem,
      price: parseFloat(menuItem.price),
      image: menuItemImage || restaurant.menu[itemIndex].image
    };

    const updatedRestaurant = await restaurant.save();
    return res.status(200).json({
      status: "success",
      data: {
        menuItem: updatedRestaurant.menu[itemIndex]
      }
    });
  } catch (err) {
    console.error('Error in updateMenuItem:', err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, menuItemId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        status: "fail",
        message: "Restaurant not found"
      });
    }

    const initialLength = restaurant.menu.length;
    restaurant.menu = restaurant.menu.filter(item => item._id.toString() !== menuItemId);
    
    if (restaurant.menu.length === initialLength) {
      return res.status(404).json({
        status: "fail",
        message: "Menu item not found"
      });
    }

    await restaurant.save();
    return res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    console.error('Error in deleteMenuItem:', err);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Search restaurants by filters (cuisine, price, rating)
const searchRestaurants = async (req, res) => {
  const { cuisine, priceRange, rating } = req.query;

  try {
    const query = {};

    if (cuisine) query["menu.category"] = cuisine;
    if (priceRange) query["menu.price"] = { $lte: priceRange };
    if (rating) query["rating"] = { $gte: rating };

    const restaurants = await Restaurant.find(query);
    res.status(200).json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Error searching restaurants", err });
  }
};

module.exports = {
  addRestaurant,
  getNearbyRestaurants,
  toggleAvailability,
  getRestaurantAvailability,
  getRestaurantById,
  verifyRestaurant,
  getAllRestaurants,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  searchRestaurants,
  deleteRestaurant,
  updateRestaurant,
};