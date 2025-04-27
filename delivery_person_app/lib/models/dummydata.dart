import 'package:delivery_person_app/models/PaymentModel.dart';
import 'package:delivery_person_app/models/deliveryModel.dart';

class DummyData {
  // Sample data for active deliveries
  static List<Delivery> getActiveDeliveries() {
    return [
      Delivery(
        orderId: '#ORD1234',
        customerName: 'John Smith',
        restaurant: 'Burger King',
        address: '123 Main St, New York',
        time: '12:30 PM',
        price: '\$15.99',
        status: 'Pickup',
        distance: '2.5 km',
      ),
      Delivery(
        orderId: '#ORD5678',
        customerName: 'Emily Johnson',
        restaurant: 'Pizza Hut',
        address: '456 Park Ave, New York',
        time: '1:45 PM',
        price: '\$24.50',
        status: 'On the way',
        distance: '3.8 km',
      ),
    ];
  }

  // Sample data for completed deliveries
  static List<Delivery> getCompletedDeliveries() {
    return [
      Delivery(
        orderId: '#ORD1122',
        customerName: 'Michael Brown',
        restaurant: 'Subway',
        time: '11:20 AM',
        price: '\$12.30',
        date: 'Today',
      ),
      Delivery(
        orderId: '#ORD9876',
        customerName: 'Sarah Wilson',
        restaurant: 'KFC',
        time: '10:05 AM',
        price: '\$18.75',
        date: 'Today',
      ),
      Delivery(
        orderId: '#ORD5432',
        customerName: 'David Lee',
        restaurant: 'Taco Bell',
        time: '7:30 PM',
        price: '\$22.40',
        date: 'Yesterday',
      ),
    ];
  }

  // Sample data for delivery history
  static List<Delivery> getDeliveryHistory() {
    return [
      ...getCompletedDeliveries(),
      Delivery(
        orderId: '#ORD4321',
        customerName: 'Jennifer White',
        restaurant: 'McDonald\'s',
        time: '2:15 PM',
        price: '\$14.85',
        date: '24 Apr 2025',
      ),
      Delivery(
        orderId: '#ORD9870',
        customerName: 'Robert Thomas',
        restaurant: 'Starbucks',
        time: '9:30 AM',
        price: '\$9.50',
        date: '23 Apr 2025',
      ),
      Delivery(
        orderId: '#ORD5544',
        customerName: 'Patricia Moore',
        restaurant: 'Chipotle',
        time: '1:40 PM',
        price: '\$22.75',
        date: '22 Apr 2025',
      ),
    ];
  }

  // Sample data for earnings
  static Map<String, dynamic> getEarningsData() {
    return {
      'today': 78.50,
      'week': 342.75,
      'month': 1250.00,
      'pendingPayment': 78.50,
    };
  }

  // Sample data for payments
  static List<Payment> getRecentPayments() {
    return [
      Payment(
        date: '27 Apr 2025',
        amount: 78.50,
        paymentMethod: 'Direct Deposit',
        status: 'Completed',
      ),
      Payment(
        date: '18 Apr 2025',
        amount: 126.75,
        paymentMethod: 'Direct Deposit',
        status: 'Completed',
      ),
      Payment(
        date: '11 Apr 2025',
        amount: 93.20,
        paymentMethod: 'Direct Deposit',
        status: 'Completed',
      ),
    ];
  }
}