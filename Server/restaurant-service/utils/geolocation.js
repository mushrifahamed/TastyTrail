const geolib = require('geolib');

// Function to calculate the distance between two geo-coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  return geolib.getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  );
};

module.exports = { calculateDistance };