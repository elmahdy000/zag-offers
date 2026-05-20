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

  const SendBroadcastEvent({
    required this.title,
    required this.body,
    this.imageUrl,
    this.area,
  });

  @override
  List<Object?> get props => [title, body, imageUrl, area];
}
