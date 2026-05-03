import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/redeem_coupon_usecase.dart';

// --- Events ---
abstract class QRScannerEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class CouponScanned extends QRScannerEvent {
  final String code;
  CouponScanned(this.code);
  @override
  List<Object?> get props => [code];
}

class ResetScanner extends QRScannerEvent {}

// --- States ---
abstract class QRScannerState extends Equatable {
  @override
  List<Object?> get props => [];
}

class QRScannerInitial extends QRScannerState {}

class QRScannerLoading extends QRScannerState {}

class QRScannerSuccess extends QRScannerState {
  final String message;
  QRScannerSuccess(this.message);
  @override
  List<Object?> get props => [message];
}

class QRScannerError extends QRScannerState {
  final String message;
  QRScannerError(this.message);
  @override
  List<Object?> get props => [message];
}

// --- BLoC ---
class QRScannerBloc extends Bloc<QRScannerEvent, QRScannerState> {
  final RedeemCouponUseCase redeemCouponUseCase;

  QRScannerBloc({required this.redeemCouponUseCase}) : super(QRScannerInitial()) {
    on<CouponScanned>(_onCouponScanned);
    on<ResetScanner>((event, emit) => emit(QRScannerInitial()));
  }

  Future<void> _onCouponScanned(
    CouponScanned event,
    Emitter<QRScannerState> emit,
  ) async {
    emit(QRScannerLoading());
    try {
      await redeemCouponUseCase(event.code);
      emit(QRScannerSuccess('تم تفعيل الكوبون بنجاح!'));
    } catch (e) {
      emit(QRScannerError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
