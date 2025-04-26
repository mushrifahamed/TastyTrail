// lib/screens/restaurant/restaurant_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/restaurant.dart';
import '../../providers/cart_provider.dart';
import '../../providers/restaurant_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/dialog_utils.dart';
import '../../widgets/menu_item_card.dart';
import '../cart/cart_screen.dart';

class RestaurantDetailScreen extends StatefulWidget {
  final String restaurantId;

  const RestaurantDetailScreen({Key? key, required this.restaurantId})
    : super(key: key);

  @override
  State<RestaurantDetailScreen> createState() => _RestaurantDetailScreenState();
}

class _RestaurantDetailScreenState extends State<RestaurantDetailScreen> {
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadRestaurantData();
  }

  Future<void> _loadRestaurantData() async {
    try {
      await Provider.of<RestaurantProvider>(
        context,
        listen: false,
      ).fetchRestaurantById(widget.restaurantId);
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load restaurant details: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<RestaurantProvider>(
        builder: (context, restaurantProvider, child) {
          if (_isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (_errorMessage != null) {
            return Center(child: Text(_errorMessage!));
          }

          final restaurant = restaurantProvider.selectedRestaurant;
          if (restaurant == null) {
            return const Center(child: Text('Restaurant not found'));
          }

          return CustomScrollView(
            key: PageStorageKey('restaurantDetail_${restaurant.id}'),
            slivers: [
              _buildAppBar(context, restaurant),
              _buildRestaurantInfo(context, restaurant),
              _buildMenuList(context, restaurant),
            ],
          );
        },
      ),
      floatingActionButton: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          if (cartProvider.itemCount > 0) {
            return FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CartScreen()),
                );
              },
              backgroundColor: AppColors.primary,
              label: Text('${cartProvider.itemCount} items'),
              icon: const Icon(Icons.shopping_cart),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, Restaurant restaurant) {
    return SliverAppBar(
      expandedHeight: 200.0,
      pinned: true,
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
        background:
            restaurant.coverImage.isNotEmpty
                ? Image.network(
                  restaurant.coverImage,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[300],
                      child: const Center(
                        child: Icon(
                          Icons.restaurant,
                          size: 80,
                          color: Colors.grey,
                        ),
                      ),
                    );
                  },
                )
                : Container(
                  color: Colors.grey[300],
                  child: const Center(
                    child: Icon(Icons.restaurant, size: 80, color: Colors.grey),
                  ),
                ),
      ),
    );
  }

  Widget _buildRestaurantInfo(BuildContext context, Restaurant restaurant) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    restaurant.description,
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: restaurant.availability ? Colors.green : Colors.red,
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
                'Hours: ${restaurant.operatingHours!.from} - ${restaurant.operatingHours!.to}',
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
    );
  }

  Widget _buildMenuList(BuildContext context, Restaurant restaurant) {
    if (restaurant.menu.isEmpty) {
      return const SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('No menu items available'),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.all(16.0),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate((context, index) {
          final menuItem = restaurant.menu[index];
          return MenuItemCard(
            key: ValueKey('menuItem_${menuItem.id}'),
            menuItem: menuItem,
            restaurantId: restaurant.id,
            onAddToCart: () => _addToCart(context, menuItem, restaurant.id),
          );
        }, childCount: restaurant.menu.length),
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

    if (!mounted) return;

    if (result['success']) {
      DialogUtils.showSnackBar(
        context,
        '${menuItem.name} added to cart',
        isError: false,
      );
    } else {
      if (result['message'].toString().contains('multiple restaurants')) {
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
                      if (!mounted) return;

                      final newResult = await cartProvider.addToCart(
                        menuItem,
                        restaurantId,
                        1,
                      );

                      if (newResult['success']) {
                        DialogUtils.showSnackBar(
                          context,
                          '${menuItem.name} added to cart',
                          isError: false,
                        );
                      } else {
                        DialogUtils.showSnackBar(
                          context,
                          newResult['message'] ?? 'Failed to add item to cart',
                          isError: true,
                        );
                      }
                    },
                    child: const Text('Continue'),
                  ),
                ],
              ),
        );
      } else {
        DialogUtils.showSnackBar(
          context,
          result['message'] ?? 'Failed to add item to cart',
          isError: true,
        );
      }
    }
  }
}
