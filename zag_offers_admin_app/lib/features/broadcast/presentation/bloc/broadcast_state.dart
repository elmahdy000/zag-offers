part of 'broadcast_bloc.dart';

abstract class BroadcastState extends Equatable {
  const BroadcastState();

  @override
  List<Object?> get props => [];
}

class BroadcastInitial extends BroadcastState {}

class BroadcastLoading extends BroadcastState {}

class BroadcastSuccess extends BroadcastState {}

class BroadcastError extends BroadcastState {
  final String message;
  const BroadcastError({required this.message});

  @override
  List<Object?> get props => [message];
}
