import 'dart:async';
import 'package:flutter/material.dart';

class FlashSaleBadge extends StatefulWidget {
  final DateTime endsAt;

  const FlashSaleBadge({super.key, required this.endsAt});

  @override
  State<FlashSaleBadge> createState() => _FlashSaleBadgeState();
}

class _FlashSaleBadgeState extends State<FlashSaleBadge> {
  late Timer _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _updateTime());
  }

  void _updateTime() {
    final now = DateTime.now();
    setState(() {
      _remaining = widget.endsAt.isAfter(now) 
          ? widget.endsAt.difference(now) 
          : Duration.zero;
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    if (d.inSeconds <= 0) return 'انتهى العرض';
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(d.inHours);
    final minutes = twoDigits(d.inMinutes.remainder(60));
    final seconds = twoDigits(d.inSeconds.remainder(60));
    return '$hours:$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final isFinished = _remaining.inSeconds <= 0;
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: isFinished ? Colors.grey.shade800 : Colors.redAccent,
        borderRadius: BorderRadius.circular(6),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 4,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.flash_on, color: Colors.white, size: 10),
          const SizedBox(width: 2),
          Text(
            _formatDuration(_remaining),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 10,
              fontFamily: 'Tajawal',
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
