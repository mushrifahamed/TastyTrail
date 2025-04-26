// In screens/cart/checkout_screen.dart

import 'package:client_customer/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({Key? key}) : super(key: key);

  @override
  _CheckoutScreenState createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final TextEditingController _addressController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();
  String _selectedRestaurantId = '';
  String _selectedRestaurantName = '';
  String _selectedPaymentMethod = 'Cash on Delivery';
  bool _isProcessing = false;

  final List<String> _paymentMethods = [
    'Cash on Delivery',
    'Credit Card',
    'PayPal',
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args != null && args is Map<String, dynamic>) {
      _selectedRestaurantId = args['restaurantId'] ?? '';
      _selectedRestaurantName = args['restaurantName'] ?? 'Restaurant';
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, child) {
          if (_selectedRestaurantId.isEmpty) {
            return const Center(child: Text('No restaurant selected'));
          }

          if (cartProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final restaurantItems =
              cartProvider.itemsByRestaurant[_selectedRestaurantId] ?? [];

          if (restaurantItems.isEmpty) {
            return const Center(child: Text('No items to checkout'));
          }

          final totalAmount =
              cartProvider.getTotalAmountForRestaurant(_selectedRestaurantId);
          const deliveryFee = 2.99;
          final taxAmount = totalAmount * 0.1; // 10% tax
          final finalTotal = totalAmount + deliveryFee + taxAmount;

          return Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Restaurant Info Card
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.restaurant,
                              color: AppColors.primary,
                              size: 32,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _selectedRestaurantName,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    '${restaurantItems.length} items | Estimated delivery: 30-45 min',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Delivery Address
                    const Text(
                      'Delivery Address',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _addressController,
                      decoration: InputDecoration(
                        hintText: 'Enter your delivery address',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey[300]!),
                        ),
                        prefixIcon: const Icon(Icons.location_on),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.my_location),
                          onPressed: () {
                            // Get current location
                            _addressController.text = "Current Location";
                          },
                        ),
                      ),
                      maxLines: 2,
                    ),

                    const SizedBox(height: 20),

                    // Additional Note
                    const Text(
                      'Additional Note',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _noteController,
                      decoration: InputDecoration(
                        hintText: 'Special instructions for delivery',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: Colors.grey[300]!),
                        ),
                        prefixIcon: const Icon(Icons.note),
                      ),
                      maxLines: 2,
                    ),

                    const SizedBox(height: 20),

                    // Payment Method
                    const Text(
                      'Payment Method',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 1,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        child: Column(
                          children: _paymentMethods.map((method) {
                            return RadioListTile<String>(
                              title: Text(method),
                              value: method,
                              groupValue: _selectedPaymentMethod,
                              onChanged: (value) {
                                setState(() {
                                  _selectedPaymentMethod = value!;
                                });
                              },
                              activeColor: AppColors.primary,
                              contentPadding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                            );
                          }).toList(),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Order Summary
                    const Text(
                      'Order Summary',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            // Item List (collapsible)
                            ExpansionTile(
                              title: Text(
                                'Items (${restaurantItems.length})',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              initiallyExpanded: false,
                              children: restaurantItems.map((item) {
                                return ListTile(
                                  dense: true,
                                  title: Text(item.name),
                                  trailing: Text(
                                    '${item.quantity} × \$${item.price.toStringAsFixed(2)}',
                                  ),
                                  subtitle: Text(
                                    '\$${(item.price * item.quantity).toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),

                            const Divider(),

                            // Price breakdown
                            _buildPriceSummaryRow('Subtotal',
                                '\$${totalAmount.toStringAsFixed(2)}'),
                            _buildPriceSummaryRow('Delivery Fee',
                                '\$${deliveryFee.toStringAsFixed(2)}'),
                            _buildPriceSummaryRow('Tax (10%)',
                                '\$${taxAmount.toStringAsFixed(2)}'),
                            const Divider(),
                            _buildPriceSummaryRow(
                              'Total',
                              '\$${finalTotal.toStringAsFixed(2)}',
                              isTotal: true,
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 100), // Space for the fixed button
                  ],
                ),
              ),

              // Fixed place order button at bottom
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: ElevatedButton(
                      onPressed: _isProcessing
                          ? null
                          : () => _placeOrder(cartProvider),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        minimumSize: const Size(double.infinity, 50),
                      ),
                      child: _isProcessing
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              'Place Order',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPriceSummaryRow(String label, String value,
      {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 16 : 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 16 : 14,
              color: isTotal ? AppColors.primary : null,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _placeOrder(CartProvider cartProvider) async {
    if (_addressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a delivery address')),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    try {
      await cartProvider.checkoutRestaurant(
        _selectedRestaurantId,
        _addressController.text.trim(),
      );

      if (!mounted) return;

      // Show success and navigate
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Order placed successfully!')),
      );

      Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);

      // Show order confirmation dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          title: const Text('Order Confirmed!'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check_circle,
                color: Colors.green,
                size: 64,
              ),
              const SizedBox(height: 16),
              Text(
                'Your order from $_selectedRestaurantName has been placed successfully.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'You can track your order in the orders section.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${error.toString()}')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }
}
