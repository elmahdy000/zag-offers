import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class FilterBottomSheet extends StatefulWidget {
  final String selectedArea;
  final double minDiscount;
  final String sortBy;
  final List<String> availableAreas;

  const FilterBottomSheet({
    super.key,
    required this.selectedArea,
    required this.minDiscount,
    required this.sortBy,
    required this.availableAreas,
  });

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  late String _currentArea;
  late double _currentDiscount;
  late String _currentSort;

  final List<Map<String, String>> _sortOptions = const [
    {'label': 'الأحدث', 'value': 'newest'},
    {'label': 'أعلى خصم', 'value': 'highest_discount'},
    {'label': 'الأعلى تقييمًا', 'value': 'highest_rating'},
  ];

  @override
  void initState() {
    super.initState();
    _currentArea = widget.selectedArea;
    _currentDiscount = widget.minDiscount;
    _currentSort = widget.sortBy;
  }

  void _reset() {
    setState(() {
      _currentArea = 'الكل';
      _currentDiscount = 0;
      _currentSort = 'newest';
    });
  }

  @override
  Widget build(BuildContext context) {
    final areas = widget.availableAreas.isEmpty
        ? const ['الكل']
        : widget.availableAreas;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'تصفية النتائج',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                TextButton(
                  onPressed: _reset,
                  child: const Text('إعادة التعيين'),
                ),
              ],
            ),
            const SizedBox(height: 28),
            Text(
              'المنطقة',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 45,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: areas.length,
                itemBuilder: (context, index) {
                  final area = areas[index];
                  final isSelected = _currentArea == area;
                  return Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: ChoiceChip(
                      label: Text(area),
                      selected: isSelected,
                      onSelected: (_) => setState(() => _currentArea = area),
                      selectedColor: AppColors.primary,
                      labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color:
                            isSelected ? Colors.white : AppColors.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                      backgroundColor: Colors.grey[100],
                      showCheckmark: false,
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 28),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'الحد الأدنى للخصم',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  '${_currentDiscount.toInt()}%+',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            Slider(
              value: _currentDiscount,
              min: 0,
              max: 90,
              divisions: 9,
              activeColor: AppColors.primary,
              onChanged: (value) => setState(() => _currentDiscount = value),
            ),
            const SizedBox(height: 20),
            Text(
              'الترتيب',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _sortOptions.map((option) {
                final isSelected = _currentSort == option['value'];
                return ChoiceChip(
                  label: Text(option['label']!),
                  selected: isSelected,
                  onSelected: (_) {
                    setState(() => _currentSort = option['value']!);
                  },
                  selectedColor: AppColors.primary.withValues(alpha: 0.12),
                  labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.textPrimary,
                    fontWeight: FontWeight.bold,
                  ),
                  side: isSelected
                      ? const BorderSide(color: AppColors.primary)
                      : BorderSide.none,
                  backgroundColor: Colors.grey[100],
                  showCheckmark: false,
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('إلغاء'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context, {
                        'area': _currentArea,
                        'minDiscount': _currentDiscount,
                        'sortBy': _currentSort,
                      });
                    },
                    child: const Text('تطبيق'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
