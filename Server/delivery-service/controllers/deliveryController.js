const DeliveryOrder = require('../models/orders'); // This is your correct model
const DeliveryPerson = require('../models/deliveryPerson');

const assignDelivery = async (req, res) => {
  const { orderId, requiredVehicleType } = req.body;

  try {
    // Find the order by ID
    const order = await DeliveryOrder.findOne({ orderId });

    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }

    // Find the available delivery person with the required vehicle type
    const availableDriver = await DeliveryPerson.findOne({ 
      isActive: true,
      'vehicleInfo.type': requiredVehicleType
    });
    

    if (!availableDriver) {
      return res.status(400).send({ message: 'No available delivery personnel with the required vehicle type' });
    }

    // Assign delivery to the driver
    order.deliveryPersonId = availableDriver.userId;
    order.status = 'Assigned';
    await order.save();

    // Update the delivery person's availability
    availableDriver.availability = false;
    await availableDriver.save();

    res.status(200).send({ message: 'Delivery assigned', order });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Get the current status of an order
const getDeliveryStatus = async (req, res) => {
  const { orderId } = req.params;
  const order = await DeliveryOrder.findOne({ orderId });


  if (!order) {
    return res.status(404).send({ message: 'Order not found' });
  }

  res.status(200).send({ orderId, status: order.status });
};

// Update the status of an order
const updateOrderStatus = async (req, res) => {
  const { orderId, status } = req.body;

  try {
    const order = await DeliveryOrder.findOne({ orderId });

    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }

    const validStatuses = ['Pending','Assigned','Accepted','Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
if (!validStatuses.includes(status)) {
  console.log("Received status:", status);
  console.log("Valid?", validStatuses.includes(status));
  return res.status(400).send({ message: 'Invalid status' });
}

order.status = status;
await order.save();

//io.emit('statusUpdate', { orderId, status });


    res.status(200).send({ message: 'Order status updated', order });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal server error' });
  }
};

// Get full delivery order details
const getOrderDetails = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await DeliveryOrder.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error('❌ Error fetching order:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all delivered orders of a specific delivery person
const getDeliveredOrdersByDriver = async (req, res) => {
  const { driverId } = req.params;

  try {
    const deliveredOrders = await DeliveryOrder.find({
      
      deliveryPersonId: driverId,
      status: 'Delivered'
    });
    

    res.status(200).json({ orders: deliveredOrders });
  } catch (error) {
    console.error('❌ Error fetching delivered orders:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};



module.exports = {
  assignDelivery,
  getDeliveryStatus,
  updateOrderStatus,
  getOrderDetails,
  getDeliveredOrdersByDriver
};