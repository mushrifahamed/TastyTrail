const axios = require("axios");
const Restaurant = require("../models/restaurantModel");
const { calculateDistance } = require("../utils/geolocation");
const upload = require("../config/multerConfig");

const addRestaurant = async (req, res) => {
  console.log('Request body:', req.body); // Debugging log
  console.log('Request files:', req.files); // Debugging log

  try {
    // Parse the incoming data (handling both stringified and direct objects)
    const name = req.body.name;
    const description = req.body.description;
    
    const address = typeof req.body.address === 'string' 
      ? JSON.parse(req.body.address) 
      : req.body.address;
    
    const operatingHours = typeof req.body.operatingHours === 'string'
      ? JSON.parse(req.body.operatingHours)
      : req.body.operatingHours;
    
    let menu = [];
    try {
      menu = typeof req.body.menu === 'string'
        ? JSON.parse(req.body.menu)
        : req.body.menu || [];
      
      if (!Array.isArray(menu)) {
        throw new Error('Menu must be an array');
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
          received: { name, address }
        }
      });
    }

    // Validate address structure
    if (!address.geoCoordinates || 
        typeof address.geoCoordinates !== 'object' ||
        isNaN(parseFloat(address.geoCoordinates.longitude)) || 
        isNaN(parseFloat(address.geoCoordinates.latitude))) {
      return res.status(400).json({ 
        message: "Valid geo coordinates are required",
        details: {
          receivedCoordinates: address.geoCoordinates
        }
      });
    }

    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ name });
    if (existingRestaurant) {
      return res.status(400).json({ 
        message: "Restaurant already exists",
        existingId: existingRestaurant._id
      });
    }

    // Handle file uploads
    const coverImage = req.files?.coverImage?.[0]?.path || null;
    const menuItemImages = req.files?.menuItemImages || [];

    // Validate menu items match uploaded images
    if (menuItemImages.length > 0 && menuItemImages.length !== menu.length) {
      console.warn(`Mismatch: ${menuItemImages.length} images for ${menu.length} menu items`);
    }

    // Create new restaurant with proper data types
    const newRestaurant = new Restaurant({
      name: name.trim(),
      description: description ? description.trim() : '',
      address: {
        street: address.street ? address.street.trim() : '',
        city: address.city ? address.city.trim() : '',
        country: address.country ? address.country.trim() : '',
        geoCoordinates: {
          type: "Point",
          coordinates: [
            parseFloat(address.geoCoordinates.longitude),
            parseFloat(address.geoCoordinates.latitude)
          ],
        }
      },
      menu: menu.map((item, index) => ({
        name: item.name ? item.name.trim() : `Item ${index + 1}`,
        description: item.description ? item.description.trim() : '',
        price: parseFloat(item.price) || 0,
        category: item.category ? item.category.trim() : 'other',
        image: menuItemImages[index]?.path || null
      })),
      operatingHours: {
        from: operatingHours?.from || '09:00',
        to: operatingHours?.to || '21:00'
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
        details: validationError.errors
      });
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
        error: err.message
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation failed",
        error: err.message,
        details: err.errors
      });
    }

    res.status(500).json({ 
      message: "Error creating restaurant",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.status(200).json(restaurant);
  } catch (err) {
    res.status(500).json({ message: "Error fetching restaurant", err });
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

// Manage menu items (add/update/remove items with images)
const manageMenu = async (req, res) => {
  const { restaurantId, action, menuItemId, menuItem } = req.body;

  // Handle image upload for the menu item
  const menuItemImage = req.file ? req.file.path : null;

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Check if an image needs to be added or updated for the menu item
    if (menuItemImage) {
      menuItem.image = menuItemImage;
    }

    if (action === "add") {
      restaurant.menu.push(menuItem);
    } else if (action === "update") {
      const index = restaurant.menu.findIndex(
        (item) => item._id.toString() === menuItemId
      );
      if (index === -1) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      restaurant.menu[index] = menuItem; // Update the menu item
    } else if (action === "remove") {
      restaurant.menu = restaurant.menu.filter(
        (item) => item._id.toString() !== menuItemId
      ); // Remove item
    }

    await restaurant.save();
    res.status(200).json({ message: "Menu updated", restaurant });
  } catch (err) {
    res.status(500).json({ message: "Error managing menu", err });
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
  getAllRestaurants,
  manageMenu,
  searchRestaurants,
};
