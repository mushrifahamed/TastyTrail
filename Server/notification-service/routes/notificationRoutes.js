const express = require("express");
const router = express.Router();
const controller = require("../controllers/notificationController");

router.post("/register", controller.registerToken);
router.post("/sendToUser", controller.sendToUser);
router.post("/broadcast", controller.broadcast);
router.post('/logout', controller.logout);

module.exports = router;
