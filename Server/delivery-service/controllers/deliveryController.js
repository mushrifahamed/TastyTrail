const Order = require('../models/orders');
const DeliveryPerson = require('../models/deliveryPerson');

const assignDelivery = async (req, res) => {
    const { orderId, requiredVehicleType } = req.body;
  
    try {
      // Find the order by ID
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send({ message: 'Order not found' });
      }
  
      // Find the available delivery person with the required vehicle type
      const availableDriver = await DeliveryPerson.findOne({ 
        availability: true,
        vehicleType: requiredVehicleType,
      });
  
      if (!availableDriver) {
        return res.status(400).send({ message: 'No available delivery personnel with the required vehicle type' });
      }
  
      // Assign delivery to the driver
      order.deliveryPersonId = availableDriver._id;
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
    const order = await Order.findById(orderId);
  
    if (!order) {
      return res.status(404).send({ message: 'Order not found' });
    }
  
    res.status(200).send({ orderId, status: order.status });
  };
  
  // Update the status of an order (e.g., when delivery person accepts, starts delivery, etc.)
  const updateOrderStatus = async (req, res) => {
    const { orderId, newStatus } = req.body;
  
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send({ message: 'Order not found' });
      }
  
      // Ensure the new status is valid
      const validStatuses = ['Pending', 'Assigned', 'Accepted', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(newStatus)) {
        return res.status(400).send({ message: 'Invalid status' });
      }
  
      // Update the order status
      order.status = newStatus;
      await order.save();
  
      // Broadcast status update to clients using Socket.io (optional, for real-time updates)
      io.emit('statusUpdate', { orderId, newStatus }); 
  
      res.status(200).send({ message: 'Order status updated', order });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Internal server error' });
    }
  };

  module.exports = {
    assignDelivery,
    getDeliveryStatus,
    updateOrderStatus,
  };

  
  
