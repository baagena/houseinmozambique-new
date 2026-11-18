// Writes lib/core/firebase/firebase_options.dart from the two files the
// Firebase console gives you:
//
//   mobile/firebase/google-services.json      (Android app)
//   mobile/firebase/GoogleService-Info.plist  (iOS app)
//
// Run from the mobile/ folder:   dart run tool/generate_firebase_options.dart
//
// Either file may be missing; that platform then stays without Firebase.

import 'dart:convert';
import 'dart:io';

const _androidPackage = 'com.houseinmozambique.mobile';
const _iosBundle = 'com.houseinmozambique.mobile';

String? _android() {
  final file = File('firebase/google-services.json');
  if (!file.existsSync()) {
    stdout.writeln('· firebase/google-services.json not found — Android stays off.');
    return null;
  }
  final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  final project = json['project_info'] as Map<String, dynamic>;
  final clients = (json['client'] as List).cast<Map<String, dynamic>>();
  final client = clients.firstWhere(
    (c) => c['client_info']?['android_client_info']?['package_name'] == _androidPackage,
    orElse: () => throw StateError(
      'google-services.json has no Android app with package "$_androidPackage". '
      'Add an Android app with exactly that package name in the Firebase console.',
    ),
  );
  final apiKey = ((client['api_key'] as List).first as Map)['current_key'];
  return _options({
    'apiKey': apiKey,
    'appId': client['client_info']['mobilesdk_app_id'],
    'messagingSenderId': project['project_number'],
    'projectId': project['project_id'],
    if (project['storage_bucket'] != null) 'storageBucket': project['storage_bucket'],
  });
}

String? _ios() {
  final file = File('firebase/GoogleService-Info.plist');
  if (!file.existsSync()) {
    stdout.writeln('· firebase/GoogleService-Info.plist not found — iOS stays off.');
    return null;
  }
  final xml = file.readAsStringSync();
  String? read(String key) =>
      RegExp('<key>$key</key>\\s*<string>([^<]*)</string>').firstMatch(xml)?.group(1);
  final bundle = read('BUNDLE_ID');
  if (bundle != _iosBundle) {
    throw StateError('GoogleService-Info.plist is for "$bundle", expected "$_iosBundle".');
  }
  return _options({
    'apiKey': read('API_KEY'),
    'appId': read('GOOGLE_APP_ID'),
    'messagingSenderId': read('GCM_SENDER_ID'),
    'projectId': read('PROJECT_ID'),
    if (read('STORAGE_BUCKET') != null) 'storageBucket': read('STORAGE_BUCKET'),
    'iosBundleId': bundle,
  });
}

String _options(Map<String, Object?> fields) {
  for (final e in fields.entries) {
    if (e.value == null || '${e.value}'.isEmpty) throw StateError('Missing ${e.key} in the Firebase file.');
  }
  final body = fields.entries.map((e) => "    ${e.key}: '${e.value}',").join('\n');
  return 'FirebaseOptions(\n$body\n  )';
}

void main() {
  final android = _android();
  final ios = _ios();
  final template = File('lib/core/firebase/firebase_options.dart').readAsStringSync();
  var out = template
      .replaceFirst(RegExp(r'static const FirebaseOptions\? android = [\s\S]*?;\n'),
          'static const FirebaseOptions? android = ${android ?? 'null'};\n')
      .replaceFirst(RegExp(r'static const FirebaseOptions\? ios = [\s\S]*?;\n'),
          'static const FirebaseOptions? ios = ${ios ?? 'null'};\n');
  File('lib/core/firebase/firebase_options.dart').writeAsStringSync(out);
  stdout.writeln('Wrote lib/core/firebase/firebase_options.dart '
      '(Android: ${android != null ? 'on' : 'off'}, iOS: ${ios != null ? 'on' : 'off'}).');
}
