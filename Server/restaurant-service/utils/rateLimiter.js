const rateLimit = require('express-rate-limit');

// Apply a rate limit of 100 requests per 1 minute per IP address
const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 100,                 // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later.", // Custom error message
});

module.exports = rateLimiter;