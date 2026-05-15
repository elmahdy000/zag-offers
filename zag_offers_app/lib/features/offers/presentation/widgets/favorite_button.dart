import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../auth/data/datasources/auth_local_data_source.dart';
import '../../../../injection_container.dart' as di;
import '../../../favorites/presentation/bloc/favorites_bloc.dart';
import '../../../../core/utils/snackbar_utils.dart';

class FavoriteButton extends StatelessWidget {
  final String offerId;
  final double size;

  const FavoriteButton({
    super.key,
    required this.offerId,
    this.size = 20,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FavoritesBloc, FavoritesState>(
      builder: (context, state) {
        bool isFavorited = false;
        if (state is FavoritesLoaded) {
          isFavorited = state.favorites.any((o) => o.id == offerId);
        }
        
        return GestureDetector(
          onTap: () async {
            final authLocal = di.sl<AuthLocalDataSource>();
            final token = await authLocal.getToken();
            
            if (token == null || token.isEmpty) {
              if (!context.mounted) return;
              SnackBarUtils.showInfo(context, 'يجب تسجيل الدخول لإضافة العروض للمفضلة');
              return;
            }
            
            if (!context.mounted) return;
            HapticFeedback.mediumImpact();
            context.read<FavoritesBloc>().add(ToggleFavorite(offerId));
          },
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              shape: BoxShape.circle,
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
            ),
            child: Icon(
              isFavorited ? Icons.favorite_rounded : Icons.favorite_outline_rounded,
              color: isFavorited ? Colors.red : Colors.grey,
              size: size,
            ),
          ),
        );
      },
    );
  }
}
