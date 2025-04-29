import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_messaging/firebase_messaging.dart';

class ApiService {
  final String baseUrl;

  ApiService({required this.baseUrl});

  Future<String?> registerFcmToken(String userId, String role) async {
    try {
      final fcmToken = await FirebaseMessaging.instance.getToken();

      if (fcmToken != null) {
        final url = Uri.parse('$baseUrl/api/notifications/register');
        final response = await http.post(
          url,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'userId': userId,
            'token': fcmToken,
            'role': role,
          }),
        );

        if (response.statusCode == 200) {
          final responseData = jsonDecode(response.body);
          final data = jsonDecode(response.body);
          print("✅✅fcm------- $responseData");
          return data['fcmToken'];
          debugPrint('✅ FCM token registered');
        } else {
          debugPrint('❌ FCM token registration failed: ${response.body}');
        }
      } else {
        debugPrint('⚠️ FCM token is null');
      }
    } catch (e) {
      debugPrint('❌ Error registering FCM token: $e');
    }
  }
}
