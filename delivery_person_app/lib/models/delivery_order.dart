// models/delivery_order.dart

enum DeliveryStatus {
  accepted,
  pickedUp,
  inTransit,
  delivered,
  cancelled
}

extension DeliveryStatusExtension on DeliveryStatus {
  String get displayName {
    switch (this) {
      case DeliveryStatus.accepted:
        return 'Order Accepted';
      case DeliveryStatus.pickedUp:
        return 'Picked Up';
      case DeliveryStatus.inTransit:
        return 'In Transit';
      case DeliveryStatus.delivered:
        return 'Delivered';
      case DeliveryStatus.cancelled:
        return 'Cancelled';
    }
  }
}

class DeliveryOrder {
  final String id;
  final String deliveryAddress;
  final DeliveryStatus status;
  final String estimatedTime;
  final String customerName;
  final String customerPhone;
  final List<String> orderItems;
  final double total;

  DeliveryOrder({
    required this.id,
    required this.deliveryAddress,
    required this.status,
    required this.estimatedTime,
    required this.customerName,
    required this.customerPhone,
    required this.orderItems,
    required this.total,
  });

  // Create a copy of this order with modified fields
  DeliveryOrder copyWith({
    String? id,
    String? deliveryAddress,
    DeliveryStatus? status,
    String? estimatedTime,
    String? customerName,
    String? customerPhone,
    List<String>? orderItems,
    double? total,
  }) {
    return DeliveryOrder(
      id: id ?? this.id,
      deliveryAddress: deliveryAddress ?? this.deliveryAddress,
      status: status ?? this.status,
      estimatedTime: estimatedTime ?? this.estimatedTime,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      orderItems: orderItems ?? this.orderItems,
      total: total ?? this.total,
    );
  }



}

