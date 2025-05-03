import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class DeliveryNotificationService {
  static final DeliveryNotificationService _instance = DeliveryNotificationService._internal();

  factory DeliveryNotificationService() {
    return _instance;
  }

  DeliveryNotificationService._internal();

  void initialize(BuildContext context) {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final orderId = message.data['orderId'];
      final address = message.data['deliveryAddress'] ?? 'Unknown address';

      if (orderId != null) {
        _showNewOrderDialog(context, orderId, address);
      }
    });
  }

  void _showNewOrderDialog(BuildContext context, String orderId, String address) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('New Delivery Order'),
        content: Text('Pickup Location: $address\n\nDo you want to accept?'),
        actions: [
          TextButton(
            child: const Text('Accept'),
            onPressed: () async {
              Navigator.of(context).pop();
              await _acceptOrder(context, orderId);
            },
          ),
          TextButton(
            child: const Text('Ignore'),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Future<void> _acceptOrder(BuildContext context, String orderId) async {
    final prefs = await SharedPreferences.getInstance();
    final driverId = prefs.getString('driver_id');
    final token = prefs.getString('auth_token');

    if (driverId == null || token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Driver credentials missing. Please login again.')),
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('http://10.0.2.2:3008/api/delivery/assignDelivery'), // 🔥 Replace
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'orderId': orderId,
          'requiredVehicleType': 'bike', // 🔥 If needed, make dynamic
          'driverId': driverId,
        }),
      );

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('✅ Order assigned to you successfully.')),
        );
      } else {
        final message = jsonDecode(response.body)['message'];
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ Failed: $message')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Network error: $e')),
      );
    }
  }
}
