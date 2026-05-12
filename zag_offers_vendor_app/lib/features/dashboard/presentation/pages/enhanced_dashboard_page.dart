import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_theme.dart';
import '../../../../../core/widgets/stat_card.dart';
import '../../../../../core/widgets/glass_card.dart';
import '../../../../../core/widgets/notification_bubble.dart';
import '../../../../../core/widgets/sparkline_chart.dart';
import '../bloc/dashboard_bloc.dart';
import '../../data/models/dashboard_stats_model.dart';

class EnhancedDashboardPage extends StatefulWidget {
  const EnhancedDashboardPage({super.key});

  @override
  State<EnhancedDashboardPage> createState() => _EnhancedDashboardPageState();
}

class _EnhancedDashboardPageState extends State<EnhancedDashboardPage>
    with TickerProviderStateMixin {
  late AnimationController _backgroundController;
  late AnimationController _statsController;
  late AnimationController _actionController;
  
  final List<NotificationData> _notifications = [];
  bool _isRefreshing = false;
  String _lastUpdated = '';

  @override
  void initState() {
    super.initState();
    
    _backgroundController = AnimationController(
      duration: const Duration(seconds: 20),
      vsync: this,
    )..repeat();
    
    _statsController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _actionController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _loadData();
    _updateTimestamp();
  }

  @override
  void dispose() {
    _backgroundController.dispose();
    _statsController.dispose();
    _actionController.dispose();
    super.dispose();
  }

  void _loadData() {
    _statsController.forward();
    _actionController.forward();
    context.read<DashboardBloc>().add(GetDashboardStatsRequested());
  }

  void _updateTimestamp() {
    setState(() {
      _lastUpdated = DateTime.now().toString().substring(11, 16);
    });
  }

  Future<void> _refreshData() async {
    setState(() {
      _isRefreshing = true;
    });
    
    _loadData();
    _updateTimestamp();
    
    await Future.delayed(const Duration(milliseconds: 800));
    
    setState(() {
      _isRefreshing = false;
    });
  }

  void _showNotification(String title, String body, {String? type}) {
    setState(() {
      _notifications.add(
        NotificationData(
          title: title,
          body: body,
          type: type,
          onClose: () {
            setState(() {
              _notifications.removeLast();
            });
          },
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: NotificationOverlay(
        notifications: _notifications,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    return Stack(
      children: [
        // Background decorations
        _buildBackground(),
        
        // Main content
        SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 32),
                _buildStatsGrid(),
                const SizedBox(height: 40),
                _buildQuickActions(),
                const SizedBox(height: 40),
                _buildInsightsSection(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBackground() {
    return AnimatedBuilder(
      animation: _backgroundController,
      builder: (context, child) {
        return Stack(
          children: [
            Positioned(
              top: -200,
              right: -200,
              child: AnimatedContainer(
                duration: const Duration(seconds: 20),
                transform: Matrix4.rotationZ(_backgroundController.value * 0.1),
                child: Container(
                  width: 600,
                  height: 600,
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: Alignment.bottomLeft,
                      radius: 1.5,
                      colors: [
                        AppColors.secondary.withOpacity(0.05),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: -150,
              left: -150,
              child: AnimatedContainer(
                duration: const Duration(seconds: 15),
                transform: Matrix4.rotationZ(-_backgroundController.value * 0.08),
                child: Container(
                  width: 500,
                  height: 500,
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withValues(alpha: 0.05),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.secondary.withValues(alpha: 0.2),
                        blurRadius: 120,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Status indicator
        AnimatedBuilder(
          animation: _statsController,
          builder: (context, child) {
            return FadeTransition(
              opacity: _statsController,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(-1, 0),
                  end: Offset.zero,
                ).animate(CurvedAnimation(
                  parent: _statsController,
                  curve: Curves.easeOutBack,
                )),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.glassBackground,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.glassBorder,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'المتجر نشط الآن',
                        style: AppTheme.small.copyWith(
                          color: AppColors.textDimmer,
                          letterSpacing: 0.5,
                        ),
                      ),
                      if (_lastUpdated.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        Text(
                          '• تحديث $_lastUpdated',
                          style: AppTheme.small.copyWith(
                            color: AppColors.textDimmer,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                      if (_isRefreshing) ...[
                        const SizedBox(width: 8),
                        SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation(AppColors.primary),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            );
          },
        ),
        
        const SizedBox(height: 16),
        
        // Welcome message
        Text(
          'مرحباً بك،\nمتجر زاچ',
          style: AppTheme.heading1.copyWith(
            fontSize: 42,
            height: 1.2,
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Action buttons
        Row(
          children: [
            Expanded(
              child: GlassButton(
                onPressed: _refreshData,
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.add, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'إضافة عرض',
                      style: AppTheme.body.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 16),
            GlassButton(
              onPressed: _refreshData,
              padding: const EdgeInsets.all(16),
              child: Icon(
                _isRefreshing ? Icons.refresh : Icons.refresh,
                color: AppColors.text,
                size: 24,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatsGrid() {
    return BlocBuilder<DashboardBloc, DashboardState>(
      builder: (context, state) {
        if (state is DashboardLoading) {
          return _buildLoadingStats();
        }
        
        if (state is DashboardLoaded) {
          return _buildStatsCards(state.stats);
        }
        
        return _buildLoadingStats();
      },
    );
  }

  Widget _buildLoadingStats() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.2,
      children: List.generate(4, (index) {
        return StatCard(
          label: '...',
          value: '...',
          icon: Icons.analytics,
          color: AppColors.textDimmer,
          bgColor: AppColors.glassBackground,
          loading: true,
          index: index,
        );
      }),
    );
  }

  Widget _buildStatsCards(DashboardStats stats) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.2,
      children: [
        StatCard(
          label: 'نشاط اليوم',
          value: (stats.claimsToday ?? 0).toString(),
          icon: Icons.local_activity,
          color: AppColors.primary,
          bgColor: AppColors.primary.withOpacity(0.1),
          trend: '+15%',
          index: 0,
        ),
        StatCard(
          label: 'الزيارات',
          value: '0', // Placeholder until API provides views data
          icon: Icons.visibility,
          color: AppColors.blue,
          bgColor: AppColors.blue.withOpacity(0.1),
          trend: '+8%',
          index: 1,
        ),
        StatCard(
          label: 'عروض نشطة',
          value: (stats.activeOffers ?? 0).toString(),
          icon: Icons.star,
          color: AppColors.secondary,
          bgColor: AppColors.secondary.withOpacity(0.1),
          index: 2,
        ),
        StatCard(
          label: 'قاعدة العملاء',
          value: (stats.totalClaims ?? 0).toString(),
          icon: Icons.people,
          color: AppColors.purple,
          bgColor: AppColors.purple.withOpacity(0.1),
          trend: '+12%',
          index: 3,
        ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'الإجراءات السريعة',
          style: AppTheme.title.copyWith(
            color: AppColors.text,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1,
          children: [
            _buildActionButton(
              'العروض',
              Icons.local_offer,
              AppColors.emerald,
              () {},
            ),
            _buildActionButton(
              'مسح الكود',
              Icons.qr_code_scanner,
              AppColors.primary,
              () {},
            ),
            _buildActionButton(
              'الكوبونات',
              Icons.receipt_long,
              AppColors.purple,
              () {},
            ),
            _buildActionButton(
              'الملف',
              Icons.store,
              AppColors.blue,
              () {},
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return AnimatedBuilder(
      animation: _actionController,
      builder: (context, child) {
        return FadeTransition(
          opacity: _actionController,
          child: ScaleTransition(
            scale: Tween<double>(
              begin: 0.8,
              end: 1.0,
            ).animate(CurvedAnimation(
              parent: _actionController,
              curve: Curves.elasticOut,
            )),
            child: GlassCard(
              onTap: onTap,
              padding: const EdgeInsets.all(16),
              borderRadius: 24,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      icon,
                      color: color,
                      size: 24,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    label,
                    style: AppTheme.caption.copyWith(
                      color: AppColors.text,
                      fontWeight: FontWeight.w900,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildInsightsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'الرؤى والتحليلات',
          style: AppTheme.title.copyWith(
            color: AppColors.text,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildTopOffers()),
            const SizedBox(width: 16),
            Expanded(child: _buildActivityFeed()),
          ],
        ),
      ],
    );
  }

  Widget _buildTopOffers() {
    return GlassContainer(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.secondary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.trending_up,
                  color: AppColors.secondary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'الأكثر تأثيراً',
                      style: AppTheme.body.copyWith(
                        color: AppColors.text,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      'أعلى العروض تفاعلاً',
                      style: AppTheme.caption.copyWith(
                        color: AppColors.textDimmer,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Placeholder for top offers
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: AppColors.glassBackground,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.glassBorder,
                width: 1,
              ),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.analytics_outlined,
                    color: AppColors.textDimmer,
                    size: 48,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'ابدأ بإضافة عروضك',
                    style: AppTheme.caption.copyWith(
                      color: AppColors.textDimmer,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityFeed() {
    return GlassContainer(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.analytics,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'النشاط المباشر',
                      style: AppTheme.body.copyWith(
                        color: AppColors.text,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Placeholder for activity feed
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: AppColors.glassBackground,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppColors.glassBorder,
                width: 1,
              ),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history,
                    color: AppColors.textDimmer,
                    size: 48,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'بانتظار تفاعل العملاء',
                    style: AppTheme.caption.copyWith(
                      color: AppColors.textDimmer,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
