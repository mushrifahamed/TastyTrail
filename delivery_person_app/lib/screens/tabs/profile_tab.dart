import 'package:flutter/material.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          _buildProfileHeader(),
          const SizedBox(height: 24),
          _buildProfileStats(),
          const SizedBox(height: 24),
          _buildProfileOptions(context),
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
          child: Icon(Icons.person, size: 50, color: Colors.white),
        ),
        const SizedBox(height: 16),
        const Text(
          'John Driver',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          'ID: #DRV1234',
          style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
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
              Icon(Icons.star, size: 16, color: Colors.amber.shade700),
              const SizedBox(width: 4),
              Text(
                '4.8',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green.shade800),
              ),
              Text(
                ' (256 reviews)',
                style: TextStyle(fontSize: 12, color: Colors.green.shade800),
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

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Container(
      height: 40,
      width: 1,
      color: Colors.grey.shade300,
    );
  }

  Widget _buildProfileOptions(BuildContext context) {
    return Column(
      children: [
        _buildProfileOptionItem(
          icon: Icons.account_circle_outlined,
          title: 'Personal Information',
          onTap: () {},
        ),
        _buildProfileOptionItem(
          icon: Icons.directions_bike_outlined,
          title: 'Vehicle Information',
          onTap: () {},
        ),
        _buildProfileOptionItem(
          icon: Icons.work_outline,
          title: 'Work Schedule',
          onTap: () {},
        ),
        _buildProfileOptionItem(
          icon: Icons.chat_outlined,
          title: 'Support',
          onTap: () {},
        ),
        _buildProfileOptionItem(
          icon: Icons.stars_outlined,
          title: 'My Reviews',
          onTap: () {},
        ),
        _buildProfileOptionItem(
          icon: Icons.notifications_outlined,
          title: 'Notification Settings',
          onTap: () {},
        ),
        _buildProfileOptionItem(
          icon: Icons.privacy_tip_outlined,
          title: 'Privacy Policy',
          onTap: () {},
        ),
        _buildProfileOptionItem(
          icon: Icons.help_outline,
          title: 'Help & FAQ',
          onTap: () {},
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () {
            // TODO: Logout action
          },
          icon: Icon(Icons.logout, color: Colors.red.shade700),
          label: Text(
            'Logout',
            style: TextStyle(color: Colors.red.shade700, fontWeight: FontWeight.w500),
          ),
          style: OutlinedButton.styleFrom(
            side: BorderSide(color: Colors.red.shade300),
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'App Version 1.0.0',
          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
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
          border: Border(bottom: BorderSide(color: Colors.grey.shade200, width: 1)),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.deepPurple, size: 20),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
            ),
            const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 16),
          ],
        ),
      ),
    );
  }
}
