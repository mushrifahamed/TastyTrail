import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import '../../models/user.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    // Route protection: Only allow logged-in customers
    if (user == null || authProvider.token == null || user.role != 'customer') {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      });
      return const SizedBox.shrink();
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Food Delivery'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final navigator = Navigator.of(context);
              final authService = AuthService();
              await authService.clearAuthData();
              authProvider.logout();
              if (!mounted) return;
              navigator.pushAndRemoveUntil(
                MaterialPageRoute(builder: (context) => const LoginScreen()),
                (route) => false,
              );
            },
          ),
        ],
      ),
      body: _buildBody(context, user),
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  Widget _buildBody(BuildContext context, User user) {
    switch (_currentIndex) {
      case 0:
        return _buildHomeContent(user);
      case 1:
        return _buildProfileContent(user);
      default:
        return _buildHomeContent(user);
    }
  }

  Widget _buildHomeContent(User user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome, ${user.name}!',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          const Text('Your role:', style: TextStyle(fontSize: 18)),
          Chip(
            label: Text(
              user.role.toUpperCase(),
              style: const TextStyle(color: Colors.white),
            ),
            backgroundColor: _getRoleColor(user.role),
          ),
          const SizedBox(height: 24),
          const Text(
            'Featured Restaurants',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildRestaurantList(),
        ],
      ),
    );
  }

  Widget _buildProfileContent(User user) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your Profile',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Name'),
            subtitle: Text(user.name),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.email),
            title: const Text('Email'),
            subtitle: Text(user.email),
          ),
          const Divider(),
          if (user.phone != null)
            ListTile(
              leading: const Icon(Icons.phone),
              title: const Text('Phone'),
              subtitle: Text(user.phone!),
            ),
          if (user.phone != null) const Divider(),
          if (user.address != null)
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Address'),
              subtitle: Text(user.address!),
            ),
          if (user.address != null) const Divider(),
        ],
      ),
    );
  }

  Widget _buildRestaurantList() {
    final dummyRestaurants = [
      {'name': 'Burger Palace', 'cuisine': 'American', 'rating': 4.5},
      {'name': 'Pizza Heaven', 'cuisine': 'Italian', 'rating': 4.2},
      {'name': 'Sushi World', 'cuisine': 'Japanese', 'rating': 4.7},
      {'name': 'Taco Fiesta', 'cuisine': 'Mexican', 'rating': 4.3},
      {'name': 'Curry House', 'cuisine': 'Indian', 'rating': 4.6},
    ];

    return Column(
      children:
          dummyRestaurants.map((restaurant) {
            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              child: ListTile(
                contentPadding: const EdgeInsets.all(16),
                leading: const Icon(Icons.restaurant, size: 40),
                title: Text(
                  restaurant['name'] as String,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text(restaurant['cuisine'] as String),
                trailing: Chip(
                  label: Text(restaurant['rating'].toString()),
                  backgroundColor: Colors.amber[100],
                ),
                onTap: () {
                  // Would navigate to restaurant details
                },
              ),
            );
          }).toList(),
    );
  }

  BottomNavigationBar _buildBottomNavBar() {
    return BottomNavigationBar(
      currentIndex: _currentIndex,
      onTap: (index) {
        setState(() {
          _currentIndex = index;
        });
      },
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
      ],
    );
  }

  Color _getRoleColor(String role) {
    switch (role) {
      case 'admin':
        return Colors.red;
      case 'restaurant_admin':
        return Colors.orange;
      case 'delivery_personnel':
        return Colors.blue;
      case 'customer':
      default:
        return Colors.green;
    }
  }
}
