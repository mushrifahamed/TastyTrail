import 'dart:convert';

import 'package:delivery_person_app/screens/DashboardScreen.dart';
import 'package:delivery_person_app/screens/HomeScreen.dart';
import 'package:delivery_person_app/screens/SignupScreen.dart';
import 'package:delivery_person_app/services/ApiService.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController(text: '+94');
  final _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _rememberMe = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _loginUser() async {
    final url = Uri.parse('http://10.0.2.2:3000/api/users/login-delivery');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone': _phoneController.text.trim(),
          'password': _passwordController.text.trim(),
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final decoded = jsonDecode(response.body);
        print('📦 Raw response: $decoded');

        final token = decoded['token'];
        final data = decoded['data'];

        if (data == null || data['user'] == null) {
          print('⚠ data or user is null: $data');
          throw Exception('Invalid response format: missing user or token');
        }

        final user = data['user'];
        final userId = user['_id'];
        final role = user['role'];

        print('✅ Parsed userId: $userId');
        print('✅ Parsed role: $role');
        print('✅ Parsed token: $token');

        // Save to SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        await prefs.setString('user_id', userId);
        await prefs.setString('role', role);

        final apiService = ApiService(baseUrl: 'http://10.0.2.2:3005');
        final fcmToken = await apiService.registerFcmToken(userId, role);
        if (fcmToken != null) {
          await prefs.setString('fcm_token', fcmToken);
          debugPrint('✅ FCM token saved to SharedPreferences');
        }
        //save fcm token

        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashBoard()),
        );

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Login successful!'),
              backgroundColor: Colors.green),
        );
      } else {
        final error = jsonDecode(response.body)['message'] ?? 'Login failed';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      // Login logic would go here
      //navigate to home
      _loginUser();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo and welcome text
                _buildHeader(),
                const SizedBox(height: 40),

                // Form
                Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Phone number field
                      _buildPhoneField(),
                      const SizedBox(height: 16),

                      // Password field
                      _buildPasswordField(),
                      const SizedBox(height: 8),

                      // Remember me and Forgot password
                      _buildRememberForgotRow(),
                      const SizedBox(height: 24),

                      // Login button
                      _buildLoginButton(),
                      const SizedBox(height: 16),

                      // Or continue with
                      _buildDivider(),
                      const SizedBox(height: 16),

                      // Social login options
                      _buildSocialLoginRow(),
                      const SizedBox(height: 24),

                      // Sign up option
                      _buildSignUpOption(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          height: 70,
          width: 70,
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(
            Icons.lock_outline_rounded,
            size: 40,
            color: Colors.blue.shade800,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Welcome back!',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Please sign in to your account',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            color: Colors.grey.shade600,
          ),
        ),
      ],
    );
  }

  Widget _buildPhoneField() {
    return TextFormField(
      controller: _phoneController,
      keyboardType: TextInputType.phone,
      decoration: const InputDecoration(
        labelText: 'Phone Number',
        prefixIcon: Icon(Icons.phone_outlined),
        hintText: '+94XXXXXXXXX',
      ),
      inputFormatters: [
        // Ensure text always starts with +94 and prevent editing it
        TextInputFormatter.withFunction((oldValue, newValue) {
          // Always ensure the text starts with +94
          if (!newValue.text.startsWith('+94')) {
            return oldValue;
          }
          
          // Check if user is trying to add a '0' right after +94
          if (newValue.text.length > 3 && newValue.text.substring(0, 4) == '+940') {
            return oldValue;
          }
          
          return newValue;
        }),
      ],
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter your phone number';
        }
        
        if (!value.startsWith('+94')) {
          return 'Phone number must start with +94';
        }
        
        // Check if there's a valid number after the country code
        final number = value.substring(3);
        if (number.isEmpty) {
          return 'Please enter your phone number after +94';
        }
        
        // Check if the phone number contains only digits after +94
        final phoneRegex = RegExp(r'^\+94[1-9]\d{8}$');
        if (!phoneRegex.hasMatch(value)) {
          return 'Please enter a valid phone number (+94XXXXXXXXX)';
        }
        
        return null;
      },
      onChanged: (value) {
        // Ensure the +94 prefix is always there
        if (!value.startsWith('+94')) {
          _phoneController.text = '+94${value.replaceAll('+94', '')}';
          _phoneController.selection = TextSelection.fromPosition(
            TextPosition(offset: _phoneController.text.length),
          );
        }
      },
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
      controller: _passwordController,
      obscureText: !_isPasswordVisible,
      decoration: InputDecoration(
        labelText: 'Password',
        prefixIcon: const Icon(Icons.lock_outline),
        hintText: 'Enter your password',
        suffixIcon: IconButton(
          icon: Icon(
            _isPasswordVisible
                ? Icons.visibility_outlined
                : Icons.visibility_off_outlined,
          ),
          onPressed: () {
            setState(() {
              _isPasswordVisible = !_isPasswordVisible;
            });
          },
        ),
      ),
      validator: (value) {
        if (value == null || value.isEmpty) {
          return 'Please enter your password';
        }
        if (value.length < 6) {
          return 'Password must be at least 6 characters';
        }
        return null;
      },
    );
  }

  Widget _buildRememberForgotRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            SizedBox(
              height: 24,
              width: 24,
              child: Checkbox(
                value: _rememberMe,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(4)),
                onChanged: (value) {
                  setState(() {
                    _rememberMe = value!;
                  });
                },
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Remember me',
              style: TextStyle(color: Colors.grey.shade700),
            ),
          ],
        ),
        TextButton(
          onPressed: () {
            // Handle forgot password
          },
          child: Text(
            'Forgot password?',
            style: TextStyle(
              color: Colors.blue.shade700,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginButton() {
    return ElevatedButton(
      onPressed: _submitForm,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blue.shade800,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: const Text(
        'Sign In',
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(
          child: Divider(
            color: Colors.grey.shade300,
            thickness: 1,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Or continue with',
            style: TextStyle(color: Colors.grey.shade600),
          ),
        ),
        Expanded(
          child: Divider(
            color: Colors.grey.shade300,
            thickness: 1,
          ),
        ),
      ],
    );
  }

  Widget _buildSocialLoginRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildSocialButton(Icons.g_mobiledata_rounded, 'Google'),
        const SizedBox(width: 16),
        _buildSocialButton(Icons.apple, 'Apple'),
        const SizedBox(width: 16),
        _buildSocialButton(Icons.facebook, 'Facebook'),
      ],
    );
  }

  Widget _buildSocialButton(IconData icon, String label) {
    return InkWell(
      onTap: () {
        // Handle social login
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          icon,
          size: 30,
          color: Colors.grey.shade800,
        ),
      ),
    );
  }

  Widget _buildSignUpOption() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'Don\'t have an account?',
          style: TextStyle(color: Colors.grey.shade600),
        ),
        TextButton(
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SignupScreen()),
            );
          },
          child: Text(
            'Sign Up',
            style: TextStyle(
              color: Colors.blue.shade700,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}