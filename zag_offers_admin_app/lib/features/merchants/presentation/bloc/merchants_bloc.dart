import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/repositories/merchant_repository.dart';

part 'merchants_event.dart';
part 'merchants_state.dart';

class MerchantsBloc extends Bloc<MerchantsEvent, MerchantsState> {
  final MerchantRepository repository;

  MerchantsBloc({required this.repository}) : super(MerchantsInitial()) {
    on<LoadMerchantsEvent>((event, emit) async {
      emit(MerchantsLoading());
      final result = await repository.getMerchants(status: event.status);
      result.fold(
        (failure) => emit(MerchantsError(message: failure.message)),
        (merchants) => emit(MerchantsLoaded(merchants: merchants)),
      );
    });

    on<UpdateMerchantStatusEvent>((event, emit) async {
      emit(MerchantActionLoading());
      final result = await repository.updateMerchantStatus(
        event.id,
        event.status,
        reason: event.reason,
      );
      result.fold((failure) => emit(MerchantsError(message: failure.message)), (
        _,
      ) {
        emit(MerchantStatusUpdated());
        add(LoadMerchantsEvent()); // Refresh list
      });
    });

    on<DeleteMerchantEvent>((event, emit) async {
      emit(MerchantActionLoading());
      final result = await repository.deleteMerchant(event.id);
      result.fold(
        (failure) => emit(MerchantsError(message: failure.message)),
        (_) {
          emit(MerchantDeleted());
          add(LoadMerchantsEvent());
        },
      );
    });
  }
}
