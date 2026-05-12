import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';

class NotificationBubble extends StatelessWidget {
  final String title;
  final String body;
  final String? type;
  final VoidCallback? onTap;
  final VoidCallback? onClose;

  const NotificationBubble({
    super.key,
    required this.title,
    required this.body,
    this.type,
    this.onTap,
    this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final isSuccess = type == 'success';
    final isError = type == 'error';
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: AppTheme.glassHeavy,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(40),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              isSuccess 
                  ? AppColors.success.withOpacity(0.1)
                  : isError 
                      ? AppColors.error.withOpacity(0.1)
                      : AppColors.primary.withOpacity(0.1),
              Colors.transparent,
            ],
          ),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: isSuccess 
                    ? AppColors.success.withValues(alpha: 0.2)
                    : isError 
                        ? AppColors.error.withValues(alpha: 0.2)
                        : AppColors.primary.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                isSuccess 
                    ? Icons.check_circle
                    : isError 
                        ? Icons.error
                        : Icons.notifications,
                color: isSuccess 
                    ? AppColors.success
                    : isError 
                        ? AppColors.error
                        : AppColors.primary,
                size: 28,
              ),
            ),
            
            const SizedBox(width: 16),
            
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTheme.title.copyWith(
                      color: AppColors.text,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    body,
                    style: AppTheme.body.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            
            const SizedBox(width: 16),
            
            // Close button
            if (onClose != null)
              GestureDetector(
                onTap: onClose,
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.glassBackground,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.glassBorder,
                      width: 1,
                    ),
                  ),
                  child: Icon(
                    Icons.close,
                    color: AppColors.textDimmer,
                    size: 16,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class NotificationOverlay extends StatefulWidget {
  final Widget child;
  final List<NotificationData> notifications;

  const NotificationOverlay({
    super.key,
    required this.child,
    required this.notifications,
  });

  @override
  State<NotificationOverlay> createState() => _NotificationOverlayState();
}

class _NotificationOverlayState extends State<NotificationOverlay>
    with TickerProviderStateMixin {
  late AnimationController _slideController;
  late AnimationController _fadeController;
  
  @override
  void initState() {
    super.initState();
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    
    if (widget.notifications.isNotEmpty) {
      _showNotifications();
    }
  }
  
  @override
  void didUpdateWidget(NotificationOverlay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.notifications.isNotEmpty && oldWidget.notifications.isEmpty) {
      _showNotifications();
    } else if (widget.notifications.isEmpty && oldWidget.notifications.isNotEmpty) {
      _hideNotifications();
    }
  }
  
  @override
  void dispose() {
    _slideController.dispose();
    _fadeController.dispose();
    super.dispose();
  }
  
  void _showNotifications() {
    _fadeController.forward();
    _slideController.forward();
  }
  
  void _hideNotifications() {
    _fadeController.reverse();
    _slideController.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        widget.child,
        
        // Notifications overlay
        if (widget.notifications.isNotEmpty)
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 0,
            right: 0,
            child: FadeTransition(
              opacity: _fadeController,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0, -1),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: _slideController,
                  curve: Curves.easeOutBack,
                )),
                child: Column(
                  children: widget.notifications.map((notification) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: NotificationBubble(
                        title: notification.title,
                        body: notification.body,
                        type: notification.type,
                        onTap: notification.onTap,
                        onClose: notification.onClose,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class NotificationData {
  final String title;
  final String body;
  final String? type;
  final VoidCallback? onTap;
  final VoidCallback? onClose;

  NotificationData({
    required this.title,
    required this.body,
    this.type,
    this.onTap,
    this.onClose,
  });
}
