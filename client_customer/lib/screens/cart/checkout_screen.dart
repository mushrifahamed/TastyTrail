// In screens/cart/checkout_screen.dart

import 'package:client_customer/providers/auth_provider.dart';
import 'package:client_customer/screens/cart/order_confirmation_screen.dart';
import 'package:client_customer/screens/location_picker_screen.dart';
import 'package:client_customer/services/payhere_service.dart';
import 'package:client_customer/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:payhere_mobilesdk_flutter/payhere_mobilesdk_flutter.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({Key? key}) : super(key: key);

  @override
  _CheckoutScreenState createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _isGettingLocation = false;
  LatLng? _selectedLocation;
  final TextEditingController _addressController = TextEditingController();
  String _selectedRestaurantId = '';
  String _selectedRestaurantName = '';
  String _selectedPaymentMethod = 'Cash on Delivery';
  bool _isProcessing = false;

  // Updated to only include Cash and Card
  final List<String> _paymentMethods = [
    'Cash on Delivery',
    'Credit Card',
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
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() {
      _isGettingLocation = true;
    });

    try {
      // Check location permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permissions are denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions are permanently denied');
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition();
      _selectedLocation = LatLng(position.latitude, position.longitude);

      // Get address from coordinates
      List<Placemark> placemarks =
          await placemarkFromCoordinates(position.latitude, position.longitude);

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        _addressController.text =
            '${place.street}, ${place.subLocality}, ${place.locality}, ${place.postalCode}';
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error getting location: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isGettingLocation = false;
      });
    }
  }

  Future<void> _openLocationPicker() async {
    final LatLng? result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => LocationPickerScreen(
          initialLocation: _selectedLocation,
        ),
      ),
    );

    if (result != null) {
      _selectedLocation = result;
      // Get address from coordinates
      List<Placemark> placemarks =
          await placemarkFromCoordinates(result.latitude, result.longitude);

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        _addressController.text =
            '${place.street}, ${place.subLocality}, ${place.locality}, ${place.postalCode}';
      }
    }
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
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
                          ),
                          maxLines: 2,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _isGettingLocation
                                    ? null
                                    : _getCurrentLocation,
                                icon: const Icon(Icons.my_location),
                                label: _isGettingLocation
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2))
                                    : const Text('Use Current Location'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.grey[200],
                                  foregroundColor: Colors.black87,
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => _openLocationPicker(),
                                icon: const Icon(Icons.map),
                                label: const Text('Select on Map'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.grey[200],
                                  foregroundColor: Colors.black87,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
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

                    const SizedBox(
                      height: 100,
                    ), // Space for the fixed button
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
                          : () async {
                              if (_addressController.text.isEmpty ||
                                  _selectedLocation == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Please enter your delivery address')),
                                );
                                return;
                              }

                              setState(() {
                                _isProcessing = true;
                              });
                              print(
                                  "[CheckoutScreen] Place Order button pressed."); // Log: Button press

                              try {
                                final cartProvider = Provider.of<CartProvider>(
                                    context,
                                    listen: false);

                                // For Cash on Delivery
                                if (_selectedPaymentMethod ==
                                    'Cash on Delivery') {
                                  print(
                                      "[CheckoutScreen] Processing Cash on Delivery..."); // Log: COD start
                                  final result =
                                      await cartProvider.checkoutRestaurant(
                                    _selectedRestaurantId,
                                    _addressController.text,
                                    'cash',
                                    _selectedLocation != null
                                        ? [
                                            _selectedLocation!.longitude,
                                            _selectedLocation!.latitude
                                          ]
                                        : null,
                                  );

                                  if (!result['success']) {
                                    throw Exception(result['message'] ??
                                        'Failed to place order');
                                  }

                                  if (!mounted) return;

                                  // Navigate to confirmation screen with order data
                                  await Navigator.pushNamedAndRemoveUntil(
                                    context,
                                    OrderConfirmationScreen.routeName,
                                    (route) => false,
                                    arguments: result['order'],
                                  );
                                  print(
                                      "[CheckoutScreen] Cash on Delivery processed."); // Log: COD end
                                  return;
                                }

                                // For Credit Card - PayHere integration
                                if (_selectedPaymentMethod == 'Credit Card') {
                                  print(
                                      "[CheckoutScreen] Processing Credit Card Payment...");

                                  // First create order in your backend
                                  final orderResponse =
                                      await cartProvider.checkoutRestaurant(
                                    _selectedRestaurantId,
                                    _addressController.text,
                                    'card',
                                    _selectedLocation != null
                                        ? [
                                            _selectedLocation!.longitude,
                                            _selectedLocation!.latitude
                                          ]
                                        : null,
                                  );

                                  if (!orderResponse['success']) {
                                    throw Exception(orderResponse['message'] ??
                                        'Failed to create order');
                                  }

                                  final orderData = orderResponse['order'] ??
                                      orderResponse['data']?['order'];
                                  if (orderData == null) {
                                    throw Exception(
                                        'Invalid order data received from server');
                                  }

                                  final orderId = orderData['_id'];
                                  if (orderId == null || orderId.isEmpty) {
                                    throw Exception(
                                        'Could not extract order ID from response');
                                  }

                                  final totalAmount = double.parse(
                                      orderData['totalAmount'].toString());

                                  // Get user info for payment
                                  final user = Provider.of<AuthProvider>(
                                          context,
                                          listen: false)
                                      .user;
                                  final customerName = user?.name ?? 'Customer';
                                  final customerEmail = user?.email;
                                  final customerPhone = user?.phone;

                                  // Initialize PayHere payment
                                  final payhereService = PayhereService();
                                  final paymentResult =
                                      await payhereService.initiatePayment(
                                    orderId: orderId,
                                    amount: totalAmount,
                                    items:
                                        "Order from $_selectedRestaurantName",
                                    customerName: customerName,
                                    email: customerEmail,
                                    phone: customerPhone,
                                    address: _addressController.text,
                                  );

                                  if (!paymentResult['success']) {
                                    throw Exception(paymentResult['message']);
                                  }

                                  // Launch PayHere payment gateway
                                  PayHere.startPayment(
                                    paymentResult['paymentObject'],
                                    (paymentId) async {
                                      print(
                                          "[CheckoutScreen] Payment Success. PaymentId: $paymentId");
                                      print(
                                          "[CheckoutScreen] Original order data: $orderData");

                                      final updateResult = await payhereService
                                          .savePaymentDetails(
                                        orderId: orderId,
                                        paymentId: paymentId,
                                        amount: totalAmount,
                                        status: 'completed',
                                      );

                                      if (!mounted) return;

                                      if (updateResult['success']) {
                                        final confirmationData =
                                            Map<String, dynamic>.from(
                                                orderData);
                                        confirmationData['totalAmount'] =
                                            totalAmount;
                                        confirmationData['paymentType'] =
                                            'Credit Card';
                                        confirmationData['paymentStatus'] =
                                            'completed';
                                        confirmationData['paymentId'] =
                                            paymentId;

                                        print(
                                            "[CheckoutScreen] Confirmation data being sent: $confirmationData");

                                        await Navigator.pushNamedAndRemoveUntil(
                                          context,
                                          OrderConfirmationScreen.routeName,
                                          (route) => false,
                                          arguments: confirmationData,
                                        );
                                      } else {
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                              content: Text(updateResult[
                                                      'message'] ??
                                                  'Failed to update payment status')),
                                        );
                                        setState(() {
                                          _isProcessing = false;
                                        });
                                      }
                                    },
                                    (error) {
                                      // Payment failed callback
                                      print("Payment Error: $error");
                                      if (!mounted) return;
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                            content:
                                                Text('Payment failed: $error')),
                                      );
                                      setState(() {
                                        _isProcessing = false;
                                      });
                                    },
                                    () {
                                      // Payment dismissed callback
                                      print("Payment Dismissed");
                                      if (!mounted) return;
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        const SnackBar(
                                            content: Text(
                                                'Payment cancelled by user')),
                                      );
                                      setState(() {
                                        _isProcessing = false;
                                      });
                                    },
                                  );
                                }
                              } catch (e) {
                                print(
                                    "[CheckoutScreen] Error in checkout process: $e"); // Log: Error
                                if (!mounted) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                      content: Text('Error: ${e.toString()}')),
                                );
                                setState(() {
                                  _isProcessing = false;
                                });
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isProcessing
                          ? const CircularProgressIndicator(
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white))
                          : const Text('Place Order',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
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
}
