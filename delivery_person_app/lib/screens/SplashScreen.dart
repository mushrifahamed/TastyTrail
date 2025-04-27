import 'package:flutter/material.dart';
import 'package:delivery_person_app/screens/login_screen.dart';
import 'dart:async';

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
    
    // Create animation controller
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    // Create a curved animation for a nice effect
    _animation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    
    // Start animation
    _animationController.forward();
    
    // Navigate to login screen after a delay
    Timer(const Duration(seconds: 3), () {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
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