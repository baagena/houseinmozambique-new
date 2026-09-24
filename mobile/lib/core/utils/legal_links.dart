import 'package:url_launcher/url_launcher.dart';

import '../network/api_config.dart';

/// The website's /terms and /privacy pages, shown in an in-app browser sheet
/// so the user reads them without leaving sign-up.
Future<void> openTermsOfService() => _open('/terms');
Future<void> openPrivacyPolicy() => _open('/privacy');

Future<void> _open(String path) =>
    launchUrl(Uri.parse('${ApiConfig.rootUrl}$path'), mode: LaunchMode.inAppBrowserView);
