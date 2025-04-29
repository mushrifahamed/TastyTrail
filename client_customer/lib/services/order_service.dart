// services/order_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/order.dart';
import 'auth_service.dart';
import 'restaurant_service.dart';

class OrderService {
  final String baseUrl = 'http://10.0.2.2:3002'; // Order service URL
  final AuthService _authService = AuthService();
  final RestaurantService _restaurantService = RestaurantService();

  // Get orders for the current customer
  Future<List<Order>> getCustomerOrders() async {
    try {
      final token = await _authService.getToken();
      final user = await _authService.getUser();

      if (token == null || user == null) {
        throw Exception('Authentication required');
      }

      final userId = user['_id'];

      final response = await http.get(
        Uri.parse('$baseUrl/api/orders/customer/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to load orders: ${response.statusCode}');
      }

      final List<dynamic> ordersJson = jsonDecode(response.body);
      final List<Order> orders = [];

      // Get restaurant details for each order
      for (var orderJson in ordersJson) {
        final restaurantId = orderJson['restaurantId'];
        String restaurantName = 'Restaurant';

        try {
          final restaurant =
              await _restaurantService.getRestaurantById(restaurantId);

          print('restaurant: $restaurant');
          restaurantName = restaurant.name;
        } catch (e) {
          print('Error fetching restaurant: $e');
        }

        orders.add(Order.fromJson(orderJson, restaurantName: restaurantName));
      }

      return orders;
    } catch (e) {
      print('Error fetching orders: $e');
      throw Exception('Failed to load orders: $e');
    }
  }

  // // Get a specific order by ID
  // Future<Order> getOrderDetails(String orderId) async {
  //   // Implementation similar to getCustomerOrders but for a single order
  //   // Omitted for brevity
  // }
}
