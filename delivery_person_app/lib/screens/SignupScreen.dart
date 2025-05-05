import 'package:delivery_person_app/theme/apptheme.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class SignupScreen extends StatefulWidget {
  const SignupScreen({Key? key}) : super(key: key);

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _nicOrLicenseController = TextEditingController();
  final _vehicleNumberController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _selectedVehicleType = 'bike';
  final List<String> _vehicleTypes = ['bike', 'car', 'van', 'truck', 'tuk'];
  bool _agreeToTerms = false;
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _isLoading = false;

  // Mock document upload URLs (in a real app, you would implement actual file uploads)
  List<String> _uploadedDocuments = [];

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _nicOrLicenseController.dispose();
    _vehicleNumberController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _registerUser() async {
    if (_uploadedDocuments.isEmpty) {
      // For demo purposes, add placeholder document URLs
      _uploadedDocuments = [
        "https://yourdomain.com/uploads/license.jpg",
        "https://yourdomain.com/uploads/insurance.jpg"
      ];
    }

    final Map<String, dynamic> registrationData = {
      "name": _fullNameController.text,
      "phone": _phoneController.text,
      "password": _passwordController.text,
      "nicOrLicense": _nicOrLicenseController.text,
      "vehicleType": _selectedVehicleType,
      "vehicleNumber": _vehicleNumberController.text,
      "documents": _uploadedDocuments,
    };

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await http.post(
        Uri.parse('http://10.0.2.2:3000/api/users/delivery/register'),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(registrationData),
      );

      setState(() {
        _isLoading = false;
      });

      if (response.statusCode == 201 || response.statusCode == 200) {
        // Registration successful
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Registration successful! You can now log in.'),
            backgroundColor: Colors.green,
          ),
        );
        // Navigate to login screen or home page
        Navigator.of(context).pop();
      } else {
        // Handle error
        final errorData = jsonDecode(response.body);
        String errorMessage = errorData['message'] ?? 'Registration failed. Please try again.';
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Connection error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _submitForm() {
    if (_formKey.currentState!.validate() && _agreeToTerms) {
      _registerUser();
    } else if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please agree to terms and conditions'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _mockDocumentUpload(String documentType) {
    // In a real app, you would implement file picking and uploading
    // For this example, we'll just show a success message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$documentType uploaded successfully'),
        backgroundColor: Colors.green,
      ),
    );
    
    // For demonstration purposes, add a document URL to our list
    setState(() {
      _uploadedDocuments.add("https://yourdomain.com/uploads/$documentType-${DateTime.now().millisecondsSinceEpoch}.jpg");
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          '',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading 
          ? Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Personal Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Full Name
                      TextFormField(
                        controller: _fullNameController,
                        decoration: const InputDecoration(
                          labelText: 'Full Name',
                          prefixIcon: Icon(Icons.person_outline),
                          hintText: 'Enter your full name',
                          filled: true,
                          fillColor: Color(0xFFF5F5F5),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your full name';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Phone Number
                      TextFormField(
  controller: _phoneController,
  keyboardType: TextInputType.phone,
  decoration: const InputDecoration(
    labelText: 'Phone Number',
    prefixIcon: Icon(Icons.phone_outlined),
    filled: true,
    fillColor: Color(0xFFF5F5F5),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.all(Radius.circular(12)),
      borderSide: BorderSide.none,
    ),
  ),
  inputFormatters: [
    // Custom input formatter to control typing
    FilteringTextInputFormatter.allow(RegExp(r'^\+94[1-9][0-9]*$')),
  ],
  onChanged: (value) {
    if (!value.startsWith('+94')) {
      _phoneController.text = '+94';
      _phoneController.selection = TextSelection.fromPosition(
        const TextPosition(offset: 3),
      );
    }
  },
  validator: (value) {
    if (value == null || value.isEmpty || value.length < 6) {
      return 'Please enter a valid phone number';
    }
    if (!value.startsWith('+94')) {
      return 'Phone number must start with +94';
    }
    if (value.length >= 4 && value[3] == '0') {
      return 'Do not start with 0 after +94';
    }
    return null;
  },
  onTap: () {
    // Ensure +94 is always there on focus
    if (!_phoneController.text.startsWith('+94')) {
      _phoneController.text = '+94';
      _phoneController.selection = const TextSelection.collapsed(offset: 3);
    }
  },
),

                      const SizedBox(height: 24),
                      
                      // Password
                      TextFormField(
                        controller: _passwordController,
                        obscureText: !_isPasswordVisible,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          hintText: 'Create a password',
                          filled: true,
                          fillColor: const Color(0xFFF5F5F5),
                          border: const OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            borderSide: BorderSide.none,
                          ),
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
                            return 'Please enter a password';
                          }
                          if (value.length < 8) {
                            return 'Password must be at least 8 characters';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Confirm Password
                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: !_isConfirmPasswordVisible,
                        decoration: InputDecoration(
                          labelText: 'Confirm Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          hintText: 'Confirm your password',
                          filled: true,
                          fillColor: const Color(0xFFF5F5F5),
                          border: const OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            borderSide: BorderSide.none,
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _isConfirmPasswordVisible
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                            onPressed: () {
                              setState(() {
                                _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                              });
                            },
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please confirm your password';
                          }
                          if (value != _passwordController.text) {
                            return 'Passwords do not match';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                      
                      Text(
                        'Driver Information',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color:  AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // NIC or License Number
                      TextFormField(
                        controller: _nicOrLicenseController,
                        decoration: const InputDecoration(
                          labelText: 'NIC or License Number',
                          prefixIcon: Icon(Icons.badge_outlined),
                          hintText: 'Enter your NIC or license number',
                          filled: true,
                          fillColor: Color(0xFFF5F5F5),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter your NIC or license number';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Vehicle Type Dropdown
                      DropdownButtonFormField<String>(
                        value: _selectedVehicleType,
                        decoration: const InputDecoration(
                          labelText: 'Vehicle Type',
                          prefixIcon: Icon(Icons.directions_car_outlined),
                          filled: true,
                          fillColor: Color(0xFFF5F5F5),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        items: _vehicleTypes.map((String type) {
                          return DropdownMenuItem<String>(
                            value: type,
                            child: Text(type),
                          );
                        }).toList(),
                        onChanged: (String? newValue) {
                          setState(() {
                            _selectedVehicleType = newValue!;
                          });
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Vehicle Number
                      TextFormField(
                        controller: _vehicleNumberController,
                        decoration: const InputDecoration(
                          labelText: 'Vehicle Number',
                          prefixIcon: Icon(Icons.car_repair_outlined),
                          hintText: 'e.g., WB-1234',
                          filled: true,
                          fillColor: Color(0xFFF5F5F5),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(12)),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter vehicle number';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),
                      
                      // Upload Documents Section
                      Text(
                        'Upload Documents',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Document Upload Buttons
                      Row(
                        children: [
                          Expanded(
                            child: _buildDocumentUploadButton(
                              'License Photo', 
                              Icons.badge_outlined,
                              () => _mockDocumentUpload('license'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildDocumentUploadButton(
                              'Insurance Document',
                              Icons.policy_outlined,
                              () => _mockDocumentUpload('insurance'),
                            ),
                          ),
                        ],
                      ),
                      
                      if (_uploadedDocuments.isNotEmpty)
                        Container(
                          margin: EdgeInsets.only(top: 16),
                          padding: EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Uploaded Documents (${_uploadedDocuments.length}):',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green.shade800,
                                ),
                              ),
                              SizedBox(height: 8),
                              ...List.generate(
                                _uploadedDocuments.length,
                                (index) => Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Row(
                                    children: [
                                      Icon(Icons.check_circle, color: Colors.green, size: 16),
                                      SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          'Document ${index + 1}',
                                          style: TextStyle(color: Colors.green.shade700),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      
                      const SizedBox(height: 24),
                      
                      // Terms and Conditions
                      Row(
                        children: [
                          Checkbox(
                            value: _agreeToTerms,
                            onChanged: (bool? value) {
                              setState(() {
                                _agreeToTerms = value!;
                              });
                            },
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _agreeToTerms = !_agreeToTerms;
                                });
                              },
                              child: Text.rich(
                                TextSpan(
                                  text: 'I agree to the ',
                                  style: TextStyle(color: Colors.grey.shade700),
                                  children: [
                                    TextSpan(
                                      text: 'Terms & Conditions',
                                      style: TextStyle(
                                        color:  AppColors.primary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const TextSpan(
                                      text: ' and ',
                                    ),
                                    TextSpan(
                                      text: 'Privacy Policy',
                                      style: TextStyle(
                                        color: AppColors.primary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      
                      // Submit Button
                      ElevatedButton(
                        onPressed: _submitForm,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Create Account',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      // Login Option
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Already have an account?',
                            style: TextStyle(color: Colors.grey.shade600),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                            },
                            child: Text(
                              'Sign In',
                              style: TextStyle(
                                color: Colors.deepPurple.shade700,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildDocumentUploadButton(String title, IconData icon, VoidCallback onPressed) {
    return OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        side: BorderSide(color: AppColors.primary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: AppColors.primary,
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              color:  AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}