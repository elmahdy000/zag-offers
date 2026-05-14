part of 'broadcast_bloc.dart';

abstract class BroadcastEvent extends Equatable {
  const BroadcastEvent();

  @override
  List<Object?> get props => [];
}

class SendBroadcastEvent extends BroadcastEvent {
  final String title;
  final String body;
  final String? imageUrl;
  final String? area;
  final String? target;

  const SendBroadcastEvent({
    required this.title,
    required this.body,
    this.imageUrl,
    this.area,
    this.target,
  });

  @override
  List<Object?> get props => [title, body, imageUrl, area, target];
}
