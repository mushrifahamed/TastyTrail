// services/payhere_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:payhere_mobilesdk_flutter/payhere_mobilesdk_flutter.dart';
import '../services/auth_service.dart';

class PayhereService {
  static const String _baseUrl =
      'http://10.0.2.2:3003/api/payments'; // Update with your payment service URL

  // PayHere sandbox credentials
  static const String _merchantId = "1230199"; // Replace with your merchant ID
  static const String _merchantSecret =
      "MjY3MzgyNDY4NjMzNTQ5NjgwOTY5MjE0ODU2ODM4NDAyODA0MzE="; // Replace with your merchant secret
  static const bool _isSandbox = true; // Set to false for production

  Future<Map<String, dynamic>> initiatePayment({
    required String orderId,
    required double amount,
    required String items,
    required String customerName,
    String? email,
    String? phone,
    String? address,
  }) async {
    try {
      if (amount <= 0) {
        return {
          "success": false,
          "message": "Invalid payment amount",
        };
      }

      // Format amount with 2 decimal places
      String formattedAmount = amount.toStringAsFixed(2);

      // Create the PayHere payment object with sandbox configuration
      Map<String, dynamic> paymentObject = {
        "sandbox": _isSandbox,
        "merchant_id": _merchantId,
        "return_url": "http://sample.com/return",
        "cancel_url": "http://sample.com/cancel",
        "notify_url": "http://sample.com/notify",
        "order_id": orderId,
        "items": items,
        "amount": formattedAmount,
        "currency": "LKR",
        "first_name": customerName.split(' ').first,
        "last_name": customerName.split(' ').length > 1
            ? customerName.split(' ').sublist(1).join(' ')
            : '',
        "email": email ?? "customer@email.com",
        "phone": phone ?? "0771234567",
        "address": address ?? "No.1, Galle Road",
        "city": "Colombo",
        "country": "Sri Lanka",
        "delivery_address": address ?? "No. 46, Galle road, Kalutara South",
        "delivery_city": "Kalutara",
        "delivery_country": "Sri Lanka",
        "platform": "mobile"
      };

      return {
        "success": true,
        "paymentObject": paymentObject,
      };
    } catch (e) {
      return {
        "success": false,
        "message": "Error creating payment: $e",
      };
    }
  }

  Future<Map<String, dynamic>> savePaymentDetails({
    required String orderId,
    required String paymentId,
    required double amount,
    required String status,
  }) async {
    try {
      final token = await AuthService().getToken();
      if (token == null) {
        return {
          'success': false,
          'message': 'Authentication token not found',
        };
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/store'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'orderId': orderId,
          'paymentId': paymentId,
          'amount': amount,
          'status': status,
          'currency': 'LKR'
        }),
      );

      if (response.statusCode == 201) {
        return {"success": true};
      } else {
        return {"success": false, "message": "Failed to update payment status"};
      }
    } catch (e) {
      return {"success": false, "message": "Error saving payment details: $e"};
    }
  }
}
