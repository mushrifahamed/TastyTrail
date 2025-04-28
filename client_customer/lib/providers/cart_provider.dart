import 'package:flutter/foundation.dart';
import '../models/cart.dart';
import '../models/restaurant.dart';
import '../services/cart_service.dart';

class CartProvider with ChangeNotifier {
  Cart? _cart;
  bool _isLoading = false;
  String? _error;
  final CartService _cartService = CartService();

  Cart? get cart => _cart;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get itemCount => _cart?.items.length ?? 0;
  double get totalAmount => _cart?.totalAmount ?? 0.0;

  Future<void> fetchCart() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _cartService.getCart();
      if (result['success']) {
        _cart = Cart.fromJson(result['data']);
      } else {
        _error = result['message'];
      }
    } catch (e) {
      _error = 'Failed to load cart: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> addToCart(
    MenuItem menuItem,
    String restaurantId,
    int quantity,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _cartService.addToCart(
        restaurantId: restaurantId,
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: quantity,
      );

      if (result['success']) {
        _cart = Cart.fromJson(result['data']);
        return {'success': true};
      } else {
        _error = result['message'];
        return {'success': false, 'message': result['message']};
      }
    } catch (e) {
      _error = 'Failed to add item to cart: $e';
      return {'success': false, 'message': _error};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateCartItem(String itemId, int quantity) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _cartService.updateCartItem(itemId, quantity);
      if (result['success']) {
        _cart = Cart.fromJson(result['data']);
      } else {
        _error = result['message'];
      }
    } catch (e) {
      _error = 'Failed to update cart item: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> removeFromCart(String itemId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _cartService.removeFromCart(itemId);
      if (result['success']) {
        _cart = Cart.fromJson(result['data']);
      } else {
        _error = result['message'];
      }
    } catch (e) {
      _error = 'Failed to remove item from cart: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> clearCart() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _cartService.clearCart();
      if (result['success']) {
        _cart = Cart.fromJson(result['data']);
      } else {
        _error = result['message'];
      }
    } catch (e) {
      _error = 'Failed to clear cart: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> checkout(
    String deliveryAddress,
    Map<String, double> deliveryLocation,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _cartService.checkout({
        'address': deliveryAddress,
        'location': deliveryLocation,
      });
      if (result['success']) {
        _cart = Cart.fromJson({
          'customerId': _cart?.customerId ?? '',
          'items': [],
        });
        return {'success': true, 'data': result['data']};
      } else {
        _error = result['message'];
        return {'success': false, 'message': result['message']};
      }
    } catch (e) {
      _error = 'Failed to checkout: $e';
      return {'success': false, 'message': _error};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Map<String, List<CartItem>> get itemsByRestaurant {
    if (_cart == null) return {};

    Map<String, List<CartItem>> grouped = {};

    for (var item in _cart!.items) {
      if (!grouped.containsKey(item.restaurantId)) {
        grouped[item.restaurantId] = [];
      }
      grouped[item.restaurantId]!.add(item);
    }

    return grouped;
  }

// Calculate total amount for a specific restaurant
  double getTotalAmountForRestaurant(String restaurantId) {
    if (_cart == null) return 0.0;

    return _cart!.items
        .where((item) => item.restaurantId == restaurantId)
        .fold(0.0, (sum, item) => sum + (item.price * item.quantity));
  }

// Checkout items from a specific restaurant
  Future<Map<String, dynamic>> checkoutRestaurant(
    String restaurantId,
    String deliveryAddress,
    String paymentMethod,
    List<double>? coordinates,
  ) async {
    print(
        "[CartProvider] checkoutRestaurant called with restaurantId: $restaurantId, paymentMethod: $paymentMethod"); // Log: Method start
    try {
      _isLoading = true;
      notifyListeners();

      // Filter items for this restaurant
      List<CartItem> restaurantItems = _cart!.items
          .where((item) => item.restaurantId == restaurantId)
          .toList();

      if (restaurantItems.isEmpty) {
        throw Exception('No items for this restaurant');
      }

      // Prepare payload
      final payload = {
        'restaurantId': restaurantId,
        'deliveryAddress': deliveryAddress,
        'paymentMethod': paymentMethod,
        'deliveryLocation': {
          'coordinates': coordinates,
        },
      };
      print(
          "[CartProvider] Calling _cartService.checkoutRestaurant with payload: $payload"); // Log: Before API call

      // Call checkout API
      final response = await _cartService.checkoutRestaurant(
          restaurantId, deliveryAddress, paymentMethod, coordinates);

      // Log response for debugging
      print(
          "[CartProvider] _cartService.checkoutRestaurant response: $response"); // Log: After API call

      // Refresh cart after checkout
      print(
          "[CartProvider] Fetching cart after checkout..."); // Log: Before fetchCart
      await fetchCart();
      print("[CartProvider] Cart fetched."); // Log: After fetchCart

      _isLoading = false;
      notifyListeners();

      // Properly extract order data from the nested structure
      if (response['success'] == true &&
          response['data'] != null &&
          response['data']['order'] != null) {
        print(
            "[CartProvider] Checkout successful, returning order data."); // Log: Success
        return {
          'success': true,
          'order': response['data']['order'],
        };
      } else if (response['success'] == true) {
        // Fallback if the structure isn't as expected but success is true
        print(
            "[CartProvider] Checkout reported success, but order data structure might be unexpected. Returning data."); // Log: Success with fallback
        return {
          'success': true,
          'data': response['data'], // Return the whole data part
          'order': response['data']?['order'] ??
              response['data'] ??
              {}, // Attempt to extract order or return data/empty map
        };
      } else {
        // Handle failure case reported by the service
        print(
            "[CartProvider] Checkout failed according to response: ${response['message']}"); // Log: Failure from response
        _error = response['message'] ?? 'Checkout failed';
        return {
          'success': false,
          'message': _error,
        };
      }
    } catch (error) {
      print(
          "[CartProvider] Error during checkoutRestaurant: $error"); // Log: Catch block error
      _isLoading = false;
      _error = error.toString();
      notifyListeners();
      return {
        'success': false,
        'message': error.toString(),
      };
    }
  }
}
