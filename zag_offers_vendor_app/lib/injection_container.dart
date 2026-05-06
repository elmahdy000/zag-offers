import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core/network/api_client.dart';
import 'core/network/socket_service.dart';
import 'features/auth/data/datasources/auth_remote_data_source.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/domain/usecases/login_usecase.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';

import 'features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'features/dashboard/data/repositories/dashboard_repository_impl.dart';
import 'features/dashboard/domain/repositories/dashboard_repository.dart';
import 'features/dashboard/domain/usecases/get_dashboard_stats_usecase.dart';
import 'features/dashboard/presentation/bloc/dashboard_bloc.dart';

import 'features/offers/data/datasources/offer_remote_data_source.dart';
import 'features/offers/data/repositories/offer_repository_impl.dart';
import 'features/offers/domain/repositories/offer_repository.dart';
import 'features/offers/domain/usecases/offer_usecases.dart';
import 'features/offers/presentation/bloc/offers_bloc.dart';
import 'features/profile/data/datasources/profile_remote_data_source.dart';
import 'features/profile/data/repositories/profile_repository_impl.dart';
import 'features/profile/domain/repositories/profile_repository.dart';
import 'features/profile/domain/usecases/profile_usecases.dart';
import 'features/profile/presentation/bloc/profile_bloc.dart';
import 'features/qr_scanner/data/datasources/qr_scanner_remote_data_source.dart';
import 'features/qr_scanner/data/repositories/qr_scanner_repository_impl.dart';
import 'features/qr_scanner/domain/repositories/qr_scanner_repository.dart';
import 'features/qr_scanner/domain/usecases/redeem_coupon_usecase.dart';
import 'features/qr_scanner/presentation/bloc/qr_scanner_bloc.dart';
import 'features/upload/data/datasources/upload_remote_data_source.dart';
import 'features/upload/domain/repositories/upload_repository.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // --- Features - Auth ---
  // BLoC
  sl.registerFactory(() => AuthBloc(loginUseCase: sl(), authRepository: sl()));

  // Use cases
  sl.registerLazySingleton(() => LoginUseCase(sl()));

  // Repository
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteDataSource: sl(), sharedPreferences: sl()),
  );

  // Data sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(apiClient: sl(), sharedPreferences: sl()),
  );

  // --- Features - Dashboard ---
  // BLoC
  sl.registerFactory(() => DashboardBloc(getDashboardStatsUseCase: sl()));

  // Use cases
  sl.registerLazySingleton(() => GetDashboardStatsUseCase(sl()));

  // Repository
  sl.registerLazySingleton<DashboardRepository>(
      () => DashboardRepositoryImpl(remoteDataSource: sl()));

  // Data sources
  sl.registerLazySingleton<DashboardRemoteDataSource>(
      () => DashboardRemoteDataSourceImpl(apiClient: sl()));

  // --- Features - QR Scanner ---
  // BLoC
  sl.registerFactory(() => QRScannerBloc(redeemCouponUseCase: sl()));

  // Use cases
  sl.registerLazySingleton(() => RedeemCouponUseCase(sl()));

  // Repository
  sl.registerLazySingleton<QRScannerRepository>(
      () => QRScannerRepositoryImpl(remoteDataSource: sl()));

  // Data sources
  sl.registerLazySingleton<QRScannerRemoteDataSource>(
      () => QRScannerRemoteDataSourceImpl(apiClient: sl()));

  // --- Features - Offers ---
  // BLoC
  sl.registerFactory(() => OffersBloc(
        getMyOffersUseCase: sl(),
        createOfferUseCase: sl(),
        updateOfferUseCase: sl(),
        deleteOfferUseCase: sl(),
      ));

  // Use cases
  sl.registerLazySingleton(() => GetMyOffersUseCase(sl()));
  sl.registerLazySingleton(() => CreateOfferUseCase(sl()));
  sl.registerLazySingleton(() => UpdateOfferUseCase(sl()));
  sl.registerLazySingleton(() => DeleteOfferUseCase(sl()));

  // Repository
  sl.registerLazySingleton<OfferRepository>(
      () => OfferRepositoryImpl(remoteDataSource: sl()));

  // Data sources
  sl.registerLazySingleton<OfferRemoteDataSource>(
      () => OfferRemoteDataSourceImpl(apiClient: sl()));

  // --- Features - Profile ---
  // BLoC
  sl.registerFactory(() => ProfileBloc(
        getProfileUseCase: sl(),
        updateProfileUseCase: sl(),
        changePasswordUseCase: sl(),
      ));

  // Use cases
  sl.registerLazySingleton(() => GetProfileUseCase(sl()));
  sl.registerLazySingleton(() => UpdateProfileUseCase(sl()));
  sl.registerLazySingleton(() => ChangePasswordUseCase(sl()));

  // Repository
  sl.registerLazySingleton<ProfileRepository>(
      () => ProfileRepositoryImpl(remoteDataSource: sl()));

  // Data sources
  sl.registerLazySingleton<ProfileRemoteDataSource>(
      () => ProfileRemoteDataSourceImpl(apiClient: sl()));

  // --- Features - Upload ---
  sl.registerLazySingleton<UploadUseCase>(() => UploadUseCase(sl()));
  sl.registerLazySingleton<UploadRepository>(
      () => UploadRepositoryImpl(remoteDataSource: sl()));
  sl.registerLazySingleton<UploadRemoteDataSource>(
      () => UploadRemoteDataSourceImpl(apiClient: sl()));

  // --- Core ---
  sl.registerLazySingleton(() => ApiClient());
  sl.registerLazySingleton(() => SocketService());

  // --- External ---
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => sharedPreferences);
}
