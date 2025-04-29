// lib/services/restaurant_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/restaurant.dart';
import '../utils/constants.dart';
import 'auth_service.dart';

class RestaurantService {
  final AuthService _authService = AuthService();
  final String _baseUrl = ApiConstants.restaurantBaseUrl;

  Future<List<Restaurant>> getNearbyRestaurants({
    required double latitude,
    required double longitude,
    required double radius,
  }) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final response = await http.get(
        Uri.parse(
          '${ApiConstants.restaurantBaseUrl}/nearby?latitude=$latitude&longitude=$longitude&radius=$radius',
        ),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        // The response is a JSON array, not an object
        List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Restaurant.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load restaurants: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to load restaurants: $e');
    }
  }

  Future<Restaurant> getRestaurantById(String id) async {
    final token = await _authService.getToken();

    final response = await http.get(
      Uri.parse('$_baseUrl/$id'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      print('Restaurant API response received');
      print('Response body: ${response.body}');
      return Restaurant.fromJson(json.decode(response.body));
    } else {
      throw Exception('Failed to load restaurant: ${response.body}');
    }
  }

  Future<List<Restaurant>> searchRestaurants(String query) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final response = await http.get(
        Uri.parse('$_baseUrl/restaurants/search?query=$query'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        if (data['success'] == true) {
          return (data['data'] as List)
              .map((restaurantJson) => Restaurant.fromJson(restaurantJson))
              .toList();
        } else {
          throw Exception(data['message'] ?? 'Failed to search restaurants');
        }
      } else {
        throw Exception('Failed to search restaurants: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to search restaurants: $e');
    }
  }
}
