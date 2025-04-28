import 'package:flutter/material.dart';
import 'package:delivery_person_app/models/deliveryModel.dart';

class DeliveryHistoryTab extends StatelessWidget {
  final List<Delivery> completedDeliveries;

  const DeliveryHistoryTab({
    Key? key,
    required this.completedDeliveries,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSearchAndFilter(),
          const SizedBox(height: 16),
          _buildDeliveryList(),
        ],
      ),
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

  Widget _buildDeliveryList() {
    if (completedDeliveries.isEmpty) {
      return _buildEmptyState('No Delivery History', 'Your completed orders will appear here.', Icons.history_outlined);
    }

    return Column(
      children: completedDeliveries.map((delivery) => _buildDeliveryCard(delivery)).toList(),
    );
  }

  Widget _buildDeliveryCard(Delivery delivery) {
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
                Text(delivery.restaurant ?? ''),
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
