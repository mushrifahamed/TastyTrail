// lib/providers/restaurant_provider.dart
import 'package:flutter/material.dart';
import '../models/restaurant.dart';
import '../services/restaurant_service.dart';

enum RestaurantLoadingStatus { initial, loading, loaded, error }

class RestaurantProvider with ChangeNotifier {
  final RestaurantService _restaurantService = RestaurantService();

  List<Restaurant> _restaurants = [];
  Restaurant? _selectedRestaurant;
  RestaurantLoadingStatus _status = RestaurantLoadingStatus.initial;
  String? _errorMessage;

  List<Restaurant> get restaurants => _restaurants;
  Restaurant? get selectedRestaurant => _selectedRestaurant;
  RestaurantLoadingStatus get status => _status;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == RestaurantLoadingStatus.loading;

  Future<void> fetchNearbyRestaurants({
    required double latitude,
    required double longitude,
    required double radius,
  }) async {
    _status = RestaurantLoadingStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _restaurants = await _restaurantService.getNearbyRestaurants(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
      _status = RestaurantLoadingStatus.loaded;
    } catch (e) {
      _errorMessage = e.toString();
      _status = RestaurantLoadingStatus.error;
      _restaurants = [];
    }
    notifyListeners();
  }

  Future<void> fetchRestaurantById(String id) async {
    _status = RestaurantLoadingStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final restaurant = await _restaurantService.getRestaurantById(id);

      // Ensure menu items have valid IDs
      for (var i = 0; i < restaurant.menu.length; i++) {
        if (restaurant.menu[i].id.isEmpty) {
          // If the backend didn't provide an ID, create a temporary one
          restaurant.menu[i] = MenuItem(
            id: 'temp_id_$i',
            name: restaurant.menu[i].name,
            description: restaurant.menu[i].description,
            price: restaurant.menu[i].price,
            image: restaurant.menu[i].image,
          );
        }
      }

      _selectedRestaurant = restaurant;
      _status = RestaurantLoadingStatus.loaded;
    } catch (e) {
      _errorMessage = e.toString();
      _status = RestaurantLoadingStatus.error;
      _selectedRestaurant = null;
    }
    notifyListeners();
  }

  Future<void> searchRestaurants(String query) async {
    _status = RestaurantLoadingStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _restaurants = await _restaurantService.searchRestaurants(query);
      _status = RestaurantLoadingStatus.loaded;
    } catch (e) {
      _errorMessage = e.toString();
      _status = RestaurantLoadingStatus.error;
      _restaurants = [];
    }
    notifyListeners();
  }

  void clearSelectedRestaurant() {
    _selectedRestaurant = null;
    notifyListeners();
  }
}
