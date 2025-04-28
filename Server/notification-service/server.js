const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(cors());
app.use(bodyParser.json());

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);



const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
