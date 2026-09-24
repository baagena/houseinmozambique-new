import 'package:easy_localization/easy_localization.dart';

/// Display names for values the API stores in English (property types,
/// listing types, amenities, statuses). The stored value stays English —
/// filters and the website match on it — and only what is shown changes.
/// A value with no translation (e.g. a free-text amenity typed on an old
/// listing) is shown as it is.
String _label(String section, String value) {
  if (value.isEmpty) return value;
  final key = '$section.$value';
  final translated = key.tr();
  return translated == key ? value : translated;
}

String propertyTypeLabel(String value) => _label('propertyTypes', value);
String listingTypeLabel(String value) => _label('listingTypes', value);
String amenityLabel(String value) => _label('amenityNames', value);
String statusLabel(String value) => _label('status', value.toUpperCase());

/// English server messages the app shows as-is, mapped to translated text.
const _serverErrorKeys = {
  'Invalid email or password': 'serverErrors.invalidLogin',
  'An account with this email already exists': 'serverErrors.accountExists',
  'An account with this email already exists.': 'serverErrors.accountExists',
  'Password must be at least 8 characters': 'serverErrors.passwordTooShort',
  'You must accept the Terms of Service and Privacy Policy': 'serverErrors.mustAcceptTerms',
  'Incorrect password.': 'serverErrors.incorrectPassword',
  'This account has been revoked.': 'serverErrors.accountRevoked',
  'Agent access has been revoked.': 'serverErrors.accountRevoked',
  'Invalid or expired token.': 'serverErrors.sessionExpired',
  'Not authenticated.': 'serverErrors.sessionExpired',
  'Admin accounts cannot be deleted from the app. Ask another admin to remove it.': 'serverErrors.adminCannotDelete',
  'Email, password and name are required': 'serverErrors.missingFields',
  'Email and password are required': 'serverErrors.missingFields',
  'Name, email, and password are required.': 'serverErrors.missingFields',
  'Missing required property fields.': 'serverErrors.missingFields',
  'Internal server error': 'serverErrors.serverError',
  'Failed to create the listing.': 'serverErrors.listingCreateFailed',
  'Failed to create property.': 'serverErrors.listingCreateFailed',
  'Not authorized to manage this listing.': 'serverErrors.notAuthorized',
  'Not authorized to edit this listing.': 'serverErrors.notAuthorized',
  'Not authorized to delete this listing.': 'serverErrors.notAuthorized',
  'Forbidden': 'serverErrors.notAuthorized',
  'Forbidden - admins only': 'serverErrors.notAuthorized',
  'Not found': 'serverErrors.notFound',
  'Property not found': 'serverErrors.notFound',
};

String localizeServerError(String message) {
  final key = _serverErrorKeys[message.trim()];
  return key == null ? message : key.tr();
}
