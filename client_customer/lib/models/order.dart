// models/order.dart
class Order {
  final String id;
  final String customerId;
  final String restaurantId;
  final String restaurantName;
  final List<OrderItem> items;
  final String deliveryAddress;
  final double totalAmount;
  final String paymentStatus;
  final String trackingStatus;
  final List<StatusUpdate> statusUpdates;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.customerId,
    required this.restaurantId,
    required this.restaurantName,
    required this.items,
    required this.deliveryAddress,
    required this.totalAmount,
    required this.paymentStatus,
    required this.trackingStatus,
    required this.statusUpdates,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json,
      {String restaurantName = ''}) {
    return Order(
      id: json['_id'] ?? '',
      customerId: json['customerId'] ?? '',
      restaurantId: json['restaurantId'] ?? '',
      restaurantName: restaurantName,
      items: (json['items'] as List<dynamic>? ?? [])
          .map((item) => OrderItem.fromJson(item))
          .toList(),
      deliveryAddress: json['deliveryAddress'] ?? '',
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      paymentStatus: json['paymentStatus'] ?? 'pending',
      trackingStatus: json['trackingStatus'] ?? 'placed',
      statusUpdates: (json['statusUpdates'] as List<dynamic>? ?? [])
          .map((update) => StatusUpdate.fromJson(update))
          .toList(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}

class OrderItem {
  final String id;
  final String name;
  final double price;
  final int quantity;

  OrderItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
    );
  }
}

class StatusUpdate {
  final String status;
  final DateTime timestamp;
  final String note;

  StatusUpdate({
    required this.status,
    required this.timestamp,
    required this.note,
  });

  factory StatusUpdate.fromJson(Map<String, dynamic> json) {
    return StatusUpdate(
      status: json['status'] ?? '',
      timestamp:
          DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
      note: json['note'] ?? '',
    );
  }
}
