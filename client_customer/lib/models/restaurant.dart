class MenuItem {
  final String id;
  final String name;
  final String description;
  final double price;
  final String image;

  MenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.image,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['_id'] ?? '',
      name: json['name'] ?? 'No name',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      image: json['image'] ?? '',
    );
  }
}

class Restaurant {
  final String id;
  final String name;
  final String description;
  final String coverImage;
  final List<MenuItem> menu;
  final bool availability;
  final OperatingHours? operatingHours; // Nullable
  final double? distance; // In kilometers

  Restaurant({
    required this.id,
    required this.name,
    required this.description,
    required this.coverImage,
    required this.menu,
    required this.availability,
    this.operatingHours,
    this.distance,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    // Add debugging
    print('Parsing restaurant JSON: ${json['_id']}');

    final id = json['_id'] is String ? json['_id'] : json['_id'].toString();
    print('Parsed restaurant ID: $id');

    return Restaurant(
      id: json['_id'] ?? '',
      name: json['name'] ?? 'No name',
      description: json['description'] ?? '',
      coverImage: json['coverImage'] ?? '',
      availability: json['availability'] ?? true,
      menu: (json['menu'] as List<dynamic>? ?? [])
          .map((x) => MenuItem.fromJson(x))
          .toList(),
      operatingHours: json['operatingHours'] != null
          ? OperatingHours.fromJson(json['operatingHours'])
          : null,
      distance: json.containsKey('distance')
          ? (json['distance'] ?? 0.0) / 1000
          : null,
    );
  }
}

class OperatingHours {
  final String? from;
  final String? to;

  OperatingHours({this.from, this.to});

  factory OperatingHours.fromJson(Map<String, dynamic> json) {
    return OperatingHours(
      from: json['from']?.toString(),
      to: json['to']?.toString(),
    );
  }
}
