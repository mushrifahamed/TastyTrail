class CartItem {
  final String id;
  final String restaurantId;
  final String menuItemId;
  final String name;
  final double price;
  int quantity;

  CartItem({
    required this.id,
    required this.restaurantId,
    required this.menuItemId,
    required this.name,
    required this.price,
    required this.quantity,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      id: json['_id'] ?? '',
      restaurantId: json['restaurantId'] ?? '',
      menuItemId: json['menuItemId'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      quantity: json['quantity'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'restaurantId': restaurantId,
      'menuItemId': menuItemId,
      'name': name,
      'price': price,
      'quantity': quantity,
    };
  }
}

class Cart {
  final String customerId;
  final List<CartItem> items;
  final DateTime updatedAt;

  Cart({
    required this.customerId,
    required this.items,
    required this.updatedAt,
  });

  factory Cart.fromJson(Map<String, dynamic> json) {
    return Cart(
      customerId: json['customerId'] ?? '',
      items:
          (json['items'] as List<dynamic>? ?? [])
              .map((item) => CartItem.fromJson(item))
              .toList(),
      updatedAt:
          json['updatedAt'] != null
              ? DateTime.parse(json['updatedAt'])
              : DateTime.now(),
    );
  }

  double get totalAmount {
    return items.fold(0, (sum, item) => sum + (item.price * item.quantity));
  }
}
