/// Base URL for the HouseInMozambique mobile API (src/app/api/mobile/v1 in the
/// Next.js app). Override at build/run time with:
///   flutter run --dart-define=API_BASE_URL=https://your-deployed-domain.com
class ApiConfig {
  ApiConfig._();

  static const String _override = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl => '$rootUrl/api/mobile/v1';

  /// The site root, for the handful of endpoints (e.g. /api/inquiries) that
  /// live outside the /api/mobile/v1 namespace because they're already
  /// public JSON routes shared with the website.
  static String get rootUrl {
    if (_override.isNotEmpty) return _override;
    return 'https://www.houseinmozambique.com';
  }
}
