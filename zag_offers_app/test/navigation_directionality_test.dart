import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_app/core/utils/navigation_service.dart';
import 'package:zag_offers_app/core/widgets/app_back_button.dart';

void main() {
  group('NavigationService RTL & LTR Semantic Directionality Tests', () {
    test('Icons have matchTextDirection: true', () {
      expect(Icons.arrow_back_ios_new_rounded.matchTextDirection, isTrue);
      expect(Icons.arrow_forward_ios_rounded.matchTextDirection, isTrue);
      expect(Icons.arrow_back_rounded.matchTextDirection, isTrue);
      expect(Icons.arrow_forward_rounded.matchTextDirection, isTrue);
    });

    testWidgets('Icon(arrow_back_ios_new_rounded) is auto-mirrored to point RIGHT in RTL', (tester) async {
      await tester.pumpWidget(
        const Directionality(
          textDirection: TextDirection.rtl,
          child: Icon(Icons.arrow_back_ios_new_rounded),
        ),
      );
      final transformFinder = find.byType(Transform);
      expect(transformFinder, findsOneWidget);
      final transform = tester.widget<Transform>(transformFinder);
      // scaleX is -1.0, flipping '<' chevron to point '>' (rightwards)
      expect(transform.transform.storage[0], -1.0);
    });

    testWidgets('Icon(arrow_back_ios_new_rounded) is NOT mirrored in LTR (points LEFT)', (tester) async {
      await tester.pumpWidget(
        const Directionality(
          textDirection: TextDirection.ltr,
          child: Icon(Icons.arrow_back_ios_new_rounded),
        ),
      );
      // In LTR, no horizontal flip Transform is added by Icon
      final transformFinder = find.byType(Transform);
      expect(transformFinder, findsNothing);
    });

    testWidgets('getBackIcon returns semantic arrow_back_ios_new_rounded', (tester) async {
      late IconData backIconRtl;
      late IconData backIconLtr;

      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.rtl,
          child: Builder(
            builder: (context) {
              backIconRtl = NavigationService.getBackIcon(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );
      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: Builder(
            builder: (context) {
              backIconLtr = NavigationService.getBackIcon(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      expect(backIconRtl, Icons.arrow_back_ios_new_rounded);
      expect(backIconLtr, Icons.arrow_back_ios_new_rounded);
    });

    testWidgets('getForwardIcon returns semantic arrow_forward_ios_rounded', (tester) async {
      late IconData forwardIconRtl;
      late IconData forwardIconLtr;

      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.rtl,
          child: Builder(
            builder: (context) {
              forwardIconRtl = NavigationService.getForwardIcon(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );
      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: Builder(
            builder: (context) {
              forwardIconLtr = NavigationService.getForwardIcon(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      expect(forwardIconRtl, Icons.arrow_forward_ios_rounded);
      expect(forwardIconLtr, Icons.arrow_forward_ios_rounded);
    });

    testWidgets('AppBackButton auto-mirrors arrow_back_ios_new_rounded in RTL', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Directionality(
            textDirection: TextDirection.rtl,
            child: Scaffold(
              appBar: AppBar(
                leading: const AppBackButton(),
              ),
            ),
          ),
        ),
      );
      final iconFinder = find.byIcon(Icons.arrow_back_ios_new_rounded);
      expect(iconFinder, findsOneWidget);

      final transformFinder = find.descendant(
        of: find.byType(Icon),
        matching: find.byType(Transform),
      );
      expect(transformFinder, findsOneWidget);
      final transform = tester.widget<Transform>(transformFinder);
      expect(transform.transform.storage[0], -1.0);
    });

    testWidgets('AppBackButton leaves arrow_back_ios_new_rounded unflipped in LTR', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Directionality(
            textDirection: TextDirection.ltr,
            child: Scaffold(
              appBar: AppBar(
                leading: const AppBackButton(),
              ),
            ),
          ),
        ),
      );
      final iconFinder = find.byIcon(Icons.arrow_back_ios_new_rounded);
      expect(iconFinder, findsOneWidget);

      final transformFinder = find.descendant(
        of: find.byType(Icon),
        matching: find.byType(Transform),
      );
      expect(transformFinder, findsNothing);
    });
  });
}
