const amqp = require('amqplib/callback_api');
const DeliveryPerson = require('../models/deliveryPerson');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';  // Smart dynamic host
const rabbitmqURL = `amqp://${rabbitmqHost}`;

// Function to listen for delivery person registration events
const listenForDeliveryPersonRegistration = () => {
  amqp.connect(rabbitmqURL, (error, connection) => {
    if (error) {
      throw error;
    }

    connection.createChannel((error, channel) => {
      if (error) {
        throw error;
      }

      const queue = 'delivery_person_registered_queue';
      channel.assertQueue(queue, { durable: true });
      console.log('Waiting for delivery person registration events...');

      channel.consume(queue, async (msg) => {
        if (msg !== null) {
          const deliveryPersonData = JSON.parse(msg.content.toString());
          console.log(`Received delivery person event: ${deliveryPersonData.name}`);
          await saveDeliveryPerson(deliveryPersonData);
          channel.ack(msg);
        }
      });
    });
  });
};

const saveDeliveryPerson = async (data) => {
  try {
    const newDeliveryPerson = new DeliveryPerson({
      name: data.name,
      phone: data.phone,
      location: "",
      availability: true,
      vehicleType: data.vehicleType,
      vehicleLicensePlate: data.vehicleLicensePlate,
    });
    await newDeliveryPerson.save();
    console.log(`Saved delivery person: ${newDeliveryPerson.name}`);
  } catch (error) {
    console.error('Error saving delivery person:', error);
  }
};

listenForDeliveryPersonRegistration();

module.exports = {
  listenForDeliveryPersonRegistration,
};
