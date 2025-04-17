import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiService {
  static const String baseUrl = 'http://127.0.0.1:3000/api/users';

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String address,
  }) async {
    try {
      // Validate input parameters first
      if (email.isEmpty || !email.contains('@')) {
        return {
          'success': false,
          'message': 'Please enter a valid email address',
          'errorCode': 'invalid_email',
        };
      }

      if (password.length < 6) {
        return {
          'success': false,
          'message': 'Password must be at least 6 characters',
          'errorCode': 'weak_password',
        };
      }

      final response = await http
          .post(
            Uri.parse('$baseUrl/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'name': name,
              'email': email,
              'phone': phone,
              'password': password,
              'address': address,
              'role': 'customer',
            }),
          )
          .timeout(const Duration(seconds: 15));

      // Handle empty or malformed response
      if (response.body.isEmpty) {
        return {
          'success': false,
          'message': 'Empty response from server',
          'errorCode': 'empty_response',
          'statusCode': response.statusCode,
        };
      }

      final responseData = jsonDecode(response.body);

      // Successful registration
      if (response.statusCode == 201) {
        return {
          'success': true,
          'token': responseData['token'],
          'user': responseData['data']['user'],
          'message': 'Registration successful',
        };
      }

      // Handle specific error responses from server
      if (response.statusCode == 400) {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Invalid request data',
          'errorCode': responseData['errorCode'] ?? 'bad_request',
          'validationErrors': responseData['errors'],
          'statusCode': response.statusCode,
        };
      }

      if (response.statusCode == 409) {
        return {
          'success': false,
          'message': 'Email already in use',
          'errorCode': 'email_conflict',
          'statusCode': response.statusCode,
        };
      }

      // Handle other status codes
      return {
        'success': false,
        'message':
            responseData['message'] ??
            'Registration failed with status ${response.statusCode}',
        'errorCode': responseData['errorCode'] ?? 'server_error',
        'statusCode': response.statusCode,
      };
    } on SocketException catch (e) {
      return {
        'success': false,
        'message': 'No internet connection',
        'errorCode': 'no_connection',
        'details': e.toString(),
      };
    } on TimeoutException catch (e) {
      return {
        'success': false,
        'message': 'Connection timeout',
        'errorCode': 'timeout',
        'details': e.toString(),
      };
    } on http.ClientException catch (e) {
      return {
        'success': false,
        'message': 'Network error occurred',
        'errorCode': 'network_error',
        'details': e.toString(),
      };
    } on FormatException catch (e) {
      return {
        'success': false,
        'message': 'Invalid server response format',
        'errorCode': 'invalid_format',
        'details': e.toString(),
      };
    } catch (e) {
      debugPrint('Registration error: $e');
      return {
        'success': false,
        'message': 'An unexpected error occurred',
        'errorCode': 'unknown_error',
        'details': e.toString(),
      };
    }
  }

  Future<Map<String, dynamic>> login({
    String? email,
    String? phone,
    required String password,
  }) async {
    try {
      // Validate at least one identifier is provided
      if ((email == null || email.isEmpty) &&
          (phone == null || phone.isEmpty)) {
        return {
          'success': false,
          'message': 'Email or phone required',
          'errorCode': 'missing_credentials',
        };
      }

      final body = <String, dynamic>{'password': password};
      if (email != null && email.isNotEmpty) body['email'] = email;
      if (phone != null && phone.isNotEmpty) body['phone'] = phone;

      final response = await http
          .post(
            Uri.parse('$baseUrl/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15));

      final responseData = jsonDecode(response.body);

      switch (response.statusCode) {
        case 200:
          return {
            'success': true,
            'token': responseData['token'],
            'user': responseData['data']['user'],
          };
        case 400:
          return {
            'success': false,
            'message': responseData['message'] ?? 'Invalid request',
            'errorCode': responseData['errorCode'] ?? 'bad_request',
          };
        case 401:
          return {
            'success': false,
            'message': responseData['message'] ?? 'Invalid credentials',
            'errorCode': 'invalid_credentials',
          };
        case 403:
          return {
            'success': false,
            'message': responseData['message'] ?? 'Account not active',
            'errorCode':
                responseData['details']?.toString() ?? 'inactive_account',
          };
        default:
          return {
            'success': false,
            'message': responseData['message'] ?? 'Login failed',
            'statusCode': response.statusCode,
          };
      }
    } on SocketException {
      return {'success': false, 'message': 'No internet connection'};
    } on TimeoutException {
      return {'success': false, 'message': 'Connection timeout'};
    } on http.ClientException catch (e) {
      return {'success': false, 'message': 'Network error: ${e.message}'};
    } catch (e) {
      debugPrint('Login error: $e');
      return {'success': false, 'message': 'An unexpected error occurred'};
    }
  }

  Future<Map<String, dynamic>> getProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'user': responseData['data']['user']};
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Failed to fetch profile',
        };
      }
    } catch (e) {
      debugPrint('Profile error: $e');
      return {
        'success': false,
        'message': 'An error occurred while fetching profile',
      };
    }
  }
}
