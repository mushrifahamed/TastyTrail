import 'package:delivery_person_app/screens/DashboardScreen.dart';

import 'package:flutter/material.dart';
import 'package:delivery_person_app/screens/login_screen.dart';
import 'dart:async';

import 'package:shared_preferences/shared_preferences.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;

  
 @override
void initState() {
  super.initState();

  _animationController = AnimationController(
    duration: const Duration(seconds: 2),
    vsync: this,
  );

  _animation = CurvedAnimation(
    parent: _animationController,
    curve: Curves.easeInOut,
  );

  _animationController.forward();
  _checkLoginStatus();
 
}


  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _checkLoginStatus() async {
  await Future.delayed(const Duration(seconds: 2)); // for splash delay + animation
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('auth_token');

  if (token != null && token.isNotEmpty) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const DashBoard()),
    );
  } else {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }
}


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: FadeTransition(
          opacity: _animation,
          child: ScaleTransition(
            scale: _animation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  height: 250,
                  width: 250,
                  child: Image.asset(
                    'lib/assets/images/logo.png', // Replace with your logo path
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 24),
                // Text(
                //   'TastyTrail Delivery',
                //   style: TextStyle(
                //     fontSize: 24,
                //     fontWeight: FontWeight.bold,
                //     color: Colors.deepPurple,
                //   ),
                // ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}