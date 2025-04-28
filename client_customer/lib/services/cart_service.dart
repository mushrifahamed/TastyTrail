// File: services/cart_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';

class CartService {
  final String baseUrl = 'http://10.0.2.2:3002/api/cart';
  final AuthService _authService = AuthService();

  Future<Map<String, dynamic>> getCart() async {
    try {
      final token = await _authService.getToken();

      if (token == null) {
        return {
          'success': false,
          'message': 'You need to login first',
        };
      }

      final response = await http.get(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        final errorMsg = _parseErrorMessage(response);
        return {
          'success': false,
          'message': errorMsg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to connect to server: $e',
      };
    }
  }

  Future<Map<String, dynamic>> addToCart({
    required String restaurantId,
    required String menuItemId,
    required String name,
    required double price,
    required int quantity,
  }) async {
    try {
      final token = await _authService.getToken();

      if (token == null) {
        return {
          'success': false,
          'message': 'You need to login first',
        };
      }

      final response = await http.post(
        Uri.parse('$baseUrl/items'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'restaurantId': restaurantId,
          'menuItemId': menuItemId,
          'name': name,
          'price': price,
          'quantity': quantity,
        }),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        final errorMsg = _parseErrorMessage(response);
        return {
          'success': false,
          'message': errorMsg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to connect to server: $e',
      };
    }
  }

  Future<Map<String, dynamic>> updateCartItem(
      String itemId, int quantity) async {
    try {
      final token = await _authService.getToken();

      if (token == null) {
        return {
          'success': false,
          'message': 'You need to login first',
        };
      }

      final response = await http.patch(
        Uri.parse('$baseUrl/items'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'itemId': itemId,
          'quantity': quantity,
        }),
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        final errorMsg = _parseErrorMessage(response);
        return {
          'success': false,
          'message': errorMsg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to connect to server: $e',
      };
    }
  }

  Future<Map<String, dynamic>> clearCart() async {
    try {
      final token = await _authService.getToken();

      if (token == null) {
        return {
          'success': false,
          'message': 'You need to login first',
        };
      }

      final response = await http.delete(
        Uri.parse(baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': 'Cart cleared successfully',
          'data': jsonDecode(response.body),
        };
      } else {
        final errorMsg = _parseErrorMessage(response);
        return {
          'success': false,
          'message': errorMsg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to connect to server: $e',
      };
    }
  }

// Method to checkout the cart
  Future<Map<String, dynamic>> checkout(
      Map<String, dynamic> checkoutData) async {
    try {
      final token = await _authService.getToken();

      if (token == null) {
        return {
          'success': false,
          'message': 'You need to login first',
        };
      }

      final response = await http.post(
        Uri.parse('$baseUrl/checkout'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(checkoutData),
      );

      if (response.statusCode == 201) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        final errorMsg = _parseErrorMessage(response);
        return {
          'success': false,
          'message': errorMsg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to connect to server: $e',
      };
    }
  }

// Make sure you have this helper method in your class
  String _parseErrorMessage(http.Response response) {
    try {
      final parsedResponse = jsonDecode(response.body);
      return parsedResponse['message'] ?? 'Unknown error occurred';
    } catch (e) {
      return 'Error: ${response.statusCode}';
    }
  }

  Future<Map<String, dynamic>> removeFromCart(String itemId) async {
    try {
      final token = await _authService.getToken();

      if (token == null) {
        return {
          'success': false,
          'message': 'You need to login first',
        };
      }

      final response = await http.delete(
        Uri.parse('$baseUrl/items/$itemId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        final errorMsg = _parseErrorMessage(response);
        return {
          'success': false,
          'message': errorMsg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Failed to connect to server: $e',
      };
    }
  }

  Future<Map<String, dynamic>> checkoutRestaurant(
    String restaurantId,
    String deliveryAddress,
    String paymentMethod,
    List<double>? coordinates,
  ) async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final response = await http.post(
        Uri.parse('$baseUrl/checkout'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'restaurantId': restaurantId,
          'deliveryAddress': deliveryAddress,
          'paymentMethod': paymentMethod,
          'deliveryLocation': {
            'coordinates': coordinates,
          },
        }),
      );

      if (response.statusCode == 201) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        final errorData = jsonDecode(response.body);
        return {
          'success': false,
          'message': errorData['message'] ?? 'Failed to checkout',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during checkout: $e',
      };
    }
  }
}
