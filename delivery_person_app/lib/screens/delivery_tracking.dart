import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import 'package:location/location.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DeliveryStatusScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const DeliveryStatusScreen({super.key, required this.order});

  @override
  State<DeliveryStatusScreen> createState() => _DeliveryStatusScreenState();
}

class _DeliveryStatusScreenState extends State<DeliveryStatusScreen> {
  final MapController _mapController = MapController();
  final List<Marker> _markers = [];
  final Location _location = Location();
  LocationData? _currentLocation;
  StreamSubscription<LocationData>? _locationSubscription;
  
  // Default center and zoom (will be updated with customer location)
  LatLng _center = LatLng(0, 0);
  double _zoom = 14.0;

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  void _initializeMap() async {
    // Get customer location from order
    final coordinates = widget.order['deliveryLocation']['coordinates']; // [lng, lat]
    final customerLatLng = LatLng(coordinates[1], coordinates[0]);
    
    // Update initial camera position to customer location
    _center = customerLatLng;
    
    // Add customer marker
    _markers.add(
      Marker(
        point: customerLatLng,
        child: const Icon(
          Icons.location_on,
          color: Colors.red,
          size: 40,
        ),
      ),
    );

    // Request location permission and start tracking
    await _requestLocationPermission();
    await _startLocationTracking();
    
    setState(() {});
  }

  Future<void> _requestLocationPermission() async {
    bool serviceEnabled;
    PermissionStatus permissionGranted;

    serviceEnabled = await _location.serviceEnabled();
    if (!serviceEnabled) {
      serviceEnabled = await _location.requestService();
      if (!serviceEnabled) {
        return;
      }
    }

    permissionGranted = await _location.hasPermission();
    if (permissionGranted == PermissionStatus.denied) {
      permissionGranted = await _location.requestPermission();
      if (permissionGranted != PermissionStatus.granted) {
        return;
      }
    }
  }

  Future<void> _startLocationTracking() async {
    try {
      // Get current location first
      _currentLocation = await _location.getLocation();
      _updateDeliveryMarker(_currentLocation!);
      
      // Then subscribe to location changes
      _locationSubscription = _location.onLocationChanged.listen((LocationData locationData) {
        setState(() {
          _currentLocation = locationData;
          _updateDeliveryMarker(locationData);
        });
      });
    } catch (e) {
      print("Error getting location: $e");
    }
  }

  void _updateDeliveryMarker(LocationData locationData) {
    // Remove old delivery marker if exists
    _markers.removeWhere((marker) => 
      marker.child is Icon && 
      (marker.child as Icon).color == Colors.blue);
    
    // Add new delivery marker
    _markers.add(
      Marker(
        point: LatLng(locationData.latitude!, locationData.longitude!),
        child: Column(
          children: [
            const Icon(
              Icons.directions_car,
              color: Colors.blue,
              size: 30,
            ),
            Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'You',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );

    setState(() {});
  }

  @override
  void dispose() {
    _locationSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final customer = widget.order['customerInfo'];
    final address = widget.order['deliveryAddress'];
    final orderId = widget.order['orderId'];
    final totalAmount = widget.order['totalAmount'];

    return Scaffold(
      appBar: AppBar(
        title: Text('Order #${orderId.substring(0, 6)}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: _centerOnDeliveryPerson,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Map View
            Container(
              height: 250,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.5),
                    spreadRadius: 2,
                    blurRadius: 5,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    center: _center,
                    zoom: _zoom,
                    interactiveFlags: InteractiveFlag.all,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.example.app',
                    ),
                    MarkerLayer(markers: _markers),
                    // Optional: Add a polyline between delivery person and customer
                    if (_currentLocation != null)
                      PolylineLayer(
                        polylines: [
                          Polyline(
                            points: [
                              LatLng(_currentLocation!.latitude!, _currentLocation!.longitude!),
                              _center,
                            ],
                            strokeWidth: 4,
                            color: Colors.blue.withOpacity(0.7),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Distance & ETA Row
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    children: [
                      const Icon(Icons.route, color: Colors.blue),
                      const SizedBox(height: 4),
                      Text(_calculateDistance(), style: Theme.of(context).textTheme.bodyLarge),
                      Text('Distance', style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                  const VerticalDivider(thickness: 1),
                  Column(
                    children: [
                      const Icon(Icons.access_time, color: Colors.orange),
                      const SizedBox(height: 4),
                      Text(_calculateETA(), style: Theme.of(context).textTheme.bodyLarge),
                      Text('ETA', style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Customer Info
            Text(
              'Customer',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.blue[100],
                  child: const Icon(Icons.person, color: Colors.blue),
                ),
                title: Text(customer['name']),
                subtitle: Text(customer['phone']),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.phone, color: Colors.green),
                      onPressed: () {
                        // Handle phone call
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.message, color: Colors.blue),
                      onPressed: () {
                        // Handle messaging
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Address
            Text(
              'Delivery Address',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: Colors.red[100],
                  child: const Icon(Icons.location_on, color: Colors.red),
                ),
                title: Text(address),
                trailing: IconButton(
                  icon: const Icon(Icons.directions, color: Colors.blue),
                  onPressed: () {
                    _showDirections();
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Total Amount
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Total Amount',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      'Rs. $totalAmount',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Colors.green[700],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Delivery Status Steps
            Text(
              'Update Delivery Status',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            Column(
              children: [
                _buildStatusButton(context, 'Accepted', icon: Icons.check_circle),
                _buildStatusButton(context, 'Picked Up', icon: Icons.delivery_dining),
                _buildStatusButton(context, 'In Transit', icon: Icons.local_shipping),
                _buildStatusButton(context, 'Delivered', color: Colors.green, icon: Icons.task_alt),
              ],
            )
          ],
        ),
      ),
    );
  }

  String _calculateDistance() {
    if (_currentLocation == null) return '-- km';
    
    // Calculate distance between delivery person and customer
    final distance = calculateDistance(
      _currentLocation!.latitude!,
      _currentLocation!.longitude!,
      _center.latitude,
      _center.longitude,
    );
    
    return '${distance.toStringAsFixed(1)} km';
  }

  String _calculateETA() {
    if (_currentLocation == null) return '-- min';
    
    // Simple ETA calculation (assuming 20 km/h average speed)
    final distanceInKm = calculateDistance(
      _currentLocation!.latitude!,
      _currentLocation!.longitude!,
      _center.latitude,
      _center.longitude,
    );
    
    // Convert distance to minutes (at 20 km/h)
    final minutes = (distanceInKm / 20 * 60).round();
    
    return '$minutes min';
  }

  // Calculate distance between two coordinates using Haversine formula
  double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371; // in kilometers
    
    final double dLat = _toRadians(lat2 - lat1);
    final double dLon = _toRadians(lon2 - lon1);
    
    final double a = 
        sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) * cos(_toRadians(lat2)) * 
        sin(dLon / 2) * sin(dLon / 2);
        
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    final double distance = earthRadius * c;
    
    return distance;
  }
  
  double _toRadians(double degree) {
    return degree * pi / 180;
  }
  
  double sin(double x) {
    return x - x * x * x / 6 + x * x * x * x * x / 120;
  }
  
  double cos(double x) {
    return 1 - x * x / 2 + x * x * x * x / 24;
  }
  
  double sqrt(double x) {
    double guess = x / 2;
    for (int i = 0; i < 10; i++) {
      guess = (guess + x / guess) / 2;
    }
    return guess;
  }
  
  double atan2(double y, double x) {
    // A simple approximation
    if (x > 0) {
      return atan(y / x);
    } else if (x < 0) {
      return y >= 0 ? atan(y / x) + pi : atan(y / x) - pi;
    } else {
      return y > 0 ? pi / 2 : -pi / 2;
    }
  }
  
  double atan(double x) {
    // Simple approximation
    return x / (1 + 0.28 * x * x);
  }

  void _centerOnDeliveryPerson() {
    if (_currentLocation != null) {
      _mapController.move(
        LatLng(_currentLocation!.latitude!, _currentLocation!.longitude!),
        15, // zoom level
      );
    }
  }

  void _showDirections() {
    if (_currentLocation != null) {
      // Calculate bounds to fit both markers
      double north = max(_currentLocation!.latitude!, _center.latitude);
      double south = min(_currentLocation!.latitude!, _center.latitude);
      double east = max(_currentLocation!.longitude!, _center.longitude);
      double west = min(_currentLocation!.longitude!, _center.longitude);
      
      // Add padding
      north += (north - south) * 0.1;
      south -= (north - south) * 0.1;
      east += (east - west) * 0.1;
      west -= (east - west) * 0.1;
      
      final centerPoint = LatLng(
        (north + south) / 2,
        (east + west) / 2,
      );
      
      // Calculate appropriate zoom level
      final latZoom = log(360 / (north - south)) / log(2);
      final lngZoom = log(360 / (east - west)) / log(2);
      final zoom = min(latZoom, lngZoom) - 1;
      
      _mapController.move(centerPoint, zoom);
    }
  }

  Widget _buildStatusButton(BuildContext context, String status, {Color? color, IconData? icon}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: ElevatedButton.icon(
        onPressed: () async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('auth_token');

          if (token == null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Missing token. Please login again.')),
            );
            return;
          }

          try {
            // Show loading
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => const Center(child: CircularProgressIndicator()),
            );

            final response = await http.put(
              Uri.parse('http://10.0.2.2:3008/api/delivery/update-status'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer $token',
              },
              body: jsonEncode({
                'orderId': widget.order['orderId'],
                'status': status,
              }),
            );

            Navigator.of(context).pop(); // remove loader

            if (response.statusCode == 200) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('✅ Status updated to "$status"')),
              );
            } else {
              final message = jsonDecode(response.body)['message'] ?? 'Failed to update';
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('❌ $message')),
              );
            }
          } catch (e) {
            Navigator.of(context).pop(); // remove loader
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('❌ Error: $e')),
            );
          }
        },
        icon: Icon(icon ?? Icons.check_circle_outline),
        label: Text(status),
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? Colors.blue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
  
  // Helper methods
  double min(double a, double b) => a < b ? a : b;
  double max(double a, double b) => a > b ? a : b;
  double log(double x) {
    // Simple logarithm approximation for basic use
    double result = 0;
    double term = (x - 1) / (x + 1);
    double term_squared = term * term;
    double power = term;
    for (int i = 1; i <= 10; i += 2) {
      result += power / i;
      power *= term_squared;
    }
    return 2 * result;
  }
  
  static const double pi = 3.141592653589793;
}