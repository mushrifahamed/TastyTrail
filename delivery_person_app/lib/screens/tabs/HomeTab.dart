import 'package:delivery_person_app/models/deliveryModel.dart';
import 'package:flutter/material.dart';

class HomeTab extends StatelessWidget {
  final List<Delivery> activeDeliveries;
final List<Delivery> completedDeliveries;
final Map<String, dynamic> earningsData;


  const HomeTab({
    Key? key,
    required this.activeDeliveries,
    required this.completedDeliveries,
    required this.earningsData,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSummaryCards(),
          const SizedBox(height: 24),
          _buildSectionHeader('Active Orders', activeDeliveries.length.toString()),
          const SizedBox(height: 12),
          _buildActiveDeliveries(),

          const SizedBox(height: 24),
         // _buildSectionHeader('Recent Completed Orders', 'See All'),
          const SizedBox(height: 12),
         // _buildCompletedDeliveries(),
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
             value: '\$${earningsData['today']}',
            icon: Icons.monetization_on_outlined,
            color: Colors.green,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildSummaryCard(
            title: 'Total Orders',
            value: (activeDeliveries.length + completedDeliveries.length).toString(),
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
    if (activeDeliveries.isEmpty) {
      return _buildEmptyState('No Active Orders', 'You don\'t have any active deliveries.', Icons.delivery_dining_outlined);
    }
    return Column(
      children: activeDeliveries.map((order) => _buildOrderCard(order, isActive: true)).toList(),

    );
  }

  Widget _buildCompletedDeliveries() {
    if (completedDeliveries.isEmpty) {
      return _buildEmptyState('No Completed Orders', 'Your completed orders will appear here.', Icons.check_circle_outline);
    }
    return Column(
      children: completedDeliveries.map((order) => _buildCompletedOrderCard(order)).toList(),

    );
  }
  Widget _buildCompletedOrderCard(Delivery order) {
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
                    order.orderId ?? '',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    order.price ?? '',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                order.restaurant ?? '',
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                order.customerName ?? '',
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
                    order.date ?? '',
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
                    order.time ?? '',
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


 Widget _buildOrderCard(Delivery order, {bool isActive = false}) {
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
                    order.orderId ?? '',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (order.status != null) 
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: order.status == 'Pickup' ? Colors.blue.shade100 : Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        order.status ?? '',
                        style: TextStyle(
                          fontSize: 12,
                          color: order.status == 'Pickup' ? Colors.blue.shade800 : Colors.orange.shade800,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                ],
              ),
              Text(
                order.price ?? '',
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
              _buildOrderInfoRow('Restaurant', order.restaurant ?? '', Icons.restaurant_outlined),
              const SizedBox(height: 8),
              _buildOrderInfoRow('Customer', order.customerName ?? '', Icons.person_outline),
              const SizedBox(height: 8),
              _buildOrderInfoRow('Address', order.address ?? '', Icons.location_on_outlined),
              const SizedBox(height: 8),
              _buildOrderInfoRow('Time', order.time ?? '', Icons.access_time),
              const SizedBox(height: 8),
              _buildOrderInfoRow('Distance', order.distance ?? '', Icons.directions_bike_outlined),
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
                        // Call customer logic
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
