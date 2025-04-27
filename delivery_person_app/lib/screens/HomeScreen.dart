import 'package:flutter/material.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  bool _isOnline = false;

  // Sample data for active deliveries
  final List<Map<String, dynamic>> _activeDeliveries = [
    {
      'orderId': '#ORD1234',
      'customerName': 'John Smith',
      'restaurant': 'Burger King',
      'address': '123 Main St, New York',
      'time': '12:30 PM',
      'price': '\$15.99',
      'status': 'Pickup',
      'distance': '2.5 km',
    },
    {
      'orderId': '#ORD5678',
      'customerName': 'Emily Johnson',
      'restaurant': 'Pizza Hut',
      'address': '456 Park Ave, New York',
      'time': '1:45 PM',
      'price': '\$24.50',
      'status': 'On the way',
      'distance': '3.8 km',
    },
  ];

  // Sample data for earnings
  final Map<String, dynamic> _earningsData = {
    'today': 78.50,
    'week': 342.75,
    'month': 1250.00,
    'pendingPayment': 78.50,
  };

  // Sample data for completed deliveries
  final List<Map<String, dynamic>> _completedDeliveries = [
    {
      'orderId': '#ORD1122',
      'customerName': 'Michael Brown',
      'restaurant': 'Subway',
      'time': '11:20 AM',
      'price': '\$12.30',
      'date': 'Today',
    },
    {
      'orderId': '#ORD9876',
      'customerName': 'Sarah Wilson',
      'restaurant': 'KFC',
      'time': '10:05 AM',
      'price': '\$18.75',
      'date': 'Today',
    },
    {
      'orderId': '#ORD5432',
      'customerName': 'David Lee',
      'restaurant': 'Taco Bell',
      'time': '7:30 PM',
      'price': '\$22.40',
      'date': 'Yesterday',
    },
  ];

  // Get appropriate widgets for each selected tab
  Widget _getBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildHomeTab();
      case 1:
        return _buildDeliveryHistoryTab();
      case 2:
        return _buildEarningsTab();
      case 3:
        return _buildProfileTab();
      default:
        return _buildHomeTab();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: _getBody(),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      elevation: 0,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Good day, Driver!',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Colors.black54,
            ),
          ),
          Text(
            _isOnline ? 'You are online' : 'You are offline',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: _isOnline ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
      actions: [
        Switch(
          value: _isOnline,
          activeColor: Colors.green,
          onChanged: (value) {
            setState(() {
              _isOnline = value;
            });
          },
        ),
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          onPressed: () {
            // Navigate to notifications screen
          },
          color: Colors.deepPurple,
        ),
      ],
    );
  }

  Widget _buildBottomNavigationBar() {
    return BottomNavigationBar(
      type: BottomNavigationBarType.fixed,
      currentIndex: _selectedIndex,
      onTap: (index) {
        setState(() {
          _selectedIndex = index;
        });
      },
      selectedItemColor: Colors.deepPurple,
      unselectedItemColor: Colors.grey,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          activeIcon: Icon(Icons.home),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.history_outlined),
          activeIcon: Icon(Icons.history),
          label: 'Orders',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.account_balance_wallet_outlined),
          activeIcon: Icon(Icons.account_balance_wallet),
          label: 'Earnings',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          activeIcon: Icon(Icons.person),
          label: 'Profile',
        ),
      ],
    );
  }

  Widget _buildHomeTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Cards
          _buildSummaryCards(),
          const SizedBox(height: 24),
          
          // Active Orders
          _buildSectionHeader('Active Orders', _activeDeliveries.length.toString()),
          const SizedBox(height: 12),
          _buildActiveDeliveries(),
          const SizedBox(height: 24),
          
          // Recent Completed Orders
          _buildSectionHeader('Recent Completed Orders', 'See All'),
          const SizedBox(height: 12),
          _buildCompletedDeliveries(),
        ],
      ),
    );
  }

  Widget _buildSummaryCards() {
    return Row(
      children: [
        Expanded(
          child: _buildSummaryCard(
            title: 'Today\'s Earnings',
            value: '\$${_earningsData['today']}',
            icon: Icons.monetization_on_outlined,
            color: Colors.green,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildSummaryCard(
            title: 'Total Orders',
            value: (_activeDeliveries.length + _completedDeliveries.length).toString(),
            icon: Icons.receipt_long_outlined,
            color: Colors.deepPurple,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, String actionText) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        TextButton(
          onPressed: () {
            // Navigate to details screen
          },
          child: Text(
            actionText,
            style: TextStyle(
              color: Colors.deepPurple.shade700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveDeliveries() {
    if (_activeDeliveries.isEmpty) {
      return _buildEmptyState(
        'No Active Orders',
        'You don\'t have any active deliveries at the moment.',
        Icons.delivery_dining_outlined,
      );
    }

    return Column(
      children: _activeDeliveries.map((order) => _buildActiveOrderCard(order)).toList(),
    );
  }

  Widget _buildActiveOrderCard(Map<String, dynamic> order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          // Order header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.deepPurple.shade50,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      order['orderId'],
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: order['status'] == 'Pickup' ? Colors.blue.shade100 : Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        order['status'],
                        style: TextStyle(
                          fontSize: 12,
                          color: order['status'] == 'Pickup' ? Colors.blue.shade800 : Colors.orange.shade800,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  order['price'],
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
          // Order details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildOrderInfoRow('Restaurant', order['restaurant'], Icons.restaurant_outlined),
                const SizedBox(height: 8),
                _buildOrderInfoRow('Customer', order['customerName'], Icons.person_outline),
                const SizedBox(height: 8),
                _buildOrderInfoRow('Address', order['address'], Icons.location_on_outlined),
                const SizedBox(height: 8),
                _buildOrderInfoRow('Time', order['time'], Icons.access_time),
                const SizedBox(height: 8),
                _buildOrderInfoRow('Distance', order['distance'], Icons.directions_bike_outlined),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          // Navigation logic
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.deepPurple,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Navigate'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          // Call customer
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.deepPurple,
                          side: BorderSide(color: Colors.deepPurple.shade300),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Call Customer'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderInfoRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade600,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildCompletedDeliveries() {
    if (_completedDeliveries.isEmpty) {
      return _buildEmptyState(
        'No Completed Orders',
        'Your completed orders will appear here.',
        Icons.check_circle_outline,
      );
    }

    return Column(
      children: _completedDeliveries.map((order) => _buildCompletedOrderCard(order)).toList(),
    );
  }

  Widget _buildCompletedOrderCard(Map<String, dynamic> order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.deepPurple.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.check_circle_outline,
              color: Colors.deepPurple,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          // Order details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order['orderId'],
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      order['price'],
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  order['restaurant'],
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  order['customerName'],
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 14,
                      color: Colors.grey.shade600,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      order['date'],
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.access_time,
                      size: 14,
                      color: Colors.grey.shade600,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      order['time'],
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 80,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  // DELIVERY HISTORY TAB
  Widget _buildDeliveryHistoryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildDeliveryHistoryFilter(),
          const SizedBox(height: 16),
          _buildDeliveryHistoryList(),
        ],
      ),
    );
  }

  Widget _buildDeliveryHistoryFilter() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Search orders...',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: Colors.grey.shade100,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              // Show filter options
            },
          ),
        ),
      ],
    );
  }

  Widget _buildDeliveryHistoryList() {
    // We'll use the same completed deliveries list but add a few more for history
    final List<Map<String, dynamic>> historyDeliveries = [
      ..._completedDeliveries,
      {
        'orderId': '#ORD4321',
        'customerName': 'Jennifer White',
        'restaurant': 'McDonald\'s',
        'time': '2:15 PM',
        'price': '\$14.85',
        'date': '24 Apr 2025',
      },
      {
        'orderId': '#ORD9870',
        'customerName': 'Robert Thomas',
        'restaurant': 'Starbucks',
        'time': '9:30 AM',
        'price': '\$9.50',
        'date': '23 Apr 2025',
      },
      {
        'orderId': '#ORD5544',
        'customerName': 'Patricia Moore',
        'restaurant': 'Chipotle',
        'time': '1:40 PM',
        'price': '\$22.75',
        'date': '22 Apr 2025',
      },
    ];

    if (historyDeliveries.isEmpty) {
      return _buildEmptyState(
        'No Delivery History',
        'Your delivery history will appear here.',
        Icons.history_outlined,
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Orders',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Column(
          children: historyDeliveries.map((order) => _buildCompletedOrderCard(order)).toList(),
        ),
      ],
    );
  }

  // EARNINGS TAB
  Widget _buildEarningsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildEarningsSummary(),
          const SizedBox(height: 24),
          _buildEarningsTimeFilter(),
          const SizedBox(height: 16),
          _buildEarningsChart(),
          const SizedBox(height: 24),
          _buildRecentPayments(),
        ],
      ),
    );
  }

  Widget _buildEarningsSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.deepPurple.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Earnings',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.deepPurple.shade100,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text(
                  'April 2025',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.deepPurple,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '\$${_earningsData['month']}',
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.deepPurple,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildEarningsInfoBox(
                  'Today',
                  '\$${_earningsData['today']}',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildEarningsInfoBox(
                  'This Week',
                  '\$${_earningsData['week']}',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildEarningsInfoBox(
                  'Pending',
                  '\$${_earningsData['pendingPayment']}',
                  isHighlighted: true,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsInfoBox(String label, String value, {bool isHighlighted = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: isHighlighted ? Colors.deepPurple.shade100 : Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isHighlighted ? Colors.deepPurple.shade800 : Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isHighlighted ? Colors.deepPurple.shade800 : Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsTimeFilter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildTimeFilterButton('Day', isSelected: true),
        _buildTimeFilterButton('Week'),
        _buildTimeFilterButton('Month'),
        _buildTimeFilterButton('Year'),
      ],
    );
  }

  Widget _buildTimeFilterButton(String label, {bool isSelected = false}) {
    return InkWell(
      onTap: () {
        // Change the selected time filter
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.deepPurple : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? Colors.deepPurple : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.white : Colors.grey.shade700,
          ),
        ),
      ),
    );
  }

  Widget _buildEarningsChart() {
    // This is a placeholder for the earnings chart
    // In a real app, you'd use a chart library like fl_chart or charts_flutter
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Text(
          'Earnings Chart',
          style: TextStyle(
            color: Colors.grey.shade600,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildRecentPayments() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Payments',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        _buildPaymentCard(
          date: '25 Apr 2025',
          amount: 78.50,
          paymentMethod: 'Direct Deposit',
          status: 'Completed',
        ),
        _buildPaymentCard(
          date: '18 Apr 2025',
          amount: 126.75,
          paymentMethod: 'Direct Deposit',
          status: 'Completed',
        ),
        _buildPaymentCard(
          date: '11 Apr 2025',
          amount: 93.20,
          paymentMethod: 'Direct Deposit',
          status: 'Completed',
        ),
      ],
    );
  }

  Widget _buildPaymentCard({
    required String date,
    required double amount,
    required String paymentMethod,
    required String status,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // Payment icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.payments_outlined,
              color: Colors.green.shade700,
            ),
          ),
          const SizedBox(width: 16),
          // Payment details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  date,
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  paymentMethod,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          // Amount and status
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '\$$amount',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  status,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.green.shade800,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // PROFILE TAB
  Widget _buildProfileTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          _buildProfileHeader(),
          const SizedBox(height: 24),
          _buildProfileStats(),
          const SizedBox(height: 24),
          _buildProfileOptions(),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
  return Column(
    children: [
      const CircleAvatar(
        radius: 50,
        backgroundColor: Colors.deepPurple,
        child: Icon(
          Icons.person,
          size: 50,
          color: Colors.white,
        ),
      ),
      const SizedBox(height: 16),
      const Text(
        'John Driver',
        style: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
        ),
      ),
      const SizedBox(height: 4),
      Text(
        'ID: #DRV1234',
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 16,
        ),
      ),
      const SizedBox(height: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.green.shade100,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.star,
              size: 16,
              color: Colors.amber.shade700,
            ),
            const SizedBox(width: 4),
            Text(
              '4.8',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.green.shade800,
              ),
            ),
            Text(
              ' (256 reviews)',
              style: TextStyle(
                fontSize: 12,
                color: Colors.green.shade800,
              ),
            ),
          ],
        ),
      ),
    ],
  );
}

Widget _buildProfileStats() {
  return Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      boxShadow: [
        BoxShadow(
          color: Colors.grey.withOpacity(0.1),
          spreadRadius: 1,
          blurRadius: 6,
          offset: const Offset(0, 3),
        ),
      ],
    ),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildStatItem('Total Orders', '542'),
        _buildDivider(),
        _buildStatItem('Cancelled', '12'),
        _buildDivider(),
        _buildStatItem('Experience', '8 months'),
      ],
    ),
  );
}

Widget _buildDivider() {
  return Container(
    height: 40,
    width: 1,
    color: Colors.grey.shade300,
  );
}

Widget _buildStatItem(String label, String value) {
  return Column(
    children: [
      Text(
        value,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
      const SizedBox(height: 4),
      Text(
        label,
        style: TextStyle(
          fontSize: 14,
          color: Colors.grey.shade600,
        ),
      ),
    ],
  );
}

Widget _buildProfileOptions() {
  return Column(
    children: [
      _buildProfileOptionItem(
        icon: Icons.account_circle_outlined,
        title: 'Personal Information',
        onTap: () {
          // Navigate to personal information screen
        },
      ),
      _buildProfileOptionItem(
        icon: Icons.directions_bike_outlined,
        title: 'Vehicle Information',
        onTap: () {
          // Navigate to vehicle information screen
        },
      ),
      _buildProfileOptionItem(
        icon: Icons.work_outline,
        title: 'Work Schedule',
        onTap: () {
          // Navigate to work schedule screen
        },
      ),
      _buildProfileOptionItem(
        icon: Icons.chat_outlined,
        title: 'Support',
        onTap: () {
          // Navigate to support screen
        },
      ),
      _buildProfileOptionItem(
        icon: Icons.stars_outlined,
        title: 'My Reviews',
        onTap: () {
          // Navigate to reviews screen
        },
      ),
      _buildProfileOptionItem(
        icon: Icons.notifications_outlined,
        title: 'Notification Settings',
        onTap: () {
          // Navigate to notification settings screen
        },
      ),
      _buildProfileOptionItem(
        icon: Icons.privacy_tip_outlined,
        title: 'Privacy Policy',
        onTap: () {
          // Navigate to privacy policy screen
        },
      ),
      _buildProfileOptionItem(
        icon: Icons.help_outline,
        title: 'Help & FAQ',
        onTap: () {
          // Navigate to help screen
        },
      ),
      const SizedBox(height: 16),
      OutlinedButton.icon(
        onPressed: () {
          // Logout logic
        },
        icon: Icon(
          Icons.logout,
          color: Colors.red.shade700,
        ),
        label: Text(
          'Logout',
          style: TextStyle(
            color: Colors.red.shade700,
            fontWeight: FontWeight.w500,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: Colors.red.shade300),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      const SizedBox(height: 24),
      Text(
        'App Version 1.0.0',
        style: TextStyle(
          color: Colors.grey.shade600,
          fontSize: 12,
        ),
      ),
      const SizedBox(height: 8),
    ],
  );
}

Widget _buildProfileOptionItem({
  required IconData icon,
  required String title,
  required VoidCallback onTap,
}) {
  return InkWell(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.shade200,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: Colors.deepPurple,
            size: 20,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const Icon(
            Icons.arrow_forward_ios,
            color: Colors.grey,
            size: 16,
          ),
        ],
      ),
    ),
  );
}
}
