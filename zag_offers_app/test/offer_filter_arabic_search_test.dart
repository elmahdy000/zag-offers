import 'package:flutter_test/flutter_test.dart';
import 'package:zag_offers_app/features/offers/domain/entities/offer_entity.dart';
import 'package:zag_offers_app/features/offers/domain/entities/store_entity.dart';
import 'package:zag_offers_app/features/offers/presentation/utils/offer_filter_utils.dart';

void main() {
  group('OfferFilterUtils Arabic Normalization', () {
    test('normalizes Alef variants to plain Alef', () {
      expect(OfferFilterUtils.normalizeArabic('أحمد'), equals('احمد'));
      expect(OfferFilterUtils.normalizeArabic('إبراهيم'), equals('ابراهيم'));
      expect(OfferFilterUtils.normalizeArabic('آدم'), equals('ادم'));
    });

    test('normalizes Taa Marbuta to Haa', () {
      expect(OfferFilterUtils.normalizeArabic('القومية'), equals('القوميه'));
      expect(OfferFilterUtils.normalizeArabic('شاورمة'), equals('شاورمه'));
    });

    test('normalizes Yaa variants and Alef Maksura to Yaa', () {
      expect(OfferFilterUtils.normalizeArabic('بيوتى'), equals('بيوتي'));
      expect(OfferFilterUtils.normalizeArabic('شاطئ'), equals('شاطي'));
      expect(OfferFilterUtils.normalizeArabic('على'), equals('علي'));
    });

    test('strips Tashkeel and Tatweel', () {
      expect(OfferFilterUtils.normalizeArabic('بُرْجَر'), equals('برجر'));
      expect(OfferFilterUtils.normalizeArabic('شَاوِرْمَا'), equals('شاورما'));
      expect(OfferFilterUtils.normalizeArabic('عـــروض'), equals('عروض'));
    });

    test('converts Eastern Arabic numerals to Western Arabic digits', () {
      expect(OfferFilterUtils.normalizeArabic('خصم ٥٠%'), equals('خصم 50%'));
      expect(OfferFilterUtils.normalizeArabic('٢٠'), equals('20'));
    });

    test('strips invisible marks and collapses whitespaces', () {
      expect(
        OfferFilterUtils.normalizeArabic('  برجر \u200E  فاكتوري   '),
        equals('برجر فاكتوري'),
      );
    });
  });

  group('OfferFilterUtils Search & Filter Matching', () {
    const storeBurger = StoreEntity(
      id: 's1',
      name: 'برجر فاكتوري',
      area: 'القومية',
      category: 'دلع كرشك',
      rating: 4.8,
      logo: 'logo.png',
      coverImage: 'cover.png',
    );

    const storeShawarma = StoreEntity(
      id: 's2',
      name: 'شاورما الريم',
      area: 'فلل الجامعة',
      category: 'دلع كرشك',
      rating: 4.9,
      logo: 'logo.png',
      coverImage: 'cover.png',
    );

    const storeCafe = StoreEntity(
      id: 's3',
      name: 'سيلفر كافيه',
      area: 'صلاح سالم',
      category: 'روقان',
      rating: 4.7,
      logo: 'logo.png',
      coverImage: 'cover.png',
    );

    final offerBurger = OfferEntity(
      id: 'o1',
      title: 'عرض وجبة برجر دبل تشيز',
      description: 'أقوى ساندوتش برجر مشوي على الفحم مع بطاطس ومشروب',
      discount: 'خصم 30%',
      oldPrice: 200,
      newPrice: 140,
      image: 'burger.png',
      store: storeBurger,
      expiryDate: DateTime(2026, 12, 31),
    );

    final offerShawarma = OfferEntity(
      id: 'o2',
      title: 'عرض كومبو شاورما عربي',
      description: 'شاورما دجاج متبلة مع تومية ومخلل',
      discount: 'خصم 50%',
      oldPrice: 180,
      newPrice: 90,
      image: 'shawarma.png',
      store: storeShawarma,
      expiryDate: DateTime(2026, 12, 31),
    );

    final offerCafe = OfferEntity(
      id: 'o3',
      title: 'مشروب لاتيه كولد برو مجاناً',
      description: 'احصل على مشروب قهوة لاتيه مع أي حلى تطلبه',
      discount: 'خصم 20%',
      oldPrice: 100,
      newPrice: 80,
      image: 'latte.png',
      store: storeCafe,
      expiryDate: DateTime(2026, 12, 31),
    );

    final List<OfferEntity> allOffers = [offerBurger, offerShawarma, offerCafe];

    test('matchesSearch matches title with variations and Alefs', () {
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'برجر'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'بُرْجَر'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'تشيز'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'أقوي'), isTrue); // Hamza on Alef + Yaa
    });

    test('matchesSearch matches store name with definite article tolerance', () {
      expect(OfferFilterUtils.matchesSearch(offerShawarma, 'الريم'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerShawarma, 'ريم'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'فاكتوري'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'الفاكتوري'), isTrue);
    });

    test('matchesSearch matches Egyptian spelling variants (ه vs ا)', () {
      expect(OfferFilterUtils.matchesSearch(offerShawarma, 'شاورمه'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerShawarma, 'شاورما'), isTrue);
    });

    test('matchesSearch matches area names with and without ال', () {
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'قومية'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'القومية'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerBurger, 'قوميه'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerShawarma, 'فلل'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerShawarma, 'الفلل'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerShawarma, 'الجامعة'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerShawarma, 'الجامعه'), isTrue);
    });

    test('matchesSearch matches Eastern numerals', () {
      expect(OfferFilterUtils.matchesSearch(offerShawarma, '٥٠'), isTrue);
      expect(OfferFilterUtils.matchesSearch(offerBurger, '٣٠'), isTrue);
    });

    test('matchesCategory matches display and backend names', () {
      // Offer category is 'دلع كرشك', backend name is 'مطاعم'
      expect(OfferFilterUtils.matchesCategory('دلع كرشك', 'الكل'), isTrue);
      expect(OfferFilterUtils.matchesCategory('دلع كرشك', 'دلع كرشك'), isTrue);
      expect(OfferFilterUtils.matchesCategory('دلع كرشك', 'مطاعم'), isTrue);
      expect(OfferFilterUtils.matchesCategory('مطاعم', 'دلع كرشك'), isTrue);
      expect(OfferFilterUtils.matchesCategory('دلع كرشك', 'روقان'), isFalse);
    });

    test('matchesArea matches area with loose Arabic article', () {
      expect(OfferFilterUtils.matchesArea('القومية', 'الكل'), isTrue);
      expect(OfferFilterUtils.matchesArea('القومية', 'القومية'), isTrue);
      expect(OfferFilterUtils.matchesArea('القومية', 'قوميه'), isTrue);
      expect(OfferFilterUtils.matchesArea('فلل الجامعة', 'فلل'), isTrue);
      expect(OfferFilterUtils.matchesArea('فلل الجامعة', 'الفلل'), isTrue);
      expect(OfferFilterUtils.matchesArea('فلل الجامعة', 'القومية'), isFalse);
    });

    test('OfferFilterUtils.apply integrates search query, category, area, and discount', () {
      // 1. Search for 'شاورما' in all categories
      final result1 = OfferFilterUtils.apply(
        offers: allOffers,
        searchQuery: 'شاورمه',
      );
      expect(result1.length, equals(1));
      expect(result1.first.id, equals('o2'));

      // 2. Search for 'القومية' in 'دلع كرشك'
      final result2 = OfferFilterUtils.apply(
        offers: allOffers,
        category: 'مطاعم',
        area: 'قومية',
      );
      expect(result2.length, equals(1));
      expect(result2.first.id, equals('o1'));

      // 3. Search for offers with min discount 40%
      final result3 = OfferFilterUtils.apply(
        offers: allOffers,
        minDiscount: 40,
      );
      expect(result3.length, equals(1));
      expect(result3.first.id, equals('o2'));

      // 4. Combined search + category + area + min discount
      final result4 = OfferFilterUtils.apply(
        offers: allOffers,
        category: 'دلع كرشك',
        area: 'القومية',
        minDiscount: 20,
        searchQuery: 'برجر',
      );
      expect(result4.length, equals(1));
      expect(result4.first.id, equals('o1'));

      // 5. Query that doesn't match should return empty list
      final result5 = OfferFilterUtils.apply(
        offers: allOffers,
        searchQuery: 'بيتزا كراست',
      );
      expect(result5, isEmpty);
    });
  });
}
