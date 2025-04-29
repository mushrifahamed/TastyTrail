// providers/order_provider.dart
import 'package:flutter/foundation.dart';
import '../models/order.dart';
import '../services/order_service.dart';

enum OrderLoadingStatus { initial, loading, loaded, error }

class OrderProvider with ChangeNotifier {
  final OrderService _orderService = OrderService();

  List<Order> _orders = [];
  Order? _selectedOrder;
  OrderLoadingStatus _status = OrderLoadingStatus.initial;
  String? _errorMessage;

  List<Order> get orders => _orders;
  Order? get selectedOrder => _selectedOrder;
  OrderLoadingStatus get status => _status;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == OrderLoadingStatus.loading;

  Future<void> fetchCustomerOrders() async {
    _status = OrderLoadingStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      _orders = await _orderService.getCustomerOrders();
      _status = OrderLoadingStatus.loaded;
    } catch (e) {
      _errorMessage = e.toString();
      _status = OrderLoadingStatus.error;
      _orders = [];
    }

    notifyListeners();
  }

  // Other methods omitted for brevity
}
