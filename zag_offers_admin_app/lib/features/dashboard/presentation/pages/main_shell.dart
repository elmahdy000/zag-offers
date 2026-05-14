import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_iconly/flutter_iconly.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:zag_offers_admin_app/core/theme/app_colors.dart';
import 'package:zag_offers_admin_app/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:zag_offers_admin_app/features/merchants/presentation/pages/merchants_page.dart';
import 'package:zag_offers_admin_app/features/offers/presentation/pages/offers_page.dart';
import 'package:zag_offers_admin_app/features/coupons/presentation/pages/coupons_page.dart';
import 'package:zag_offers_admin_app/features/broadcast/presentation/pages/broadcast_page.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  static _MainShellState? of(BuildContext context) {
    return context.findAncestorStateOfType<_MainShellState>();
  }

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;

  void setSelectedIndex(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  late final List<Widget> _pages;
  
  @override
  void initState() {
    super.initState();
    _pages = [
      DashboardPage(onTabSelected: (index) => _onItemTapped(index)),
      const MerchantsPage(),
      const OffersPage(),
      const CouponsPage(),
      const BroadcastPage(),
    ];
  }

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true, // Allow body to flow behind the floating bottom bar
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      height: 72,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, IconlyLight.home, IconlyBold.home, 'الرئيسية'),
                _buildNavItem(1, IconlyLight.buy, IconlyBold.buy, 'التجار'),
                _buildNavItem(2, IconlyLight.discount, IconlyBold.discount, 'العروض'),
                _buildNavItem(3, IconlyLight.ticket, IconlyBold.ticket, 'الكوبونات'),
                _buildNavItem(4, IconlyLight.send, IconlyBold.send, 'البث'),
              ],
            ),
          ),
        ),
      ),
    ).animate().slideY(begin: 1, duration: 600.ms, curve: Curves.easeOutQuart);
  }

  Widget _buildNavItem(int index, IconData icon, IconData activeIcon, String label) {
    final isSelected = _selectedIndex == index;
    final color = isSelected ? AppColors.primary : AppColors.textSecondary.withValues(alpha: 0.6);

    return Expanded(
      child: InkWell(
        onTap: () => _onItemTapped(index),
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                isSelected ? activeIcon : icon,
                color: color,
                size: 22,
              ),
            ),
            const SizedBox(height: 4),
            if (isSelected)
              Text(
                label,
                style: GoogleFonts.cairo(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ).animate().fadeIn().moveY(begin: 4, end: 0),
          ],
        ),
      ),
    );
  }
}
