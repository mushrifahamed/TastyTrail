import 'package:delivery_person_app/models/delivery.dart';
import 'package:delivery_person_app/services/order_service.dart';
import 'package:delivery_person_app/theme/apptheme.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

class DeliveryHistoryTab extends StatefulWidget {
  @override
  State<DeliveryHistoryTab> createState() => _DeliveryHistoryTabState();
}

class _DeliveryHistoryTabState extends State<DeliveryHistoryTab> {
  Future<List<DeliveryData>>? _deliveredOrdersFuture;
  String? _searchQuery;
  
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
      setState(() {
        _deliveredOrdersFuture = Future.error('Driver ID not found in storage');
      });
    }
  }

  void _filterOrders(String query) {
    setState(() {
      _searchQuery = query.isEmpty ? null : query.toLowerCase();
    });
  }

  List<DeliveryData> _getFilteredOrders(List<DeliveryData> allOrders) {
    if (_searchQuery == null || _searchQuery!.isEmpty) {
      return allOrders;
    }
    
    return allOrders.where((order) =>
      (order.orderId?.toLowerCase().contains(_searchQuery!) ?? false) ||
      (order.customerName?.toLowerCase().contains(_searchQuery!) ?? false) ||
      (order.restaurant?.toLowerCase().contains(_searchQuery!) ?? false)
    ).toList();
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

        final filteredOrders = _getFilteredOrders(snapshot.data!);
        
        return RefreshIndicator(
          onRefresh: () async {
            await _loadDriverIdAndFetchOrders();
          },
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: _buildSearchAndFilter(),
              ),
              Expanded(
                child: filteredOrders.isEmpty
                  ? _buildEmptyState('No matching orders', 'Try a different search term', Icons.search_off)
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      itemCount: filteredOrders.length,
                      itemBuilder: (context, index) => _buildDeliveryCard(filteredOrders[index]),
                    ),
              ),
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
            onChanged: _filterOrders,
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
              // Show filter options modal
              _showFilterOptions(context);
            },
          ),
        ),
      ],
    );
  }

  void _showFilterOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Filter Options',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildFilterOption('Date (New to Old)'),
            _buildFilterOption('Date (Old to New)'),
            _buildFilterOption('Amount (High to Low)'),
            _buildFilterOption('Amount (Low to High)'),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: () {
                  Navigator.pop(context);
                },
                child: const Text('Apply Filters'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterOption(String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Radio(
            value: label,
            groupValue: null, // Selected value
            onChanged: (value) {},
            activeColor: AppColors.primary,
          ),
          Text(label),
        ],
      ),
    );
  }

  Widget _buildDeliveryCard(DeliveryData delivery) {
    // Format the date and time
    String formattedDate = '';
    String formattedTime = '';
    
    if (delivery.createdAt != null) {
      try {
        final DateTime orderDate = DateTime.parse(delivery.createdAt!);
        formattedDate = DateFormat('MMM d, yyyy').format(orderDate);
        formattedTime = DateFormat('h:mm a').format(orderDate);
      } catch (e) {
        // Fallback to raw date and time if parsing fails
        formattedDate = delivery.date ?? '';
        formattedTime = delivery.time ?? '';
      }
    } else {
      formattedDate = delivery.date ?? '';
      formattedTime = delivery.time ?? '';
    }

    // Format currency
    final currencyFormatter = NumberFormat.currency(
      symbol: 'Rs.',
      decimalDigits: 2,
    );
    final formattedAmount = delivery.totalAmount != null 
        ? currencyFormatter.format(delivery.totalAmount! / 100) 
        : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.check_circle_outline, color: AppColors.primary),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Order #${delivery.orderId?.substring(delivery.orderId!.length - 6) ?? ''}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          formattedDate,
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
                        ),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    delivery.status ?? 'Delivered',
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              children: [
                const Icon(Icons.store, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    delivery.restaurant ?? 'Restaurant',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.person, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  delivery.customerName ?? 'Customer',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.phone, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Text(
                  delivery.customerPhone ?? 'No phone',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    delivery.deliveryAddress ?? 'No address',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Total Amount',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      formattedAmount,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text(
                      'Payment Status',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: delivery.paymentStatus?.toLowerCase() == 'paid'
                            ? Colors.green.withOpacity(0.1)
                            : Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        (delivery.paymentStatus ?? 'Pending').toUpperCase(),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          color: delivery.paymentStatus?.toLowerCase() == 'paid'
                              ? Colors.green
                              : Colors.orange,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildOrderDetailsTile(delivery),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderDetailsTile(DeliveryData delivery) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        title: const Text(
          'Order Details',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        tilePadding: EdgeInsets.zero,
        childrenPadding: EdgeInsets.zero,
        children: [
          if (delivery.items != null && delivery.items!.isNotEmpty)
            ...delivery.items!.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${item.name} x${item.quantity}'),
                  Text(
                    'Rs. ${(item.price! * item.quantity!) / 100}',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            )),
          if (delivery.items == null || delivery.items!.isEmpty)
            const Text('No item details available'),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 80, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}