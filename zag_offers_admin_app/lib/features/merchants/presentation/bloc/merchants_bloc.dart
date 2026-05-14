import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/entities/merchant.dart';
import 'package:zag_offers_admin_app/features/merchants/domain/repositories/merchant_repository.dart';
import 'package:zag_offers_admin_app/core/error/failures.dart';

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
        (result) => emit(MerchantsLoaded(
          merchants: result.items,
          totalCount: result.total,
        )),
      );
    });

    on<UpdateMerchantStatusEvent>((event, emit) async {
      emit(MerchantActionLoading());
      final result = await repository.updateMerchantStatus(
        event.id,
        event.status,
        reason: event.reason,
      );
      result.fold(
        (failure) => emit(MerchantsError(message: failure.message)),
        (_) {
          emit(MerchantStatusUpdated());
          add(const LoadMerchantsEvent()); // Refresh list
        },
      );
    });

    on<DeleteMerchantEvent>((event, emit) async {
      emit(MerchantActionLoading());
      final result = await repository.deleteMerchant(event.id);
      result.fold(
        (failure) => emit(MerchantsError(message: failure.message)),
        (_) {
          emit(MerchantDeleted());
          add(const LoadMerchantsEvent());
        },
      );
    });
    on<CreateMerchantEvent>((event, emit) async {
      emit(MerchantActionLoading());
      final result = await repository.createMerchant(
        ownerName: event.ownerName,
        phone: event.phone,
        email: event.email,
        password: event.password,
        storeName: event.storeName,
        categoryId: event.categoryId,
        area: event.area,
        address: event.address,
      );
      result.fold(
        (failure) => emit(MerchantsError(message: failure.message)),
        (_) {
          emit(MerchantCreated());
          add(const LoadMerchantsEvent());
        },
      );
    });
  }
}
