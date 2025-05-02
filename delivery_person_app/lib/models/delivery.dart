class DeliveryData {
  final String? orderId;
  final String? customerName;
  final String? restaurant; // If available
  final String? date;
  final String? time;

  DeliveryData({
    this.orderId,
    this.customerName,
    this.restaurant,
    this.date,
    this.time,
  });

  factory DeliveryData.fromJson(Map<String, dynamic> json) {
    final createdAt = DateTime.parse(json['createdAt']);
    return DeliveryData(
      orderId: json['orderId'],
      customerName: json['customerInfo']['name'],
      restaurant: json['restaurantId'], // Change this if you want actual restaurant name
      date: '${createdAt.year}-${createdAt.month.toString().padLeft(2, '0')}-${createdAt.day.toString().padLeft(2, '0')}',
      time: '${createdAt.hour.toString().padLeft(2, '0')}:${createdAt.minute.toString().padLeft(2, '0')}',
    );
  }
}
