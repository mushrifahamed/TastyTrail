// models/delivery.dart
class Delivery {
  final String orderId;
  final String customerName;
  final String restaurant;
  final String address;
  final String time;
  final String price;
  final String status;
  final String distance;
  final String date;

  Delivery({
    required this.orderId,
    required this.customerName,
    required this.restaurant,
    required this.price,
    required this.time,
    this.address = '',
    this.status = '',
    this.distance = '',
    this.date = '',
  });
}