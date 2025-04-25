// lib/screens/restaurant/restaurant_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/restaurant.dart';
import '../../providers/cart_provider.dart';
import '../../theme/app_theme.dart';

class RestaurantDetailScreen extends StatelessWidget {
  final Restaurant restaurant;

  const RestaurantDetailScreen({super.key, required this.restaurant});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                restaurant.name,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  shadows: [
                    Shadow(
                      blurRadius: 4.0,
                      color: Colors.black54,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    restaurant.coverImage,
                    fit: BoxFit.cover,
                    errorBuilder:
                        (_, __, ___) => Container(
                          color: Colors.grey[200],
                          child: const Icon(Icons.restaurant, size: 60),
                        ),
                  ),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [Colors.black54, Colors.transparent],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            pinned: true,
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          restaurant.description,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color:
                              restaurant.availability
                                  ? Colors.green
                                  : Colors.red,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          restaurant.availability ? 'Open' : 'Closed',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (restaurant.operatingHours != null)
                    Text(
                      'Hours: ${restaurant.operatingHours!.from ?? 'N/A'} - ${restaurant.operatingHours!.to ?? 'N/A'}',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                  if (restaurant.distance != null)
                    Text(
                      'Distance: ${restaurant.distance!.toStringAsFixed(1)} km',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                  const Divider(height: 32),
                  const Text(
                    'Menu',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate((context, index) {
              final menuItem = restaurant.menu[index];
              return _buildMenuItem(context, menuItem, restaurant.id);
            }, childCount: restaurant.menu.length),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context,
    MenuItem menuItem,
    String restaurantId,
  ) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Item image
            if (menuItem.image.isNotEmpty)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  menuItem.image,
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                  errorBuilder:
                      (_, __, ___) => Container(
                        width: 80,
                        height: 80,
                        color: Colors.grey[200],
                        child: const Icon(Icons.restaurant_menu),
                      ),
                ),
              ),
            const SizedBox(width: 16),

            // Item details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    menuItem.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    menuItem.description,
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'LKR ${menuItem.price.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                      ElevatedButton(
                        onPressed:
                            () => _addToCart(context, menuItem, restaurantId),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                        ),
                        child: const Text(
                          'Add to Cart',
                          style: TextStyle(color: Colors.white),
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

  Future<void> _addToCart(
    BuildContext context,
    MenuItem menuItem,
    String restaurantId,
  ) async {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);
    final result = await cartProvider.addToCart(
      menuItem,
      restaurantId,
      1, // Default quantity
    );

    if (!context.mounted) return;

    final snackBar = SnackBar(
      content: Text(
        result['success']
            ? '${menuItem.name} added to cart'
            : result['message'] ?? 'Failed to add item to cart',
      ),
      backgroundColor: result['success'] ? Colors.green : Colors.red,
      duration: const Duration(seconds: 2),
    );

    ScaffoldMessenger.of(context).showSnackBar(snackBar);

    if (!result['success'] &&
        result['message'].toString().contains('multiple restaurants')) {
      // Show warning about multiple restaurants
      showDialog(
        context: context,
        builder:
            (context) => AlertDialog(
              title: const Text('Items from Different Restaurant'),
              content: const Text(
                'Your cart contains items from another restaurant. Adding this item will clear your current cart. Do you want to continue?',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                TextButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    await cartProvider.clearCart();
                    if (!context.mounted) return;

                    final newResult = await cartProvider.addToCart(
                      menuItem,
                      restaurantId,
                      1,
                    );

                    final newSnackBar = SnackBar(
                      content: Text(
                        newResult['success']
                            ? '${menuItem.name} added to cart'
                            : newResult['message'] ??
                                'Failed to add item to cart',
                      ),
                      backgroundColor:
                          newResult['success'] ? Colors.green : Colors.red,
                    );

                    ScaffoldMessenger.of(context).showSnackBar(newSnackBar);
                  },
                  child: const Text('Continue'),
                ),
              ],
            ),
      );
    }
  }
}
