import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../injection_container.dart';

class ZagRewardsPage extends StatefulWidget {
  final int points;
  final String tier;
  final String userName;

  const ZagRewardsPage({
    super.key,
    required this.points,
    required this.tier,
    required this.userName,
  });

  @override
  State<ZagRewardsPage> createState() => _ZagRewardsPageState();
}

class _ZagRewardsPageState extends State<ZagRewardsPage> with SingleTickerProviderStateMixin {
  late int _points;
  late String _tier;
  List<dynamic> _history = [];
  bool _isLoading = true;
  String? _error;
  
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _points = widget.points;
    _tier = widget.tier;
    
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    
    _fetchRewardsData();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _fetchRewardsData() async {
    try {
      final dio = sl<ApiClient>().dio;
      final profileRes = await dio.get('/auth/me');
      final historyRes = await dio.get('/users/points-history');
      
      if (mounted) {
        setState(() {
          _points = profileRes.data['points'] ?? widget.points;
          _tier = profileRes.data['tier'] ?? widget.tier;
          _history = historyRes.data ?? [];
          _isLoading = false;
        });
        _animationController.forward();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'تعذر تحميل بيانات النقاط';
          _isLoading = false;
        });
        _animationController.forward();
      }
    }
  }

  int _getNextTierPoints() {
    if (_points < 500) return 500;
    if (_points < 2000) return 2000;
    if (_points < 5000) return 5000;
    return 5000; // maxed out
  }

  String _getNextTierName() {
    if (_points < 500) return 'SILVER';
    if (_points < 2000) return 'GOLD';
    if (_points < 5000) return 'PLATINUM';
    return 'PLATINUM';
  }
  
  double _getProgress() {
    if (_points >= 5000) return 1.0;
    
    int currentTierBase = 0;
    int nextTierTarget = 500;
    
    if (_points >= 2000) {
      currentTierBase = 2000;
      nextTierTarget = 5000;
    } else if (_points >= 500) {
      currentTierBase = 500;
      nextTierTarget = 2000;
    }
    
    final range = nextTierTarget - currentTierBase;
    final current = _points - currentTierBase;
    return (current / range).clamp(0.0, 1.0);
  }

  Color _getTierColor(String tier, bool isDark) {
    switch (tier.toUpperCase()) {
      case 'PLATINUM':
        return isDark ? const Color(0xFFE5E4E2) : const Color(0xFF444444);
      case 'GOLD':
        return const Color(0xFFFFD700);
      case 'SILVER':
        return const Color(0xFFC0C0C0);
      case 'BRONZE':
      default:
        return const Color(0xFFCD7F32);
    }
  }
  
  String _getReasonArabic(String reason) {
    switch(reason) {
      case 'COUPON_GENERATE': return 'إصدار كوبون';
      case 'COUPON_REDEEM': return 'استخدام كوبون';
      case 'REVIEW_ADDED': return 'إضافة تقييم';
      case 'WELCOME_BONUS': return 'هدية ترحيبية';
      default: return reason;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final tierColor = _getTierColor(_tier, isDark);
    
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Zag Rewards', style: TextStyle(fontWeight: FontWeight.w900)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      extendBodyBehindAppBar: true,
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : _error != null
          ? Center(child: Text(_error!))
          : FadeTransition(
              opacity: _fadeAnimation,
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 100, 24, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildPremiumCard(tierColor, isDark),
                          const SizedBox(height: 32),
                          _buildProgressSection(tierColor, isDark),
                        ],
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    sliver: SliverToBoxAdapter(
                      child: Text(
                        'سجل النقاط',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 40),
                    sliver: _history.isEmpty
                      ? SliverToBoxAdapter(
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.all(40),
                              child: Text(
                                'لا يوجد سجل للنقاط بعد.',
                                style: TextStyle(color: theme.hintColor),
                              ),
                            ),
                          ),
                        )
                      : SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final item = _history[index];
                              return _buildHistoryItem(item, isDark);
                            },
                            childCount: _history.length,
                          ),
                        ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildPremiumCard(Color tierColor, bool isDark) {
    return Container(
      height: 220,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        gradient: LinearGradient(
          colors: isDark 
              ? [const Color(0xFF1E1E1E), const Color(0xFF2C2C2C)]
              : [const Color(0xFF1A1A1A), const Color(0xFF333333)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: tierColor.withValues(alpha: 0.3),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
        ],
        border: Border.all(
          color: tierColor.withValues(alpha: 0.5),
          width: 1.5,
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -30,
            top: -30,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    tierColor.withValues(alpha: 0.2),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(30),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.userName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    Icon(
                      Icons.workspace_premium_rounded,
                      color: tierColor,
                      size: 32,
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _tier.toUpperCase(),
                      style: TextStyle(
                        color: tierColor,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          NumberFormat('#,###').format(_points),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 48,
                            fontWeight: FontWeight.w900,
                            height: 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Padding(
                          padding: EdgeInsets.only(bottom: 6),
                          child: Text(
                            'pts',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSection(Color tierColor, bool isDark) {
    if (_points >= 5000) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: themeColor(isDark)),
        ),
        child: const Column(
          children: [
            Icon(Icons.stars_rounded, color: Color(0xFFE5E4E2), size: 48),
            SizedBox(height: 16),
            Text(
              'أنت في أعلى مستوى!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );
    }
    
    final progress = _getProgress();
    final nextTier = _getNextTierName();
    final nextTierPoints = _getNextTierPoints();
    final nextTierColor = _getTierColor(nextTier, isDark);
    final remaining = nextTierPoints - _points;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: themeColor(isDark)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'التقدم لـ $nextTier',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                'باقي $remaining نقطة',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 12,
              backgroundColor: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF0F0F0),
              valueColor: AlwaysStoppedAnimation<Color>(nextTierColor),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem(dynamic item, bool isDark) {
    final amount = item['amount'] as int;
    final reason = item['reason'] as String;
    final date = DateTime.parse(item['createdAt']).toLocal();
    final isPositive = amount > 0;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: themeColor(isDark)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isPositive ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPositive ? Icons.add_rounded : Icons.remove_rounded,
              color: isPositive ? Colors.green : Colors.red,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getReasonArabic(reason),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  DateFormat('dd MMM yyyy, hh:mm a').format(date),
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).hintColor,
                  ),
                ),
              ],
            ),
          ),
          Text(
            '${isPositive ? '+' : ''}$amount',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: isPositive ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Color themeColor(bool isDark) => isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05);
}
