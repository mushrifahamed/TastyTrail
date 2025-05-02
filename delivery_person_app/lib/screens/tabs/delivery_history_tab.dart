
import 'package:delivery_person_app/models/delivery.dart';
import 'package:delivery_person_app/services/order_service.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';


class DeliveryHistoryTab extends StatefulWidget {
  // final String driverId;
  //const DeliveryHistoryTab({Key? key, required this.driverId}) : super(key: key);

  @override
  State<DeliveryHistoryTab> createState() => _DeliveryHistoryTabState();
}

class _DeliveryHistoryTabState extends State<DeliveryHistoryTab> {
  Future<List<DeliveryData>>? _deliveredOrdersFuture;

  @override
  void initState() {
    super.initState();
    _loadDriverIdAndFetchOrders();
  }

  Future<void> _loadDriverIdAndFetchOrders() async {
    final prefs = await SharedPreferences.getInstance();
  final driverId = prefs.getString('user_id');

    if (driverId != null) {
      setState(() {
        _deliveredOrdersFuture = DeliveryService.fetchDeliveredOrders(driverId);
      });
    } else {
      // Handle case when driverId is not found
      setState(() {
        _deliveredOrdersFuture = Future.error('Driver ID not found in storage');
      });
    }
  }


  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<DeliveryData>>(
      future: _deliveredOrdersFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return _buildEmptyState('No Delivery History', 'Your completed orders will appear here.', Icons.history_outlined);
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSearchAndFilter(),
              const SizedBox(height: 16),
              _buildDeliveryList(snapshot.data!),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSearchAndFilter() {
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
            onPressed: () {},
          ),
        ),
      ],
    );
  }

  Widget _buildDeliveryList(List<DeliveryData> completedDeliveries) {
    return Column(
      children: completedDeliveries.map((delivery) => _buildDeliveryCard(delivery)).toList(),
    );
  }

  Widget _buildDeliveryCard(DeliveryData delivery) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.grey.withOpacity(0.1), blurRadius: 6, spreadRadius: 1)],
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: Colors.deepPurple),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(delivery.orderId ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(delivery.restaurant ?? 'Restaurant'),
                const SizedBox(height: 4),
                Text(delivery.customerName ?? '', style: TextStyle(color: Colors.grey.shade600)),
                const SizedBox(height: 4),
                Text('${delivery.date ?? ''} - ${delivery.time ?? ''}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          children: [
            Icon(icon, size: 80, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(subtitle, style: TextStyle(color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }
}
