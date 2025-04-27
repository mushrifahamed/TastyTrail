// lib/screens/home/home_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../models/restaurant.dart';
import '../../providers/restaurant_provider.dart';
import '../../providers/cart_provider.dart';
import '../../theme/app_theme.dart';
import '../restaurant/restaurant_screen.dart';
import '../cart/cart_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadRestaurants();
  }

  Future<void> _loadRestaurants() async {
    // In a real app, you would get the user's location
    await Provider.of<RestaurantProvider>(
      context,
      listen: false,
    ).fetchNearbyRestaurants(latitude: 12.9716, longitude: 77.5946, radius: 5);
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
      body: _selectedIndex == 0 ? _buildHomeContent() : const CartScreen(),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_cart),
            label: 'Cart',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: AppColors.primary,
        onTap: _onItemTapped,
      ),
    );
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
                        onPressed: _loadRestaurants,
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
                onRefresh: _loadRestaurants,
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

class _RestaurantCard extends StatelessWidget {
  final Restaurant restaurant;
  final VoidCallback onTap;

  const _RestaurantCard({required this.restaurant, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: EdgeInsets.only(bottom: 28.h),
        child: Column(
          children: [
            // Cover image, full width, curved top
            ClipRRect(
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(28.r),
                topRight: Radius.circular(28.r),
              ),
              child: Image.network(
                restaurant.coverImage,
                width: double.infinity,
                height: 170.h,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 170.h,
                  color: Colors.grey[200],
                  child: const Icon(Icons.restaurant, size: 40),
                ),
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
