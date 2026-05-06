import 'package:equatable/equatable.dart';

class Category extends Equatable {
  final String id;
  final String name;
  final String? icon;
  final int offersCount;

  const Category({
    required this.id,
    required this.name,
    this.icon,
    this.offersCount = 0,
  });

  @override
  List<Object?> get props => [id, name, icon, offersCount];
}
