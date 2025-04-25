// lib/utils/error_handler.dart
import 'dart:ui';

import 'package:flutter/material.dart';
import 'dart:async';

class ErrorHandler {
  static void initialize() {
    // Catch Flutter errors
    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.presentError(details);
      _reportError(details.exception, details.stack);
    };

    // Catch async errors that aren't caught by the Flutter framework
    PlatformDispatcher.instance.onError = (error, stack) {
      _reportError(error, stack);
      return true;
    };
  }

  static void _reportError(dynamic error, StackTrace? stack) {
    // Log the error (in a real app, you might send this to a service)
    debugPrint('Caught error: $error');
    if (stack != null) {
      debugPrint('Stack trace: $stack');
    }
  }

  // Helper method to show error snackbar
  static void showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
