import 'package:delivery_person_app/screens/SplashScreen.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized(); // ✅ REQUIRED before Firebase.init
  await Firebase.initializeApp();
  runApp(const DeliveryApp());
}


class DeliveryApp extends StatelessWidget {
  const DeliveryApp({super.key});  // Fixed the class name to start with uppercase

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Delivery App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const SplashScreen(),  // Changed to SplashScreen instead of LoginScreen
    );
  }
}