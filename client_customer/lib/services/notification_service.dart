// lib/services/notification_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final GlobalKey<NavigatorState> navigatorKey;

  NotificationService({required this.navigatorKey});

  Future<void> initialize() async {
    try {
      // Request permissions
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      print('⚙️ FCM Permission status: ${settings.authorizationStatus}');

      // Get FCM token
      final token = await _messaging.getToken();
      print('🔑 FCM Token: ${token?.substring(0, 10)}...');

      // Configure handlers
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      FirebaseMessaging.onBackgroundMessage(
          _firebaseMessagingBackgroundHandler);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

      print('✅ FCM initialized successfully');
    } catch (e) {
      print('❌ FCM initialization error: $e');
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    print('📨 Foreground message received:');
    print('Title: ${message.notification?.title}');
    print('Body: ${message.notification?.body}');
    print('Data: ${message.data}');
  }

  void _handleMessageOpenedApp(RemoteMessage message) {
    print('🔔 Notification tapped:');
    print('Data: ${message.data}');

    if (message.data.containsKey('orderId')) {
      navigatorKey.currentState?.pushNamed(
        '/order-tracking',
        arguments: message.data['orderId'],
      );
    }
  }
}

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // No need to initialize Firebase here since it's already initialized in main
  print('Background message received: ${message.messageId}');
}
