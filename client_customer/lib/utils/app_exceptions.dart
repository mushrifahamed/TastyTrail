// lib/utils/app_exceptions.dart
class AppException implements Exception {
  final String message;
  final String? prefix;
  final String? url;

  AppException([this.message = '', this.prefix, this.url]);

  @override
  String toString() {
    return "$prefix$message";
  }
}

class FetchDataException extends AppException {
  FetchDataException([String? message, String? url])
    : super(
        message ?? "Error During Communication",
        "Communication Error: ",
        url,
      );
}

class BadRequestException extends AppException {
  BadRequestException([String? message, String? url])
    : super(message ?? "Invalid Request", "Invalid Request: ", url);
}

class UnauthorisedException extends AppException {
  UnauthorisedException([String? message, String? url])
    : super(message ?? "Unauthorised", "Unauthorised: ", url);
}

class InvalidInputException extends AppException {
  InvalidInputException([String? message])
    : super(message ?? "Invalid Input", "Invalid Input: ");
}

class NetworkException extends AppException {
  NetworkException([String? message])
    : super(message ?? "Network Error", "Network Error: ");
}
