// lib/main.dart
import 'package:flutter/material.dart';
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

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

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
          create:
              (_) =>
                  AuthProvider()
                    ..setToken(token ?? '')
                    ..setUser(
                      initialUser ??
                          User(id: '', name: '', email: '', role: ''),
                    ),
        ),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => RestaurantProvider()),
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
              final isCustomer =
                  authProvider.user != null &&
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
          },
        );
      },
    );
  }
}
