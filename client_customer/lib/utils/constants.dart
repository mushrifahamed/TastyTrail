// lib/utils/constants.dart
class ApiConstants {
  static const String baseUrl = 'http://10.0.2.2:3001/api';
  static const String userBaseUrl = 'http://10.0.2.2:3000/api/users';
  static const String restaurantBaseUrl =
      'http://10.0.2.2:3001/api/restaurants';
  static const String cartBaseUrl = 'http://10.0.2.2:3001/api/cart';
}

class AppConstants {
  static const double defaultPadding = 16.0;
  static const double borderRadius = 8.0;
  static const int requestTimeout = 15; // seconds
}
