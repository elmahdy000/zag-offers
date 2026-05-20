import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:zag_offers_admin_app/features/broadcast/domain/repositories/broadcast_repository.dart';

part 'broadcast_event.dart';
part 'broadcast_state.dart';

class BroadcastBloc extends Bloc<BroadcastEvent, BroadcastState> {
  final BroadcastRepository repository;

  BroadcastBloc({required this.repository}) : super(BroadcastInitial()) {
    on<SendBroadcastEvent>((event, emit) async {
      emit(BroadcastLoading());
      final result = await repository.sendBroadcast(
        title: event.title,
        body: event.body,
        imageUrl: event.imageUrl,
        area: event.area,
      );
      result.fold(
        (failure) => emit(BroadcastError(message: failure.message)),
        (_) => emit(BroadcastSuccess()),
      );
    });
  }
}
