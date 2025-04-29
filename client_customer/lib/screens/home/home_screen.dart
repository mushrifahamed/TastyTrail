// lib/screens/home/home_screen.dart
import 'package:client_customer/screens/order/order_tracking_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../../models/restaurant.dart';
import '../../providers/restaurant_provider.dart';
import '../../theme/app_theme.dart';
import '../cart/cart_screen.dart';
import '../auth/profile_screen.dart';
import '../location_picker_screen.dart';

mixin ImageBuilderMixin {
  // Updated base URL to include the restaurant service
  final String _baseImageUrl = 'http://10.0.2.2:3001/';

  Widget _buildImage(String? imagePath,
      {double? width, double? height, BoxFit fit = BoxFit.cover}) {
    if (imagePath == null || imagePath.isEmpty) {
      return _buildPlaceholder(width: width, height: height);
    }

    // Handle absolute URLs (like Unsplash)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return _networkImage(imagePath, width: width, height: height, fit: fit);
    }

    // Handle local backend images
    return _serverImage(imagePath, width: width, height: height, fit: fit);
  }

  Widget _serverImage(String path,
      {double? width, double? height, BoxFit? fit}) {
    // Clean up the path to ensure proper URL construction
    String cleanPath = path.startsWith('/') ? path.substring(1) : path;
    final fullUrl = _baseImageUrl + cleanPath;

    print('Loading image from: $fullUrl'); // Debug log
    return _networkImage(fullUrl, width: width, height: height, fit: fit);
  }

  Widget _networkImage(String url,
      {double? width, double? height, BoxFit? fit}) {
    return Image.network(
      url,
      width: width,
      height: height,
      fit: fit,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return _buildLoadingPlaceholder(width: width, height: height);
      },
      errorBuilder: (context, error, stackTrace) {
        print('Image load error: $error');
        return _buildPlaceholder(width: width, height: height);
      },
    );
  }

  Widget _buildPlaceholder({double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[200],
      child: const Icon(Icons.restaurant, size: 40, color: Colors.grey),
    );
  }

  Widget _buildLoadingPlaceholder({double? width, double? height}) {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[200],
      child: Center(
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with ImageBuilderMixin {
  int _selectedIndex = 0;
  LatLng? _selectedLocation;
  bool _isGettingLocation = false;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
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
      setState(() {
        _selectedLocation = LatLng(position.latitude, position.longitude);
      });

      // Load restaurants based on current location
      await Provider.of<RestaurantProvider>(
        context,
        listen: false,
      ).fetchNearbyRestaurants(
        latitude: position.latitude,
        longitude: position.longitude,
        radius: 5,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error getting location: ${e.toString()}')),
      );
      // Load with default location if there's an error
      await _loadRestaurantsWithDefaultLocation();
    } finally {
      setState(() {
        _isGettingLocation = false;
      });
    }
  }

  Future<void> _loadRestaurantsWithDefaultLocation() async {
    await Provider.of<RestaurantProvider>(
      context,
      listen: false,
    ).fetchNearbyRestaurants(latitude: 6.9271, longitude: 79.8612, radius: 5);
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
      setState(() {
        _selectedLocation = result;
      });

      // Load restaurants based on selected location
      await Provider.of<RestaurantProvider>(
        context,
        listen: false,
      ).fetchNearbyRestaurants(
        latitude: result.latitude,
        longitude: result.longitude,
        radius: 5,
      );
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _getSelectedScreen(),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart),
            label: 'Cart',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.delivery_dining),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: Colors.grey, // Set unselected items to white
        backgroundColor: Colors.white, // Optional: set navbar background
        type:
            BottomNavigationBarType.fixed, // Recommended for more than 3 items
        showSelectedLabels: true,
        showUnselectedLabels: true,
        onTap: _onItemTapped,
      ),
    );
  }

  Widget _getSelectedScreen() {
    switch (_selectedIndex) {
      case 0:
        return _buildHomeContent();
      case 1:
        return const CartScreen();
      case 2:
        return const OrderTrackingScreen();
      case 3:
        return const ProfileScreen();
      default:
        return _buildHomeContent();
    }
  }

  Widget _buildHomeContent() {
    return Column(
      children: [
        // Header with gradient background
        Container(
          padding: EdgeInsets.fromLTRB(16.w, 50.h, 16.w, 20.h),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AppColors.primary, AppColors.primary.withOpacity(0.8)],
            ),
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(24.r),
              bottomRight: Radius.circular(24.r),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      "Flavor Town, Gastronomia",
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.search, color: Colors.white),
                    onPressed: () {},
                  ),
                ],
              ),
              SizedBox(height: 10.h),
              Text(
                "Discover the best restaurants near you!",
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w400,
                    ),
              ),
              SizedBox(height: 16.h),
              // Add location buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed:
                          _isGettingLocation ? null : _getCurrentLocation,
                      icon: const Icon(Icons.my_location),
                      label: _isGettingLocation
                          ? SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor:
                                    AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text('Current Location'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        padding: EdgeInsets.symmetric(vertical: 10.h),
                      ),
                    ),
                  ),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _openLocationPicker,
                      icon: const Icon(Icons.map),
                      label: const Text('Select on Map'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppColors.primary,
                        padding: EdgeInsets.symmetric(vertical: 10.h),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        // Body
        Expanded(
          child: Consumer<RestaurantProvider>(
            builder: (context, restaurantProvider, _) {
              if (restaurantProvider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              if (restaurantProvider.errorMessage != null) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Error: ${restaurantProvider.errorMessage}'),
                      SizedBox(height: 16.h),
                      ElevatedButton(
                        onPressed: _getCurrentLocation,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                );
              }

              final restaurants = restaurantProvider.restaurants;
              if (restaurants.isEmpty) {
                return const Center(child: Text('No restaurants found'));
              }

              // Sort restaurants by distance
              restaurants.sort(
                (a, b) => (a.distance ?? 0).compareTo(b.distance ?? 0),
              );

              return RefreshIndicator(
                onRefresh: _getCurrentLocation,
                child: ListView.builder(
                  padding: EdgeInsets.symmetric(
                    horizontal: 16.w,
                    vertical: 16.h,
                  ),
                  itemCount: restaurants.length,
                  itemBuilder: (context, index) {
                    final restaurant = restaurants[index];
                    return _RestaurantCard(
                      restaurant: restaurant,
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          '/restaurant',
                          arguments: restaurant.id,
                        );
                      },
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _RestaurantCard extends StatelessWidget with ImageBuilderMixin {
  final Restaurant restaurant;
  final VoidCallback onTap;

  _RestaurantCard({required this.restaurant, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.only(bottom: 28.h),
        child: Column(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(28.r),
                topRight: Radius.circular(28.r),
              ),
              child: _buildImage(
                restaurant.coverImage,
                width: double.infinity,
                height: 170.h,
                fit: BoxFit.cover,
              ),
            ),
            // Details tile, full width, curved bottom
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(28.r),
                  bottomRight: Radius.circular(28.r),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              padding: EdgeInsets.fromLTRB(24.w, 16.h, 24.w, 16.h),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    restaurant.name,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  SizedBox(height: 6.h),
                  Text(
                    restaurant.description,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.grey[700]),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 10.h),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        color: AppColors.primary,
                        size: 18.sp,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        restaurant.distance != null
                            ? "${restaurant.distance!.toStringAsFixed(2)} km"
                            : "N/A",
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(width: 16.w),
                      Icon(
                        Icons.access_time,
                        color: AppColors.primary,
                        size: 18.sp,
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        restaurant.operatingHours != null
                            ? "${restaurant.operatingHours!.from ?? '??'} - ${restaurant.operatingHours!.to ?? '??'}"
                            : "Hours N/A",
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
