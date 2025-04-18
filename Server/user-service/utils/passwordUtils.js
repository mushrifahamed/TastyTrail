const bcrypt = require("bcryptjs");

module.exports = {
  hashPassword: async (password) => {
    return await bcrypt.hash(password, 12);
  },

  comparePassword: async (candidatePassword, userPassword) => {
    return await bcrypt.compare(candidatePassword, userPassword);
  },

  generateRandomPassword: () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  },
};
