// import 'package:firebase_messaging/firebase_messaging.dart';
// import 'package:flutter_local_notifications/flutter_local_notifications.dart';
// import 'package:flutter/material.dart';

// Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
//   print('📩 Background message: ${message.messageId}');
// }

// class FirebaseNotificationService {
//   static final FirebaseNotificationService _instance = FirebaseNotificationService._internal();

//   factory FirebaseNotificationService() => _instance;

//   FirebaseNotificationService._internal();

//   final FirebaseMessaging _messaging = FirebaseMessaging.instance;
//   final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

//   Future<void> init(BuildContext context) async {
//     await _messaging.requestPermission();

//     // Background handler
//     FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

//     // Local notifications
//     const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
//     const initSettings = InitializationSettings(android: androidSettings);
//     await _flutterLocalNotificationsPlugin.initialize(
//       initSettings,
//       onDidReceiveNotificationResponse: (response) {
//         print("🔔 Clicked notification: ${response.payload}");
//       },
//     );

//     // Foreground notifications
//     FirebaseMessaging.onMessage.listen((message) {
//       print('📲 Foreground notification received');
//       _showNotification(message);
//     });

//     // Opened from notification
//     FirebaseMessaging.onMessageOpenedApp.listen((message) {
//       print('📦 Notification clicked');
//     });

//     final token = await _messaging.getToken();
//     print('📱 Driver FCM Token: $token');
//   }

//   Future<void> _showNotification(RemoteMessage message) async {
//     const androidDetails = AndroidNotificationDetails(
//       'driver_channel',
//       'Driver Notifications',
//       channelDescription: 'Order and alert notifications',
//       importance: Importance.high,
//       priority: Priority.high,
//     );

//     const notifDetails = NotificationDetails(android: androidDetails);

//     await _flutterLocalNotificationsPlugin.show(
//       message.notification.hashCode,
//       message.notification?.title ?? 'New Order',
//       message.notification?.body ?? '',
//       notifDetails,
//     );
//   }
// }
