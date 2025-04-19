const mongoose = require('mongoose');

const connectDB = () => {
  mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('MongoDB Connected');
  }).catch((err) => {
    console.error('DB Connection Failed', err);
  });
};

module.exports = connectDB;