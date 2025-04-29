import 'dart:convert';

import 'package:client_customer/providers/order_provider.dart';
import 'package:client_customer/screens/cart/order_confirmation_screen.dart';
import 'package:client_customer/screens/order/order_tracking_screen.dart';
import 'package:client_customer/screens/restaurant/restaurant_screen.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/restaurant_provider.dart';
import 'services/auth_service.dart';
import 'models/user.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/auth/register_screen.dart';
import 'theme/app_theme.dart';
import 'screens/onboarding/onboarding1_screen.dart';
import 'screens/cart/cart_screen.dart';
import 'screens/cart/checkout_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(); // Ensure firebase is initialized

  Future<void> testRegisterToken(String userId) async {
    final fcmToken = await FirebaseMessaging.instance.getToken();
    if (fcmToken != null) {
      await http.post(
        Uri.parse('http://10.0.2.2:5000/api/notifications/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'token': fcmToken,
          'role': 'customer',
        }),
      );
      print("✅ Token registered: $fcmToken");
    }
  }

  final authService = AuthService();
  final token = await authService.getToken();
  final userJson = await authService.getUser();
  User? initialUser;
  if (userJson != null) {
    initialUser = User.fromJson(userJson);
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider()
            ..setToken(token ?? '')
            ..setUser(
              initialUser ?? User(id: '', name: '', email: '', role: ''),
            ),
        ),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => RestaurantProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(360, 690),
      builder: (context, child) {
        return MaterialApp(
          title: 'Food Delivery App',
          theme: AppTheme.lightTheme,
          debugShowCheckedModeBanner: false,
          home: Consumer<AuthProvider>(
            builder: (context, authProvider, _) {
              final isCustomer = authProvider.user != null &&
                  authProvider.user!.role == 'customer';
              return (authProvider.isAuth && isCustomer)
                  ? const HomeScreen()
                  : const Onboarding1Screen();
            },
          ),
          routes: {
            '/login': (context) => const LoginScreen(),
            '/register': (context) => const RegisterScreen(),
            '/home': (context) => const HomeScreen(),
            '/restaurant': (context) => RestaurantDetailScreen(
                  restaurantId:
                      ModalRoute.of(context)!.settings.arguments as String,
                ),
            '/orders': (context) => const OrderTrackingScreen(),
            '/cart': (context) => const CartScreen(),
            '/checkout': (context) => const CheckoutScreen(),
            OrderConfirmationScreen.routeName: (context) {
              try {
                print('Initializing OrderConfirmationScreen');
                final args = ModalRoute.of(context)!.settings.arguments;
                if (args == null || args is! Map<String, dynamic>) {
                  throw Exception(
                      'Invalid or missing arguments for OrderConfirmationScreen');
                }
                return OrderConfirmationScreen(orderData: args);
              } catch (e) {
                print('Error initializing OrderConfirmationScreen: $e');
                return Scaffold(
                  appBar: AppBar(title: const Text('Error')),
                  body: Center(
                    child: Text('Failed to load Order Confirmation Screen: $e'),
                  ),
                );
              }
            },
          },
        );
      },
    );
  }
}
