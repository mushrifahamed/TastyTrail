import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/restaurant.dart';
import '../../providers/cart_provider.dart';
import '../../providers/restaurant_provider.dart';

mixin ImageBuilderMixin {
  final String _baseImageUrl = 'http://10.0.2.2:3001/';

  Widget buildImage(String? imagePath,
      {double? width, double? height, BoxFit fit = BoxFit.cover}) {
    if (imagePath == null || imagePath.isEmpty) {
      return _buildPlaceholder(width: width, height: height);
    }

    // Handle absolute URLs (like Unsplash)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return _networkImage(imagePath, width: width, height: height, fit: fit);
    }

    // Handle local backend images - clean up the path
    String cleanPath = imagePath
        .replaceAll(
            '\\', '/') // Replace Windows backslashes with forward slashes
        .replaceAll('/uploads/', ''); // Remove any 'uploads/' prefix if present

    return _serverImage(cleanPath, width: width, height: height, fit: fit);
  }

  Widget _serverImage(String path,
      {double? width, double? height, BoxFit? fit}) {
    final fullUrl = _baseImageUrl + path;
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
      child: const Center(
        child: CircularProgressIndicator(
          strokeWidth: 2,
        ),
      ),
    );
  }
}

class RestaurantDetailScreen extends StatefulWidget {
  final String restaurantId;

  const RestaurantDetailScreen({
    super.key,
    required this.restaurantId,
  });

  @override
  State<RestaurantDetailScreen> createState() => _RestaurantDetailScreenState();
}

class _RestaurantDetailScreenState extends State<RestaurantDetailScreen>
    with ImageBuilderMixin {
  bool _isLoading = true;
  Restaurant? _restaurant;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchRestaurantDetails();
  }

  Future<void> _fetchRestaurantDetails() async {
    print('DEBUG: Fetching restaurant with ID: ${widget.restaurantId}');

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final restaurantProvider =
          Provider.of<RestaurantProvider>(context, listen: false);

      // Make sure this method exists in your RestaurantProvider
      final restaurant =
          await restaurantProvider.getRestaurantById(widget.restaurantId);

      print('DEBUG: Restaurant fetched successfully: ${restaurant.name}');

      setState(() {
        _restaurant = restaurant;
        _isLoading = false;
      });
    } catch (e) {
      print('ERROR: Failed to load restaurant: $e');
      setState(() {
        _error = 'Failed to load restaurant details: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _restaurant == null
                  ? const Center(child: Text('Restaurant not found'))
                  : _buildRestaurantDetails(),
    );
  }

  Widget _buildRestaurantDetails() {
    if (_restaurant == null) return const SizedBox.shrink();

    return CustomScrollView(
      slivers: [
        _buildAppBar(),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _restaurant!.name,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  _restaurant!.description,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                _buildOperatingHours(),
                const Divider(height: 32),
                Text(
                  'Menu',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
        _buildMenuList(),
      ],
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      expandedHeight: 200.0,
      pinned: true,
      flexibleSpace: FlexibleSpaceBar(
        title: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.5),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            _restaurant!.name,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16.0,
            ),
          ),
        ),
        background: buildImage(
          _restaurant!.coverImage,
          width: double.infinity,
          height: double.infinity,
          fit: BoxFit.cover,
        ),
      ),
    );
  }

  Widget _buildOperatingHours() {
    final hours = _restaurant!.operatingHours;
    if (hours == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          children: [
            const Icon(Icons.access_time),
            const SizedBox(width: 8),
            Text(
              '${hours.from ?? 'N/A'} - ${hours.to ?? 'N/A'}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _restaurant!.availability ? Colors.green : Colors.red,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _restaurant!.availability ? 'Open' : 'Closed',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuList() {
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          return _buildMenuItem(_restaurant!.menu[index]);
        },
        childCount: _restaurant!.menu.length,
      ),
    );
  }

  Widget _buildMenuItem(MenuItem menuItem) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Menu item image
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 80,
                height: 80,
                child: buildImage(
                  menuItem.image,
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Menu item details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    menuItem.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    menuItem.description,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 13,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '\$${menuItem.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => _addToCart(menuItem),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          minimumSize: const Size(0, 32),
                        ),
                        child: const Text('Add'),
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

  void _addToCart(MenuItem menuItem) async {
    try {
      final cartProvider = Provider.of<CartProvider>(context, listen: false);
      final result = await cartProvider.addToCart(
        menuItem,
        _restaurant!.id,
        1,
      );

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${menuItem.name} added to cart'),
            action: SnackBarAction(
              label: 'View Cart',
              onPressed: () {
                Navigator.pushNamed(context, '/cart');
              },
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'Failed to add to cart')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add to cart: $e')),
      );
    }
  }
}
