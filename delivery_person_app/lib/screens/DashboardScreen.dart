// main_screen.dart
import 'package:delivery_person_app/models/dummydata.dart';

import 'package:delivery_person_app/screens/tabs/HomeTab.dart';
import 'package:delivery_person_app/screens/tabs/delivery_history_tab.dart';
import 'package:delivery_person_app/screens/tabs/earnings_tab.dart';
import 'package:delivery_person_app/screens/tabs/profile_tab.dart';
import 'package:delivery_person_app/services/DeliveryNotificationService.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';


class DashBoard extends StatefulWidget {
  const DashBoard({Key? key}) : super(key: key);

  @override
  State<DashBoard> createState() => _DashBoardState();
}

class _DashBoardState extends State<DashBoard> {
  int _selectedIndex = 0;
  bool _isOnline = false;
   String? _driverId = "68106003af1069246854ef05";

  @override
void initState() {
  super.initState();
  _loadDriverId();
  DeliveryNotificationService().initialize(context);
}
Future<void> _loadDriverId() async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString('user_id');
    setState(() {
      _driverId = id;
    });
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: _getBody(),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  // Get appropriate widgets for each selected tab
 Widget _getBody() {
  switch (_selectedIndex) {
    case 0:
      return HomeTab(
        activeDeliveries: DummyData.getActiveDeliveries(),
        completedDeliveries: DummyData.getCompletedDeliveries(),
        earningsData: DummyData.getEarningsData(),
      );
    case 1:
      return DeliveryHistoryTab();
    case 2:
      return EarningsTab(
        earningsData: DummyData.getEarningsData(),
        recentPayments: DummyData.getRecentPayments(),
      );
    case 3:
      return ProfileTab();
    default:
      return HomeTab(
        activeDeliveries: DummyData.getActiveDeliveries(),
        completedDeliveries: DummyData.getCompletedDeliveries(),
        earningsData: DummyData.getEarningsData(),
      );
  }
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
}