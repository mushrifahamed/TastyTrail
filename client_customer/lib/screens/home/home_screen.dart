import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int selectedCategory = 0;

  final List<Map<String, dynamic>> categories = [
    {'icon': '🍔', 'label': 'Burger'},
    {'icon': '🌮', 'label': 'Taco'},
    {'icon': '🥤', 'label': 'Drink'},
    {'icon': '🍕', 'label': 'Pizza'},
  ];

  final List<Map<String, dynamic>> restaurants = [
    {
      'image':
          'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80',
      'name': 'Ordinary Burgers',
      'rating': 4.9,
      'distance': 190,
      'price': 17230,
      'favorite': false,
    },
    {
      'image':
          'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=400&q=80',
      'name': 'Burger With Meat',
      'rating': 4.9,
      'distance': 190,
      'price': 17230,
      'favorite': false,
    },
    {
      'image':
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
      'name': 'Grilled Burger',
      'rating': 4.8,
      'distance': 200,
      'price': 17230,
      'favorite': false,
    },
    {
      'image':
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
      'name': 'Double Cheese',
      'rating': 4.7,
      'distance': 210,
      'price': 17230,
      'favorite': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Top background image
          SizedBox(
            height: 320,
            width: double.infinity,
            child: Image.asset('assets/home_bg.png', fit: BoxFit.cover),
          ),
          // Main content
          Column(
            children: [
              const SizedBox(height: 48),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              "Your Location",
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const Icon(
                              Icons.keyboard_arrow_down,
                              color: Colors.white,
                              size: 18,
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on,
                              color: Colors.white,
                              size: 18,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              "New York City",
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const Spacer(),
                    CircleAvatar(
                      backgroundColor: Colors.white.withOpacity(0.2),
                      child: IconButton(
                        icon: const Icon(Icons.search, color: Colors.white),
                        onPressed: () {},
                      ),
                    ),
                    const SizedBox(width: 12),
                    CircleAvatar(
                      backgroundColor: Colors.white.withOpacity(0.2),
                      child: IconButton(
                        icon: const Icon(
                          Icons.notifications_none,
                          color: Colors.white,
                        ),
                        onPressed: () {},
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    "Provide the best\nfood for you",
                    style: theme.textTheme.displayLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 32,
                      height: 1.1,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(32),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20.0,
                      vertical: 8,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Find by Category",
                              style: theme.textTheme.titleLarge?.copyWith(
                                color: Colors.black,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              "See All",
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 60,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: categories.length,
                            separatorBuilder:
                                (_, __) => const SizedBox(width: 16),
                            itemBuilder: (context, index) {
                              final cat = categories[index];
                              final selected = selectedCategory == index;
                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    selectedCategory = index;
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 18,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color:
                                        selected
                                            ? AppColors.primary
                                            : Colors.grey.shade100,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    children: [
                                      Text(
                                        cat['icon'],
                                        style: TextStyle(
                                          fontSize: 22,
                                          color:
                                              selected
                                                  ? Colors.white
                                                  : Colors.grey,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        cat['label'],
                                        style: theme.textTheme.bodyMedium
                                            ?.copyWith(
                                              color:
                                                  selected
                                                      ? Colors.white
                                                      : Colors.grey,
                                              fontWeight: FontWeight.w600,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                        Expanded(
                          child: GridView.builder(
                            padding: EdgeInsets.zero,
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  mainAxisSpacing: 18,
                                  crossAxisSpacing: 18,
                                  childAspectRatio: 0.82,
                                ),
                            itemCount: restaurants.length,
                            itemBuilder: (context, index) {
                              final r = restaurants[index];
                              return _restaurantCard(
                                context: context,
                                image: r['image'],
                                name: r['name'],
                                rating: r['rating'],
                                distance: r['distance'],
                                price: r['price'],
                                favorite: r['favorite'],
                                onFavorite: () {
                                  setState(() {
                                    restaurants[index]['favorite'] =
                                        !restaurants[index]['favorite'];
                                  });
                                },
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: _bottomNavBar(),
    );
  }

  Widget _restaurantCard({
    required BuildContext context,
    required String image,
    required String name,
    required double rating,
    required int distance,
    required int price,
    required bool favorite,
    required VoidCallback onFavorite,
  }) {
    final primary = AppColors.primary;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(18),
                ),
                child: Image.network(
                  image,
                  height: 100,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                child: Text(
                  name,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: Colors.black,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  children: [
                    Icon(Icons.star, color: primary, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      rating.toString(),
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: primary,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.location_on, color: Colors.grey, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      "${distance}m",
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                child: Text(
                  "\$ ${price.toString()}",
                  style: TextStyle(
                    color: primary,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            top: 8,
            right: 8,
            child: InkWell(
              onTap: onFavorite,
              child: CircleAvatar(
                backgroundColor: Colors.white,
                radius: 18,
                child: Icon(
                  favorite ? Icons.favorite : Icons.favorite_border,
                  color: favorite ? primary : Colors.grey,
                  size: 22,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bottomNavBar() {
    final primary = AppColors.primary;
    return BottomNavigationBar(
      currentIndex: 0,
      onTap: (index) {},
      type: BottomNavigationBarType.fixed,
      selectedItemColor: primary,
      unselectedItemColor: Colors.grey,
      showUnselectedLabels: true,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(
          icon: Icon(Icons.shopping_bag_outlined),
          label: 'Orders',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.chat_bubble_outline),
          label: 'Chat',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          label: 'Profile',
        ),
      ],
    );
  }
}
