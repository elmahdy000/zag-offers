import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../auth/data/datasources/auth_local_data_source.dart';
import '../../../../injection_container.dart' as di;
import '../../../favorites/presentation/bloc/favorites_bloc.dart';
import '../../../../core/utils/snackbar_utils.dart';

class FavoriteButton extends StatefulWidget {
  final String offerId;
  final double size;

  const FavoriteButton({
    super.key,
    required this.offerId,
    this.size = 20,
  });

  @override
  State<FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends State<FavoriteButton> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  bool _wasFavorited = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.3).chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.3, end: 1.0).chain(CurveTween(curve: Curves.easeIn)),
        weight: 50,
      ),
    ]).animate(_controller);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<FavoritesBloc, FavoritesState>(
      buildWhen: (_, next) => next is FavoritesLoaded,
      builder: (context, state) {
        bool isFavorited = false;
        if (state is FavoritesLoaded) {
          isFavorited = state.favorites.any((o) => o.id == widget.offerId);
        }
        
        if (isFavorited && !_wasFavorited) {
          _controller.forward(from: 0.0);
        }
        _wasFavorited = isFavorited;
        
        return ScaleTransition(
          scale: _scaleAnimation,
          child: GestureDetector(
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
              context.read<FavoritesBloc>().add(ToggleFavorite(widget.offerId));
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
                size: widget.size,
              ),
            ),
          ),
        );
      },
    );
  }
}
