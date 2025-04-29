// lib/providers/restaurant_provider.dart
import 'package:flutter/foundation.dart';
import '../models/restaurant.dart';
import '../services/restaurant_service.dart';

/// Provider class that manages restaurant-related state and API calls
class RestaurantProvider with ChangeNotifier {
  final RestaurantService _restaurantService = RestaurantService();
  List<Restaurant> _restaurants = [];
  bool _isLoading = false;
  String? _errorMessage;

  /// Gets the list of restaurants
  List<Restaurant> get restaurants => List.unmodifiable(_restaurants);

  /// Gets the loading state
  bool get isLoading => _isLoading;

  /// Gets the current error message, if any
  String? get errorMessage => _errorMessage;

  /// Fetches restaurants near the specified location
  Future<void> fetchNearbyRestaurants({
    required double latitude,
    required double longitude,
    required double radius,
  }) async {
    try {
      _setLoading(true);
      _restaurants = await _restaurantService.getNearbyRestaurants(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
      _setLoading(false);
    } catch (e) {
      _handleError('Failed to fetch nearby restaurants: ${e.toString()}');
    }
  }

  /// Fetches a specific restaurant by its ID
  Future<Restaurant?> getRestaurantById(String id) async {
    try {
      final restaurant = await _restaurantService.getRestaurantById(id);

      // Debug logging
      print('DEBUG: Restaurant fetched successfully:');
      print('- ID: ${restaurant.id}');
      print('- Name: ${restaurant.name}');
      print('- Description: ${restaurant.description}');
      print('- Cover Image: ${restaurant.coverImage}');
      print(
          '- Operating Hours: ${restaurant.operatingHours?.from} - ${restaurant.operatingHours?.to}');
      print('- Menu Items Count: ${restaurant.menu.length}');

      // Log menu items if present
      if (restaurant.menu.isNotEmpty) {
        print('\nMenu Items:');
        restaurant.menu.forEach((item) {
          print('  * ${item.name} - \$${item.price}');
        });
      }

      return restaurant;
    } catch (e) {
      _handleError('Failed to fetch restaurant details: ${e.toString()}');
      return null;
    }
  }

  /// Searches for restaurants based on query
  Future<void> searchRestaurants(String query) async {
    try {
      _setLoading(true);
      _restaurants = await _restaurantService.searchRestaurants(query);
      _setLoading(false);
    } catch (e) {
      _handleError('Failed to search restaurants: ${e.toString()}');
    }
  }

  /// Helper method to update loading state
  void _setLoading(bool value) {
    _isLoading = value;
    _errorMessage = null;
    notifyListeners();
  }

  /// Helper method to handle errors
  void _handleError(String message) {
    _isLoading = false;
    _errorMessage = message;
    notifyListeners();
  }
}
