import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  final String message;
  const Failure(this.message);

  @override
  List<Object> get props => [message];
}

// خطأ في السيرفر أو الشبكة
class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

// خطأ في البيانات المحلية (Cache)
class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

// خطأ في التحقق من البيانات (Validation)
class AuthFailure extends Failure {
  const AuthFailure(super.message);
}
