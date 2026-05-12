import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class SparklineChart extends StatelessWidget {
  final Color color;
  final double? trend;
  final List<double>? data;
  final double height;
  final double width;

  const SparklineChart({
    super.key,
    required this.color,
    this.trend,
    this.data,
    this.height = 40,
    this.width = 96,
  });

  @override
  Widget build(BuildContext context) {
    final points = data ?? _generateDefaultPoints();
    
    return SizedBox(
      width: width,
      height: height,
      child: CustomPaint(
        painter: SparklinePainter(
          points: points,
          color: color,
        ),
      ),
    );
  }

  List<double> _generateDefaultPoints() {
    return [30, 35, 25, 45, 30, 50, 40];
  }
}

class SparklinePainter extends CustomPainter {
  final List<double> points;
  final Color color;

  SparklinePainter({
    required this.points,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final paint = Paint()
      ..color = color.withValues(alpha: 0.4)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final gradientPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          color.withValues(alpha: 0.2),
          color.withValues(alpha: 0.0),
        ],
        stops: const [0.0, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    final path = Path();
    final fillPath = Path();

    final spacing = size.width / (points.length - 1);
    final maxValue = points.reduce((a, b) => a > b ? a : b);
    final minValue = points.reduce((a, b) => a < b ? a : b);
    final range = maxValue - minValue;

    for (int i = 0; i < points.length; i++) {
      final x = i * spacing;
      final y = size.height - ((points[i] - minValue) / range) * size.height;

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }

    // Complete the fill path
    fillPath.lineTo(size.width, size.height);
    fillPath.lineTo(0, size.height);
    fillPath.close();

    // Draw fill
    canvas.drawPath(fillPath, gradientPaint);

    // Draw line
    canvas.drawPath(path, paint);

    // Draw points
    final pointPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    for (int i = 0; i < points.length; i++) {
      final x = i * spacing;
      final y = size.height - ((points[i] - minValue) / range) * size.height;
      
      canvas.drawCircle(
        Offset(x, y),
        3,
        pointPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class AnimatedSparklineChart extends StatefulWidget {
  final Color color;
  final double? trend;
  final List<double>? data;
  final double height;
  final double width;

  const AnimatedSparklineChart({
    super.key,
    required this.color,
    this.trend,
    this.data,
    this.height = 40,
    this.width = 96,
  });

  @override
  State<AnimatedSparklineChart> createState() => _AnimatedSparklineChartState();
}

class _AnimatedSparklineChartState extends State<AnimatedSparklineChart>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _animation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return SizedBox(
          width: widget.width,
          height: widget.height,
          child: CustomPaint(
            painter: AnimatedSparklinePainter(
              points: widget.data ?? _generateDefaultPoints(),
              color: widget.color,
              progress: _animation.value,
            ),
          ),
        );
      },
    );
  }

  List<double> _generateDefaultPoints() {
    return [30, 35, 25, 45, 30, 50, 40];
  }
}

class AnimatedSparklinePainter extends CustomPainter {
  final List<double> points;
  final Color color;
  final double progress;

  AnimatedSparklinePainter({
    required this.points,
    required this.color,
    required this.progress,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty || progress == 0) return;

    final paint = Paint()
      ..color = color.withValues(alpha: 0.4 * progress)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final gradientPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          color.withValues(alpha: 0.2 * progress),
          color.withValues(alpha: 0.0),
        ],
        stops: const [0.0, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    final path = Path();
    final fillPath = Path();

    final spacing = size.width / (points.length - 1);
    final maxValue = points.reduce((a, b) => a > b ? a : b);
    final minValue = points.reduce((a, b) => a < b ? a : b);
    final range = maxValue - minValue;

    final pointsToShow = (points.length * progress).ceil();

    for (int i = 0; i < pointsToShow; i++) {
      final x = i * spacing;
      final y = size.height - ((points[i] - minValue) / range) * size.height;

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }

    // Complete the fill path
    fillPath.lineTo(size.width, size.height);
    fillPath.lineTo(0, size.height);
    fillPath.close();

    // Draw fill
    canvas.drawPath(fillPath, gradientPaint);

    // Draw line
    canvas.drawPath(path, paint);

    // Draw points
    final pointPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    for (int i = 0; i < pointsToShow; i++) {
      final x = i * spacing;
      final y = size.height - ((points[i] - minValue) / range) * size.height;
      
      canvas.drawCircle(
        Offset(x, y),
        3,
        pointPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
