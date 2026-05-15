import 'package:flutter_bloc/flutter_bloc.dart';
import '../../data/models/offer_model.dart';
import '../../domain/entities/offer_entity.dart';
import '../../domain/entities/store_entity.dart';
import '../../domain/usecases/get_all_offers.dart';
import '../../domain/usecases/get_trending_offers.dart';
import '../../domain/usecases/get_featured_stores.dart';
import '../../domain/usecases/get_offers_by_store.dart';
import '../../domain/usecases/search_offers_usecase.dart';
import '../../domain/usecases/get_recommended_offers_usecase.dart';
import '../../domain/usecases/get_categories_usecase.dart';
import '../../domain/entities/category_entity.dart';
import 'offers_event.dart';
import 'offers_state.dart';

class OffersBloc extends Bloc<OffersEvent, OffersState> {
  final GetAllOffersUseCase getAllOffersUseCase;
  final GetTrendingOffersUseCase getTrendingOffersUseCase;
  final GetFeaturedStoresUseCase getFeaturedStoresUseCase;
  final GetOffersByStoreUseCase getOffersByStoreUseCase;
  final SearchOffersUseCase searchOffersUseCase;
  final GetRecommendedOffersUseCase getRecommendedOffersUseCase;
  final GetCategoriesUseCase getCategoriesUseCase;

  OffersBloc({
    required this.getAllOffersUseCase,
    required this.getTrendingOffersUseCase,
    required this.getFeaturedStoresUseCase,
    required this.getOffersByStoreUseCase,
    required this.searchOffersUseCase,
    required this.getRecommendedOffersUseCase,
    required this.getCategoriesUseCase,
  }) : super(OffersInitial()) {
    on<FetchHomeData>(_onFetchHomeData);
    on<FetchAllOffers>(_onFetchAllOffers);
    on<SearchOffers>(_onSearchOffers);
    on<FetchRecommendedOffers>(_onFetchRecommendedOffers);
    on<AddLiveOffer>(_onAddLiveOffer);
    on<FetchStoreOffers>(_onFetchStoreOffers);
  }

  Future<void> _onFetchHomeData(FetchHomeData event, Emitter<OffersState> emit) async {
    emit(OffersLoading());
    final trendingFuture = _loadSection<OfferEntity>(
      getTrendingOffersUseCase(),
      timeout: const Duration(seconds: 6),
    );
    final storesFuture = _loadSection<StoreEntity>(
      getFeaturedStoresUseCase(),
      timeout: const Duration(seconds: 4),
    );
    final categoriesFuture = _loadSection<CategoryEntity>(
      getCategoriesUseCase(),
      timeout: const Duration(seconds: 4),
    );

    final results = await Future.wait([
      trendingFuture,
      storesFuture,
      categoriesFuture,
    ]);

    final trending = results[0] as _SectionResult<OfferEntity>;
    final stores = results[1] as _SectionResult<StoreEntity>;
    final categories = results[2] as _SectionResult<CategoryEntity>;

    // Only emit error if both failed or if there's a critical error
    if (trending.errorMessage != null && stores.errorMessage != null) {
      emit(OffersError(trending.errorMessage ?? 'تعذر تحميل البيانات حاليًا'));
      return;
    }

    final noticeParts = <String>[];
    if (stores.errorMessage != null) {
      noticeParts.add('المتاجر');
    }
    if (categories.errorMessage != null) {
      noticeParts.add('الأقسام');
    }

    emit(
      OffersLoaded(
        allOffers: const [],
        trendingOffers: trending.items,
        featuredStores: stores.items,
        categories: categories.items,
        recommendedOffers: const [],
        noticeMessage: noticeParts.isEmpty
            ? null
            : 'تعذر تحميل ${noticeParts.join(' و ')} الآن، وتم عرض المتاح.',
      ),
    );
  }

  Future<void> _onFetchAllOffers(
    FetchAllOffers event,
    Emitter<OffersState> emit,
  ) async {
    if (state is! OffersLoaded) {
      emit(OffersLoading());
      final allOffersResult = await getAllOffersUseCase();
      allOffersResult.fold(
        (failure) => emit(OffersError(failure.message)),
        (offers) => emit(
          OffersLoaded(
            allOffers: offers,
            trendingOffers: offers,
            featuredStores: const [],
            recommendedOffers: const [],
          ),
        ),
      );
      return;
    }

    final currentState = state as OffersLoaded;
    if (currentState.allOffers.isNotEmpty) return;

    final result = await getAllOffersUseCase();
    result.fold(
      (failure) => emit(OffersError(failure.message)),
      (offers) => emit(
        OffersLoaded(
          allOffers: offers,
          trendingOffers: currentState.trendingOffers,
          featuredStores: currentState.featuredStores,
          categories: currentState.categories,
          recommendedOffers: currentState.recommendedOffers,
          searchResults: currentState.searchResults,
          noticeMessage: currentState.noticeMessage,
        ),
      ),
    );
  }

  Future<void> _onSearchOffers(SearchOffers event, Emitter<OffersState> emit) async {
    if (state is! OffersLoaded) return;
    final currentState = state as OffersLoaded;

    final result = await searchOffersUseCase(event.query);
    result.fold(
      (failure) => emit(OffersError(failure.message)),
      (results) => emit(OffersLoaded(
        allOffers: currentState.allOffers,
        trendingOffers: currentState.trendingOffers,
        featuredStores: currentState.featuredStores,
        categories: currentState.categories,
        recommendedOffers: currentState.recommendedOffers,
        searchResults: results,
        noticeMessage: currentState.noticeMessage,
      )),
    );
  }

  Future<void> _onFetchRecommendedOffers(FetchRecommendedOffers event, Emitter<OffersState> emit) async {
    if (state is! OffersLoaded) return;
    final currentState = state as OffersLoaded;

    final result = await getRecommendedOffersUseCase();
    result.fold(
      (failure) => emit(OffersError(failure.message)),
      (recommended) => emit(OffersLoaded(
        allOffers: currentState.allOffers,
        trendingOffers: currentState.trendingOffers,
        featuredStores: currentState.featuredStores,
        categories: currentState.categories,
        recommendedOffers: recommended,
        noticeMessage: currentState.noticeMessage,
      )),
    );
  }

  void _onAddLiveOffer(AddLiveOffer event, Emitter<OffersState> emit) {
    if (state is! OffersLoaded) return;
    final currentState = state as OffersLoaded;

    try {
      final newOffer = OfferModel.fromJson(event.rawData);
      final exists = currentState.trendingOffers.any((o) => o.id == newOffer.id);
      if (exists) return;

      emit(OffersLoaded(
        allOffers: currentState.allOffers,
        trendingOffers: [newOffer, ...currentState.trendingOffers],
        featuredStores: currentState.featuredStores,
        categories: currentState.categories,
        recommendedOffers: currentState.recommendedOffers,
        noticeMessage: currentState.noticeMessage,
      ));
    } catch (_) {}
  }

  Future<void> _onFetchStoreOffers(FetchStoreOffers event, Emitter<OffersState> emit) async {
    emit(StoreOffersLoading());
    final result = await getOffersByStoreUseCase(event.storeId);
    result.fold(
      (failure) => emit(OffersError(failure.message)),
      (offers) => emit(StoreOffersLoaded(offers: offers)),
    );
  }

  Future<_SectionResult<T>> _loadSection<T>(
    Future<dynamic> request, {
    required Duration timeout,
  }) async {
    try {
      final result = await request.timeout(timeout);
      return result.fold(
        (failure) => _SectionResult<T>(items: const [], errorMessage: failure.message),
        (items) => _SectionResult<T>(items: items is List ? List<T>.from(items) : <T>[]),
      );
    } catch (_) {
      return _SectionResult<T>(
        items: const [],
        errorMessage: 'انتهت مهلة التحميل',
      );
    }
  }
}

class _SectionResult<T> {
  final List<T> items;
  final String? errorMessage;

  const _SectionResult({
    required this.items,
    this.errorMessage,
  });
}
