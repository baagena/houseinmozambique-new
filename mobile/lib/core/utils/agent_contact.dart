import 'package:easy_localization/easy_localization.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/property.dart';
import '../network/api_config.dart';

/// The listing form folds agent contact details and coordinates into the
/// description text (see listing_form_screen.dart / the website's
/// post-property page). This parses them back out so any screen can render
/// tappable contact actions for a property.
class AgentContact {
  /// Description with the contact/coordinate lines stripped.
  final String description;
  final String? phone;
  final String? whatsapp;
  final String? email;
  final String? responseTime;
  final String? coordinates;

  const AgentContact._({
    required this.description,
    this.phone,
    this.whatsapp,
    this.email,
    this.responseTime,
    this.coordinates,
  });

  factory AgentContact.fromProperty(Property property) {
    String? phone, whatsapp, email, responseTime, coordinates;
    final kept = <String>[];
    for (final line in property.description.split('\n')) {
      final t = line.trim();
      final lower = t.toLowerCase();
      String value(String prefix) => t.substring(prefix.length).trim();

      if (lower.startsWith('agent phone:')) {
        phone = value('Agent phone:');
      } else if (lower.startsWith('whatsapp:')) {
        whatsapp = value('WhatsApp:');
      } else if (lower.startsWith('contact email:')) {
        email = value('Contact email:');
      } else if (lower.startsWith('preferred response time:')) {
        responseTime = value('Preferred response time:');
      } else if (lower.startsWith('coordinates:')) {
        coordinates = value('Coordinates:');
      } else {
        kept.add(line);
      }
    }

    String? orNull(String? v) => (v == null || v.isEmpty) ? null : v;
    return AgentContact._(
      description: kept.join('\n').replaceAll(RegExp(r'\n{3,}'), '\n\n').trim(),
      phone: orNull(phone) ?? orNull(property.host?.phone),
      whatsapp: orNull(whatsapp),
      email: orNull(email),
      responseTime: orNull(responseTime),
      coordinates: orNull(coordinates),
    );
  }

  bool get hasAnyChannel => phone != null || whatsapp != null || email != null;
}

/// Public listing page on the website, used in outbound messages.
String propertyUrl(Property property) => '${ApiConfig.rootUrl}/property/${property.id}';

/// Mozambican numbers are usually written without the country code; wa.me
/// only accepts full international numbers.
String _internationalDigits(String raw) {
  var digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.startsWith('00')) digits = digits.substring(2);
  if (digits.length == 9 && digits.startsWith('8')) digits = '258$digits';
  return digits;
}

Future<void> launchCall(String number) async {
  await launchUrl(Uri.parse('tel:$number'), mode: LaunchMode.externalApplication);
}

/// Opens WhatsApp with a message referencing the property (title + web link).
Future<void> launchWhatsApp(String number, Property property) async {
  final digits = _internationalDigits(number);
  final message = 'property.whatsappMessage'.tr(args: [property.title, propertyUrl(property)]);
  await launchUrl(
    Uri.parse('https://wa.me/$digits?text=${Uri.encodeComponent(message)}'),
    mode: LaunchMode.externalApplication,
  );
}

Future<void> launchEmail(String address, Property property) async {
  final subject = Uri.encodeComponent('Inquiry about ${property.title}');
  final body = Uri.encodeComponent('Hello,\n\nI am interested in "${property.title}" (${propertyUrl(property)}).\n');
  await launchUrl(Uri.parse('mailto:$address?subject=$subject&body=$body'), mode: LaunchMode.externalApplication);
}
