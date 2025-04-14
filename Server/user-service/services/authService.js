const jwt = require("jsonwebtoken");
require("dotenv").config();

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

module.exports = {
  generateToken: (userId, role) => {
    return jwt.sign({ id: userId, role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  },

  verifyToken: (token) => {
    return jwt.verify(token, JWT_SECRET);
  },
};
