const Restaurant = require('../models/restaurantModel');
const { calculateDistance } = require('../utils/geolocation');
const upload = require('../config/multerConfig');

// Add new restaurant with cover image and multiple menu item images
const addRestaurant = async (req, res) => {
  const { name, description, address, menu, operatingHours, menuItemNames } = req.body;

  // Handle file upload for the cover image
  const coverImage = req.file ? req.file.path : null; // Store the cover image file path

  // Handle file upload for menu item images (multiple files)
  const menuItemImages = req.files; // Multer will upload multiple files as an array in `req.files`

  try {
    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ name });
    if (existingRestaurant) {
      return res.status(400).json({ message: 'Restaurant already exists' });
    }

    // Create a new restaurant instance
    const newRestaurant = new Restaurant({
      name,
      description,
      address,
      menu,
      operatingHours,
      availability: true,  // Default availability is true
      coverImage,          // Save the cover image URL/path
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
    res.status(500).json({ message: 'Error creating restaurant', err });
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
          near: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          distanceField: 'distance',
          maxDistance: radius * 1000, // Radius in meters
          spherical: true,
        },
      },
    ]);

    if (nearbyRestaurants.length === 0) {
      return res.status(404).json({ message: 'No nearby restaurants found' });
    }

    res.status(200).json(nearbyRestaurants);
  } catch (err) {
    console.error('Error fetching nearby restaurants:', err);
    res.status(500).json({ message: 'Error fetching nearby restaurants', err });
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
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.availability = !restaurant.availability; // Toggle availability
    await restaurant.save();

    res.status(200).json({ message: 'Restaurant availability updated', restaurant });
  } catch (err) {
    res.status(500).json({ message: 'Error updating availability', err });
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
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if an image needs to be added or updated for the menu item
    if (menuItemImage) {
      menuItem.image = menuItemImage;
    }

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
  }
};

// Search restaurants by filters (cuisine, price, rating)
const searchRestaurants = async (req, res) => {
  const { cuisine, priceRange, rating } = req.query;

  try {
    const query = {};

    if (cuisine) query['menu.category'] = cuisine;
    if (priceRange) query['menu.price'] = { $lte: priceRange };
    if (rating) query['rating'] = { $gte: rating };

    const restaurants = await Restaurant.find(query);
    res.status(200).json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Error searching restaurants', err });
  }
};

module.exports = {
  addRestaurant,
  getNearbyRestaurants,
  toggleAvailability,
  manageMenu,
  searchRestaurants
};