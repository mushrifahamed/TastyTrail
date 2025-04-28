class Payment {
  final String date;
  final double amount;
  final String paymentMethod;
  final String status;

  Payment({
    required this.date,
    required this.amount,
    required this.paymentMethod,
    required this.status,
  });
}