import 'dart:convert';
import 'dart:math';
import 'package:delivery_person_app/screens/delivery_tracking.dart';
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
      print('Received notification: ${jsonEncode(message.data)}'); // Add logging
      
      // Extract orderId safely
      final orderId = message.data['orderId'];
      
      // Extract address safely, handling potential string formats
      String address = 'Unknown address';
      if (message.data['deliveryAddress'] != null) {
        // Remove any extra quotes if present
        address = message.data['deliveryAddress'].toString()
            .replaceAll("'", ""); // Remove any single quotes
      }

      if (orderId != null) {
        _showNewOrderDialog(context, orderId, address);
      } else {
        print('Missing orderId in notification data: ${message.data}');
      }
    });
    
    // Also handle notifications when app is in background
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }
  
  // Static handler for background messages
  static Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    // Handle background messages if needed
    print('Handling a background message: ${message.messageId}');
    // You can't show UI from here, but you can update local storage,
    // show a notification, etc.
  }

  void _showNewOrderDialog(BuildContext context, String orderId, String address) {
    // Debug log
    print('Showing dialog for order: $orderId with address: $address');
    
    showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
      pageBuilder: (_, __, ___) {
        return Material(
          type: MaterialType.transparency,
          child: Center(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header
                    Container(
                      padding: const EdgeInsets.all(16),
                      color: Colors.blue,
                      width: double.infinity,
                      child: Column(
                        children: [
                          const Icon(
                            Icons.delivery_dining,
                            color: Colors.white,
                            size: 48,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'New Delivery Request',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Order #${orderId.substring(0, min(6, orderId.length))}',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Delivery destination illustration
                    Container(
                      height: 120,
                      width: double.infinity,
                      color: Colors.grey[100],
                      child: Stack(
                        children: [
                          // Decorative route representation
                          Positioned(
                            top: 60,
                            left: 0,
                            right: 0,
                            child: Container(
                              height: 4,
                              color: Colors.blue[200],
                            ),
                          ),
                          // Origin point
                          Positioned(
                            left: 20,
                            top: 50,
                            child: Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.blue,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: const Icon(Icons.store, color: Colors.white, size: 24),
                                ),
                                const SizedBox(height: 4),
                                const Text('Pickup',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                          // Destination point
                          Positioned(
                            right: 20,
                            top: 50,
                            child: Column(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.red,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: const Icon(Icons.location_on, color: Colors.white, size: 24),
                                ),
                                const SizedBox(height: 4),
                                const Text('Delivery',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                          // Distance indicator
                          Center(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.straight, size: 16, color: Colors.blue[700]),
                                  const SizedBox(width: 4),
                                  Text('Estimated: 15-20 min',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue[700],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Delivery details
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildInfoRow(Icons.location_on, 'Delivery Address', address),
                          const SizedBox(height: 16),
                          const Divider(),
                          const SizedBox(height: 8),
                          _buildTimerWidget(),
                        ],
                      ),
                    ),
                    
                    // Action buttons
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => Navigator.of(context).pop(),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.grey[300],
                                foregroundColor: Colors.black87,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: const Text('Decline'),
                            ),
                          ),
                          const SizedBox(width: 16),
                         Expanded(
  child: ElevatedButton(
    onPressed: () async {
      Navigator.of(context).pop(); // Close the dialog
      await _acceptOrder(context, orderId); // Accept and navigate
    },
    style: ElevatedButton.styleFrom(
      backgroundColor: Colors.green,
      foregroundColor: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
    ),
    child: const Text('Accept'),
  ),
),

                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: Colors.grey[700]),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTimerWidget() {
    return StatefulBuilder(
      builder: (context, setState) {
        return Row(
          children: [
            const Icon(Icons.timer, color: Colors.orange),
            const SizedBox(width: 8),
            const Text(
              'Time to respond:',
              style: TextStyle(fontWeight: FontWeight.w500),
            ),
            const Spacer(),
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 1.0, end: 0.0),
              duration: const Duration(seconds: 30),
              builder: (context, value, _) {
                return Row(
                  children: [
                    Text(
                      '${(value * 30).toInt()} seconds',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.orange,
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: CircularProgressIndicator(
                        value: value,
                        strokeWidth: 4,
                        backgroundColor: Colors.grey[300],
                        valueColor: const AlwaysStoppedAnimation<Color>(Colors.orange),
                      ),
                    ),
                  ],
                );
              },
              onEnd: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

Future<void> _acceptOrder(BuildContext context, String orderId) async {
  final prefs = await SharedPreferences.getInstance();
  final driverId = prefs.getString('user_id');
  final token = prefs.getString('auth_token');

  if (driverId == null || token == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Driver credentials missing. Please login again.')),
    );
    return;
  }

  try {
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    // Step 1: Assign Order
    final assignResponse = await http.post(
      Uri.parse('http://10.0.2.2:3008/api/delivery/assign'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'orderId': orderId,
        'requiredVehicleType': 'bike',
        'driverId': driverId,
      }),
    );

    if (assignResponse.statusCode != 200) {
      Navigator.of(context).pop(); // remove loader
      final message = jsonDecode(assignResponse.body)['message'];
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('❌ Failed to accept order: $message')),
      );
      return;
    }

    // Step 2: Fetch Order Details
    final orderResponse = await http.get(
      Uri.parse('http://10.0.2.2:3008/api/delivery/order/$orderId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    Navigator.of(context).pop(); // remove loader

    if (orderResponse.statusCode == 200) {
      final orderData = jsonDecode(orderResponse.body)['order'];
      // Step 3: Navigate to DeliveryStatusScreen
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => DeliveryStatusScreen(order: orderData),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('❌ Failed to fetch order details')),
      );
    }
  } catch (e) {
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('❌ Error: $e')),
    );
  }
}


  void showSuccessDialog(BuildContext context, String orderId) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircleAvatar(
                radius: 40,
                backgroundColor: Colors.green,
                child: Icon(
                  Icons.check,
                  size: 50,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Order Accepted!',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'You have successfully accepted order #${orderId.substring(0, min(6, orderId.length))}',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  // Here you could navigate to the order details screen
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                ),
                child: const Text(
                  'View Order Details',
                  style: TextStyle(
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}