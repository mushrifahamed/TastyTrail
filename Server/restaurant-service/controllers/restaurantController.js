<<<<<<< HEAD
const Restaurant = require('../models/restaurantModel');
const { calculateDistance } = require('../utils/geolocation');
const upload = require('../config/multerConfig');

// Add new restaurant with cover image and multiple menu item images
const addRestaurant = async (req, res) => {
  const { name, description, address, menu, operatingHours, menuItemNames } = req.body;
=======
const Restaurant = require("../models/restaurantModel");
const { calculateDistance } = require("../utils/geolocation");
const upload = require("../config/multerConfig");

// Add new restaurant with cover image and multiple menu item images
const addRestaurant = async (req, res) => {
  const { name, description, address, menu, operatingHours, menuItemNames } =
    req.body;
>>>>>>> origin/aathifzahir

  // Handle file upload for the cover image
  const coverImage = req.file ? req.file.path : null; // Store the cover image file path

  // Handle file upload for menu item images (multiple files)
  const menuItemImages = req.files; // Multer will upload multiple files as an array in `req.files`

  try {
    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ name });
    if (existingRestaurant) {
<<<<<<< HEAD
      return res.status(400).json({ message: 'Restaurant already exists' });
=======
      return res.status(400).json({ message: "Restaurant already exists" });
>>>>>>> origin/aathifzahir
    }

    // Create a new restaurant instance
    const newRestaurant = new Restaurant({
      name,
      description,
      address,
      menu,
      operatingHours,
<<<<<<< HEAD
      availability: true,  // Default availability is true
      coverImage,          // Save the cover image URL/path
=======
      availability: true, // Default availability is true
      coverImage, // Save the cover image URL/path
>>>>>>> origin/aathifzahir
    });

    // For each menu item, associate the uploaded image
    if (menuItemImages) {
      menu.forEach((menuItem, index) => {
        if (menuItemImages[index]) {
          menuItem.image = menuItemImages[index].path; // Assign image path to each menu item
        }
      });
    }

    // Save the new restaurant
    await newRestaurant.save();
    res.status(201).json(newRestaurant);
  } catch (err) {
<<<<<<< HEAD
    res.status(500).json({ message: 'Error creating restaurant', err });
=======
    res.status(500).json({ message: "Error creating restaurant", err });
>>>>>>> origin/aathifzahir
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
<<<<<<< HEAD
          near: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          distanceField: 'distance',
          maxDistance: radius * 1000, // Radius in meters
          spherical: true,
=======
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
>>>>>>> origin/aathifzahir
        },
      },
    ]);

    if (nearbyRestaurants.length === 0) {
<<<<<<< HEAD
      return res.status(404).json({ message: 'No nearby restaurants found' });
=======
      return res.status(404).json({ message: "No nearby restaurants found" });
>>>>>>> origin/aathifzahir
    }

    res.status(200).json(nearbyRestaurants);
  } catch (err) {
<<<<<<< HEAD
    console.error('Error fetching nearby restaurants:', err);
    res.status(500).json({ message: 'Error fetching nearby restaurants', err });
=======
    console.error("Error fetching nearby restaurants:", err);
    res.status(500).json({ message: "Error fetching nearby restaurants", err });
>>>>>>> origin/aathifzahir
  }
};

module.exports = {
  getNearbyRestaurants,
};

// Update restaurant availability
const toggleAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
<<<<<<< HEAD
      return res.status(404).json({ message: 'Restaurant not found' });
=======
      return res.status(404).json({ message: "Restaurant not found" });
>>>>>>> origin/aathifzahir
    }

    restaurant.availability = !restaurant.availability; // Toggle availability
    await restaurant.save();

<<<<<<< HEAD
    res.status(200).json({ message: 'Restaurant availability updated', restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Error updating availability', err });
  }
};


=======
    res
      .status(200)
      .json({ message: "Restaurant availability updated", restaurant });
  } catch (err) {
    res.status(500).json({ message: "Error updating availability", err });
  }
};

>>>>>>> origin/aathifzahir
// Manage menu items (add/update/remove items with images)
const manageMenu = async (req, res) => {
  const { restaurantId, action, menuItemId, menuItem } = req.body;

  // Handle image upload for the menu item
  const menuItemImage = req.file ? req.file.path : null;

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
<<<<<<< HEAD
      return res.status(404).json({ message: 'Restaurant not found' });
=======
      return res.status(404).json({ message: "Restaurant not found" });
>>>>>>> origin/aathifzahir
    }

    // Check if an image needs to be added or updated for the menu item
    if (menuItemImage) {
      menuItem.image = menuItemImage;
    }

<<<<<<< HEAD
    if (action === 'add') {
      restaurant.menu.push(menuItem);
    } else if (action === 'update') {
      const index = restaurant.menu.findIndex(item => item._id.toString() === menuItemId);
      if (index === -1) {
        return res.status(404).json({ message: 'Menu item not found' });
      }
      restaurant.menu[index] = menuItem; // Update the menu item
    } else if (action === 'remove') {
      restaurant.menu = restaurant.menu.filter(item => item._id.toString() !== menuItemId); // Remove item
    }

    await restaurant.save();
    res.status(200).json({ message: 'Menu updated', restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Error managing menu', err });
=======
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
>>>>>>> origin/aathifzahir
  }
};

// Search restaurants by filters (cuisine, price, rating)
const searchRestaurants = async (req, res) => {
  const { cuisine, priceRange, rating } = req.query;

  try {
    const query = {};

<<<<<<< HEAD
    if (cuisine) query['menu.category'] = cuisine;
    if (priceRange) query['menu.price'] = { $lte: priceRange };
    if (rating) query['rating'] = { $gte: rating };
=======
    if (cuisine) query["menu.category"] = cuisine;
    if (priceRange) query["menu.price"] = { $lte: priceRange };
    if (rating) query["rating"] = { $gte: rating };
>>>>>>> origin/aathifzahir

    const restaurants = await Restaurant.find(query);
    res.status(200).json(restaurants);
  } catch (err) {
<<<<<<< HEAD
    res.status(500).json({ message: 'Error searching restaurants', err });
=======
    res.status(500).json({ message: "Error searching restaurants", err });
>>>>>>> origin/aathifzahir
  }
};

module.exports = {
  addRestaurant,
  getNearbyRestaurants,
  toggleAvailability,
  manageMenu,
<<<<<<< HEAD
  searchRestaurants
};
=======
  searchRestaurants,
};
>>>>>>> origin/aathifzahir
