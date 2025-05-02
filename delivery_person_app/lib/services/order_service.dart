import 'dart:convert';
import 'package:delivery_person_app/models/delivery.dart';
import 'package:http/http.dart' as http;

class DeliveryService {
  static Future<List<DeliveryData>> fetchDeliveredOrders(String driverId) async {
    final url = Uri.parse('http://10.0.2.2:3008/api/delivery/delivered/$driverId');
    final response = await http.get(url);

    if (response.statusCode == 200) {
      final body = jsonDecode(response.body);
      final List<dynamic> ordersJson = body['orders'];
      return ordersJson.map((json) => DeliveryData.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load delivered orders');
    }
  }
}
