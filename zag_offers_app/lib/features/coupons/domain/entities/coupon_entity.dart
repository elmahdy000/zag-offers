import 'package:equatable/equatable.dart';
import 'package:zag_offers_app/features/offers/domain/entities/offer_entity.dart';

/// القيم الحقيقية من الباك-إيند:
///   GENERATED = كوبون اتعمل وصالح
///   USED       = اتستخدم
///   EXPIRED    = انتهت صلاحيته
class CouponEntity extends Equatable {
  final String id;
  final String code;
  final String status;    // GENERATED | USED | EXPIRED
  final DateTime createdAt;
  final DateTime? expiresAt;
  final OfferEntity offer;

  const CouponEntity({
    required this.id,
    required this.code,
    required this.status,
    required this.createdAt,
    this.expiresAt,
    required this.offer,
  });

  bool get isActive => status == 'GENERATED' && (expiresAt == null || DateTime.now().isBefore(expiresAt!));

  @override
  List<Object?> get props => [id, code, status, createdAt, expiresAt, offer];
}
