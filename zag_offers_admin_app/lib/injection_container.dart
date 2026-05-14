import 'package:dio/dio.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/network/api_client.dart';
import 'core/services/notification_service.dart';
import 'core/services/realtime_service.dart';
import 'features/auth/data/datasources/auth_remote_datasource.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/dashboard/data/datasources/dashboard_remote_datasource.dart';
import 'features/dashboard/data/repositories/dashboard_repository_impl.dart';
import 'features/dashboard/domain/repositories/dashboard_repository.dart';
import 'features/dashboard/presentation/bloc/dashboard_bloc.dart';
import 'features/merchants/data/datasources/merchant_remote_datasource.dart';
import 'features/merchants/data/repositories/merchant_repository_impl.dart';
import 'features/merchants/domain/repositories/merchant_repository.dart';
import 'features/merchants/presentation/bloc/merchants_bloc.dart';
import 'features/users/data/datasources/user_remote_datasource.dart';
import 'features/users/data/repositories/user_repository_impl.dart';
import 'features/users/domain/repositories/user_repository.dart';
import 'features/users/presentation/bloc/users_bloc.dart';
import 'features/offers/data/datasources/offer_remote_datasource.dart';
import 'features/offers/data/repositories/offer_repository_impl.dart';
import 'features/offers/domain/repositories/offer_repository.dart';
import 'features/offers/presentation/bloc/offers_bloc.dart';
import 'features/broadcast/data/datasources/broadcast_remote_datasource.dart';
import 'features/broadcast/data/repositories/broadcast_repository_impl.dart';
import 'features/broadcast/domain/repositories/broadcast_repository.dart';
import 'features/broadcast/presentation/bloc/broadcast_bloc.dart';
import 'features/audit_logs/data/datasources/audit_log_remote_datasource.dart';
import 'features/audit_logs/data/repositories/audit_log_repository_impl.dart';
import 'features/audit_logs/domain/repositories/audit_log_repository.dart';
import 'features/audit_logs/presentation/bloc/audit_logs_bloc.dart';
import 'features/categories/data/datasources/category_remote_datasource.dart';
import 'features/categories/data/repositories/category_repository_impl.dart';
import 'features/categories/domain/repositories/category_repository.dart';
import 'features/categories/presentation/bloc/categories_bloc.dart';
import 'features/coupons/data/datasources/coupon_remote_datasource.dart';
import 'features/coupons/data/repositories/coupon_repository_impl.dart';
import 'features/coupons/domain/repositories/coupon_repository.dart';
import 'features/coupons/presentation/bloc/coupons_bloc.dart';
import 'features/upload/domain/repositories/upload_repository.dart';
import 'features/upload/data/datasources/upload_remote_datasource.dart';
import 'features/upload/data/repositories/upload_repository_impl.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // Features - Auth
  // AuthBloc is a lazy singleton so that main.dart can dispatch CheckAuthEvent
  // to the same instance that MultiBlocProvider exposes to the widget tree.
  sl.registerLazySingleton(() => AuthBloc(repository: sl()));
  sl.registerFactory(() => DashboardBloc(repository: sl()));

  //! Features - Merchants
  // Bloc
  sl.registerFactory(() => MerchantsBloc(repository: sl()));
  sl.registerFactory(() => UsersBloc(repository: sl()));
  sl.registerFactory(() => OffersBloc(repository: sl()));
  sl.registerFactory(() => BroadcastBloc(repository: sl()));
  sl.registerFactory(() => AuditLogsBloc(repository: sl()));
  sl.registerFactory(() => CategoriesBloc(repository: sl()));
  sl.registerFactory(() => CouponsBloc(repository: sl()));

  // Repository
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteDataSource: sl(), prefs: sl()),
  );
  sl.registerLazySingleton<DashboardRepository>(
    () => DashboardRepositoryImpl(remoteDataSource: sl()),
  );

  sl.registerLazySingleton<MerchantRepository>(
    () => MerchantRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<UserRepository>(
    () => UserRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<OfferRepository>(
    () => OfferRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<BroadcastRepository>(
    () => BroadcastRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<AuditLogRepository>(
    () => AuditLogRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<CategoryRepository>(
    () => CategoryRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<CouponRepository>(
    () => CouponRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton<UploadRepository>(
    () => UploadRepositoryImpl(remoteDataSource: sl()),
  );
  sl.registerLazySingleton(() => UploadUseCase(sl()));

  // Data sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(client: sl()),
  );
  sl.registerLazySingleton<DashboardRemoteDataSource>(
    () => DashboardRemoteDataSourceImpl(client: sl()),
  );

  sl.registerLazySingleton<MerchantRemoteDataSource>(
    () => MerchantRemoteDataSourceImpl(client: sl()),
  );
  sl.registerLazySingleton<UserRemoteDataSource>(
    () => UserRemoteDataSourceImpl(client: sl()),
  );
  sl.registerLazySingleton<OfferRemoteDataSource>(
    () => OfferRemoteDataSourceImpl(client: sl()),
  );
  sl.registerLazySingleton<BroadcastRemoteDataSource>(
    () => BroadcastRemoteDataSourceImpl(client: sl()),
  );
  sl.registerLazySingleton<AuditLogRemoteDataSource>(
    () => AuditLogRemoteDataSourceImpl(client: sl()),
  );
  sl.registerLazySingleton<CategoryRemoteDataSource>(
    () => CategoryRemoteDataSourceImpl(client: sl()),
  );
  sl.registerLazySingleton<CouponRemoteDataSource>(
    () => CouponRemoteDataSourceImpl(client: sl()),
  );
  sl.registerLazySingleton<UploadRemoteDataSource>(
    () => UploadRemoteDataSourceImpl(client: sl()),
  );

  //! Core
  sl.registerLazySingleton(() => ApiClient(sl(), sl()));
  sl.registerLazySingleton(() => NotificationService());
  sl.registerLazySingleton(() => RealtimeService(sl()));

  // External
  final sharedPreferences = await SharedPreferences.getInstance();
  sl.registerLazySingleton(() => sharedPreferences);
  sl.registerLazySingleton(() => Dio());
}
