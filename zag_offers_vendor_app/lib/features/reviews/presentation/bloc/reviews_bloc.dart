import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/entities/review_entity.dart';
import '../../domain/repositories/reviews_repository.dart';

// --- Events ---
abstract class ReviewsEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class GetReviewsRequested extends ReviewsEvent {
  final String storeId;
  GetReviewsRequested(this.storeId);
  @override
  List<Object?> get props => [storeId];
}

class AddReplyRequested extends ReviewsEvent {
  final String reviewId;
  final String reply;
  AddReplyRequested(this.reviewId, this.reply);
  @override
  List<Object?> get props => [reviewId, reply];
}

// --- States ---
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

class ReviewsError extends ReviewsState {
  final String message;
  ReviewsError(this.message);
  @override
  List<Object?> get props => [message];
}

// --- BLoC ---
class ReviewsBloc extends Bloc<ReviewsEvent, ReviewsState> {
  final ReviewsRepository repository;

  ReviewsBloc({required this.repository}) : super(ReviewsInitial()) {
    on<GetReviewsRequested>(_onGetReviewsRequested);
    on<AddReplyRequested>(_onAddReplyRequested);
  }

  Future<void> _onGetReviewsRequested(
    GetReviewsRequested event,
    Emitter<ReviewsState> emit,
  ) async {
    emit(ReviewsLoading());
    try {
      final reviews = await repository.getStoreReviews(event.storeId);
      emit(ReviewsLoaded(reviews));
    } catch (e) {
      emit(ReviewsError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onAddReplyRequested(
    AddReplyRequested event,
    Emitter<ReviewsState> emit,
  ) async {
    final currentState = state;
    try {
      await repository.addReply(event.reviewId, event.reply);
      if (currentState is ReviewsLoaded) {
        // Optimistically update the UI or just emit success state. 
        // For simplicity, we emit a copy with a fake update or trigger reload from UI
        emit(ReplyAddedSuccess());
        emit(currentState);
      } else {
        emit(ReplyAddedSuccess());
      }
    } catch (e) {
      emit(ReviewsError(e.toString().replaceAll('Exception: ', '')));
      if (currentState is ReviewsLoaded) {
        emit(currentState);
      }
    }
  }
}

class ReplyAddedSuccess extends ReviewsState {}
