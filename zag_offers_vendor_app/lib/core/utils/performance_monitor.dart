import 'dart:developer' as developer;

class PerformanceMetric {
  final String type;
  final double value;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  PerformanceMetric({
    required this.type,
    required this.value,
    required this.timestamp,
    this.metadata,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'value': value,
      'timestamp': timestamp.toIso8601String(),
      'metadata': metadata,
    };
  }
}

class PerformanceMonitor {
  static final List<PerformanceMetric> _metrics = [];
  static const int _maxMetrics = 100;

  // Log performance metric (React app compatibility)
  static void log(String type, String name, double value, {Map<String, dynamic>? metadata}) {
    final metric = PerformanceMetric(
      type: type,
      value: value,
      timestamp: DateTime.now(),
      metadata: {...?metadata, 'name': name},
    );

    _metrics.add(metric);
    
    // Keep only recent metrics
    if (_metrics.length > _maxMetrics) {
      _metrics.removeAt(0);
    }

    developer.log('Performance: $type - $name: ${value.toStringAsFixed(2)}ms', name: 'Performance');
  }

  // Get all metrics
  static List<PerformanceMetric> getMetrics() {
    return List.unmodifiable(_metrics);
  }

  // Get metrics by type
  static List<PerformanceMetric> getMetricsByType(String type) {
    return _metrics.where((metric) => metric.type == type).toList();
  }

  // Get API latency metrics
  static List<PerformanceMetric> getApiLatencyMetrics() {
    return getMetricsByType('API_LATENCY');
  }

  // Get average latency
  static double? getAverageLatency() {
    final latencyMetrics = getApiLatencyMetrics();
    if (latencyMetrics.isEmpty) return null;
    
    final total = latencyMetrics.fold<double>(0, (sum, metric) => sum + metric.value);
    return total / latencyMetrics.length;
  }

  // Get performance summary
  static Map<String, dynamic> getPerformanceSummary() {
    final allMetrics = getMetrics();
    final latencyMetrics = getApiLatencyMetrics();
    
    return {
      'totalMetrics': allMetrics.length,
      'averageLatency': getAverageLatency(),
      'slowestRequest': latencyMetrics.isNotEmpty 
        ? latencyMetrics.reduce((a, b) => a.value > b.value ? a : b).value 
        : null,
      'fastestRequest': latencyMetrics.isNotEmpty 
        ? latencyMetrics.reduce((a, b) => a.value < b.value ? a : b).value 
        : null,
      'timestamp': DateTime.now().toIso8601String(),
    };
  }

  // Clear all metrics
  static void clearMetrics() {
    _metrics.clear();
  }

  // Start timing
  static Stopwatch startTimer() {
    return Stopwatch()..start();
  }

  // End timing and log
  static void endTimer(Stopwatch stopwatch, String name, {String type = 'API_LATENCY'}) {
    stopwatch.stop();
    log(type, name, stopwatch.elapsedMilliseconds.toDouble());
  }
}
