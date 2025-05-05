class DeliveryData {
  final String? orderId;
  final String? customerId;
  final String? customerName;
  final String? customerPhone;
  final String? restaurant;
  final String? restaurantId;
  final String? deliveryAddress;
  final String? status;
  final String? paymentStatus;
  final int? totalAmount;
  final String? date;
  final String? time;
  final String? createdAt;
  final List<OrderItem>? items;

  DeliveryData({
    this.orderId,
    this.customerId,
    this.customerName,
    this.customerPhone,
    this.restaurant,
    this.restaurantId,
    this.deliveryAddress,
    this.status,
    this.paymentStatus,
    this.totalAmount,
    this.date,
    this.time,
    this.createdAt,
    this.items,
  });

  factory DeliveryData.fromJson(Map<String, dynamic> json) {
    List<OrderItem>? orderItems;
    
    if (json['items'] != null) {
      orderItems = List<OrderItem>.from(
        json['items'].map((item) => OrderItem.fromJson(item))
      );
    }

    // Extract customer info
    String? customerName;
    String? customerPhone;
    if (json['customerInfo'] != null) {
      customerName = json['customerInfo']['name'];
      customerPhone = json['customerInfo']['phone'];
    }
    
    // Extract date and time from createdAt if available
    String? date;
    String? time;
    if (json['createdAt'] != null) {
      try {
        final DateTime createdAt = DateTime.parse(json['createdAt']);
        // These will be used as fallbacks if specific formatting is needed elsewhere
        date = '${createdAt.day}/${createdAt.month}/${createdAt.year}';
        time = '${createdAt.hour}:${createdAt.minute}';
      } catch (_) {}
    }

    return DeliveryData(
      orderId: json['orderId'],
      customerId: json['customerId'],
      customerName: customerName,
      customerPhone: customerPhone,
      restaurant: json['restaurantName'], // This will need to be provided in the API response
      restaurantId: json['restaurantId'],
      deliveryAddress: json['deliveryAddress'],
      status: json['status'],
      paymentStatus: json['paymentStatus'],
      totalAmount: json['totalAmount'],
      date: date,
      time: time,
      createdAt: json['createdAt'],
      items: orderItems,
    );
  }
}

class OrderItem {
  final String? id;
  final String? name;
  final int? price;
  final int? quantity;
  final String? status;

  OrderItem({
    this.id,
    this.name,
    this.price,
    this.quantity,
    this.status,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['_id'],
      name: json['name'],
      price: json['price'],
      quantity: json['quantity'],
      status: json['status'],
    );
  }
}