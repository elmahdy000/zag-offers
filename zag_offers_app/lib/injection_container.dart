import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/network/api_client.dart';
import 'core/services/socket_service.dart';

// Auth
import 'features/auth/data/datasources/auth_remote_data_source.dart';
import 'features/auth/data/datasources/auth_local_data_source.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/domain/usecases/login_usecase.dart';
import 'features/auth/domain/usecases/register_usecase.dart';
import 'features/auth/domain/usecases/logout_usecase.dart';
import 'features/auth/domain/usecases/update_fcm_token_usecase.dart';
import 'features/auth/domain/usecases/forgot_password_usecase.dart';
import 'features/auth/domain/usecases/reset_password_usecase.dart';
import 'features/auth/domain/usecases/delete_account_usecase.dart';

// Offers
import 'features/offers/data/datasources/offers_remote_data_source.dart';
import 'features/offers/data/repositories/offers_repository_impl.dart';
import 'features/offers/presentation/bloc/offers_bloc.dart';
import 'features/offers/domain/repositories/offers_repository.dart';
import 'features/offers/domain/usecases/get_trending_offers.dart';
import 'features/offers/domain/usecases/get_all_offers.dart';
import 'features/offers/domain/usecases/get_featured_stores.dart';
import 'features/offers/domain/usecases/get_offers_by_store.dart';
import 'features/offers/domain/usecases/search_offers_usecase.dart';
import 'features/offers/domain/usecases/get_recommended_offers_usecase.dart';

// Coupons
import 'features/coupons/data/datasources/coupons_remote_data_source.dart';
import 'features/coupons/data/repositories/coupons_repository_impl.dart';
import 'features/coupons/presentation/bloc/coupons_bloc.dart';
import 'features/coupons/domain/repositories/coupons_repository.dart';
import 'features/coupons/domain/usecases/generate_coupon_usecase.dart';
import 'features/coupons/domain/usecases/get_user_coupons_usecase.dart';

// Favorites
import 'features/favorites/data/datasources/favorites_remote_data_source.dart';
import 'features/favorites/data/repositories/favorites_repository_impl.dart';
import 'features/favorites/presentation/bloc/favorites_bloc.dart';
import 'features/favorites/domain/repositories/favorites_repository.dart';
import 'features/favorites/domain/usecases/get_favorites_usecase.dart';
import 'features/favorites/domain/usecases/toggle_favorite_usecase.dart';

// Reviews
import 'features/reviews/data/datasources/reviews_remote_data_source.dart';
import 'features/reviews/data/repositories/reviews_repository_impl.dart';
import 'features/reviews/presentation/bloc/reviews_bloc.dart';
import 'features/reviews/domain/repositories/reviews_repository.dart';
import 'features/reviews/domain/usecases/review_usecases.dart';

// Notifications
import 'features/notifications/data/repositories/notifications_repository_impl.dart';
import 'features/notifications/domain/repositories/notifications_repository.dart';
import 'features/notifications/presentation/bloc/notification_bloc.dart';

final sl = GetIt.instance;

Future<void> init() async {
  //! Features - Notifications
  sl.registerFactory(() => NotificationBloc(repository: sl()));
  sl.registerLazySingleton<NotificationsRepository>(() => NotificationsRepositoryImpl(apiClient: sl()));
  
  //! Features - Auth
  sl.registerFactory(() => AuthBloc(
        loginUseCase: sl(),
        registerUseCase: sl(),
        logoutUseCase: sl(),
        updateFcmTokenUseCase: sl(),
        forgotPasswordUseCase: sl(),
        resetPasswordUseCase: sl(),
        deleteAccountUseCase: sl(),
      ));
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => RegisterUseCase(sl()));
  sl.registerLazySingleton(() => LogoutUseCase(sl()));
  sl.registerLazySingleton(() => UpdateFcmTokenUseCase(sl()));
  sl.registerLazySingleton(() => ForgotPasswordUseCase(sl()));
  sl.registerLazySingleton(() => ResetPasswordUseCase(sl()));
  sl.registerLazySingleton(() => DeleteAccountUseCase(sl()));
  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(
        remoteDataSource: sl(),
        localDataSource: sl(),
      ));
  sl.registerLazySingleton<AuthRemoteDataSource>(() => AuthRemoteDataSourceImpl(apiClient: sl()));
  sl.registerLazySingleton<AuthLocalDataSource>(() => AuthLocalDataSourceImpl(sharedPreferences: sl()));

  //! Features - Offers
  sl.registerFactory(() => OffersBloc(
        getAllOffersUseCase: sl(),
        getTrendingOffersUseCase: sl(),
        getFeaturedStoresUseCase: sl(),
        getOffersByStoreUseCase: sl(),
        searchOffersUseCase: sl(),
        getRecommendedOffersUseCase: sl(),
      ));
  sl.registerLazySingleton(() => GetAllOffersUseCase(sl()));
  sl.registerLazySingleton(() => GetTrendingOffersUseCase(sl()));
  sl.registerLazySingleton(() => GetFeaturedStoresUseCase(sl()));
  sl.registerLazySingleton(() => GetOffersByStoreUseCase(sl()));
  sl.registerLazySingleton(() => SearchOffersUseCase(sl()));
  sl.registerLazySingleton(() => GetRecommendedOffersUseCase(sl()));
  sl.registerLazySingleton<OffersRepository>(() => OffersRepositoryImpl(remoteDataSource: sl()));
  sl.registerLazySingleton<OffersRemoteDataSource>(() => OffersRemoteDataSourceImpl(apiClient: sl()));

  //! Features - Coupons
  sl.registerFactory(
    () => CouponsBloc(
      generateCouponUseCase: sl(),
      getUserCouponsUseCase: sl(),
    ),
  );
  sl.registerLazySingleton(() => GenerateCouponUseCase(sl()));
  sl.registerLazySingleton(() => GetUserCouponsUseCase(sl()));

  sl.registerLazySingleton<CouponsRepository>(() => CouponsRepositoryImpl(remoteDataSource: sl()));
  sl.registerLazySingleton<CouponsRemoteDataSource>(() => CouponsRemoteDataSourceImpl(apiClient: sl()));

  //! Features - Favorites
  sl.registerFactory(() => FavoritesBloc(
        getFavoritesUseCase: sl(),
        toggleFavoriteUseCase: sl(),
      ));
  sl.registerLazySingleton(() => GetFavoritesUseCase(sl()));
  sl.registerLazySingleton(() => ToggleFavoriteUseCase(sl()));
  sl.registerLazySingleton<FavoritesRepository>(() => FavoritesRepositoryImpl(remoteDataSource: sl()));
  sl.registerLazySingleton<FavoritesRemoteDataSource>(() => FavoritesRemoteDataSourceImpl(apiClient: sl()));

  //! Features - Reviews
  sl.registerFactory(() => ReviewsBloc(
        addReviewUseCase: sl(),
        getStoreReviewsUseCase: sl(),
      ));
  sl.registerLazySingleton(() => AddReviewUseCase(sl()));
  sl.registerLazySingleton(() => GetStoreReviewsUseCase(sl()));
  sl.registerLazySingleton<ReviewsRepository>(() => ReviewsRepositoryImpl(remoteDataSource: sl()));
  sl.registerLazySingleton<ReviewsRemoteDataSource>(() => ReviewsRemoteDataSourceImpl(apiClient: sl()));

  //! Core
  sl.registerLazySingleton(() => ApiClient(dio: sl()));
  sl.registerLazySingleton(() => SocketService());

  //! External
  final sharedPrefs = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => sharedPrefs);
  sl.registerLazySingleton(() => Dio());
}
