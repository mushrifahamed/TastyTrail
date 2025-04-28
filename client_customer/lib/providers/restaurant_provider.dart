// lib/providers/restaurant_provider.dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
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

  Future<Restaurant> getRestaurantById(String restaurantId) async {
    print('Getting restaurant details for ID: $restaurantId');

    try {
      final response = await http.get(
        Uri.parse('http://10.0.2.2:3001/api/restaurants/$restaurantId'),
        headers: {
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        print('Restaurant API response received');
        final data = json.decode(response.body);
        return Restaurant.fromJson(data);
      } else {
        print('API error status: ${response.statusCode}');
        throw Exception(
            'Failed to load restaurant details: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching restaurant: $e');
      throw Exception('Error fetching restaurant: $e');
    }
  }
}
