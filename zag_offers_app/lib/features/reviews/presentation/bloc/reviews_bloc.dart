import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/review_entity.dart';
import '../../domain/usecases/review_usecases.dart';

// Events
abstract class ReviewsEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class FetchStoreReviews extends ReviewsEvent {
  final String storeId;
  FetchStoreReviews(this.storeId);
  @override
  List<Object?> get props => [storeId];
}

class AddReviewRequested extends ReviewsEvent {
  final String? storeId;
  final String? offerId;
  final int rating;
  final String? comment;

  AddReviewRequested({this.storeId, this.offerId, required this.rating, this.comment});

  @override
  List<Object?> get props => [storeId, offerId, rating, comment];
}

// States
abstract class ReviewsState extends Equatable {
  @override
  List<Object?> get props => [];
}

class ReviewsInitial extends ReviewsState {}
class ReviewsLoading extends ReviewsState {}
class ReviewsLoaded extends ReviewsState {
  final List<ReviewEntity> reviews;
  ReviewsLoaded(this.reviews);
  @override
  List<Object?> get props => [reviews];
}
class ReviewActionSuccess extends ReviewsState {}
class ReviewsError extends ReviewsState {
  final String message;
  ReviewsError(this.message);
  @override
  List<Object?> get props => [message];
}

// Bloc
class ReviewsBloc extends Bloc<ReviewsEvent, ReviewsState> {
  final AddReviewUseCase addReviewUseCase;
  final GetStoreReviewsUseCase getStoreReviewsUseCase;

  ReviewsBloc({
    required this.addReviewUseCase,
    required this.getStoreReviewsUseCase,
  }) : super(ReviewsInitial()) {
    on<FetchStoreReviews>(_onFetchStoreReviews);
    on<AddReviewRequested>(_onAddReviewRequested);
  }

  Future<void> _onFetchStoreReviews(FetchStoreReviews event, Emitter<ReviewsState> emit) async {
    if (event.storeId.isEmpty) {
      emit(ReviewsLoaded([]));
      return;
    }
    emit(ReviewsLoading());
    final result = await getStoreReviewsUseCase(event.storeId);
    result.fold(
      (failure) => emit(ReviewsError(failure.message)),
      (reviews) => emit(ReviewsLoaded(reviews.cast<ReviewEntity>())),
    );
  }

  Future<void> _onAddReviewRequested(AddReviewRequested event, Emitter<ReviewsState> emit) async {
    emit(ReviewsLoading());
    final result = await addReviewUseCase(
      storeId: event.storeId,
      offerId: event.offerId,
      rating: event.rating,
      comment: event.comment,
    );
    result.fold(
      (failure) => emit(ReviewsError(failure.message)),
      (_) => emit(ReviewActionSuccess()),
    );
  }
}
