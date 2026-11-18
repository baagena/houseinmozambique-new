import 'package:intl/intl.dart';

/// Null-safe readers for the dashboard endpoints' JSON. The screens built on
/// these read many small payloads that only they use, so they read maps
/// directly instead of each payload getting a model class — but a missing or
/// mistyped field must never crash a screen, so every read here has a default.
extension JsonRead on Map<String, dynamic> {
  String str(String key, [String fallback = '']) {
    final v = this[key];
    if (v == null) return fallback;
    return v is String ? v : v.toString();
  }

  String? strOrNull(String key) {
    final v = this[key];
    if (v == null) return null;
    final s = v is String ? v : v.toString();
    return s.isEmpty ? null : s;
  }

  int integer(String key, [int fallback = 0]) {
    final v = this[key];
    if (v is int) return v;
    if (v is num) return v.round();
    if (v is String) return int.tryParse(v) ?? fallback;
    return fallback;
  }

  int? integerOrNull(String key) {
    final v = this[key];
    if (v is int) return v;
    if (v is num) return v.round();
    if (v is String) return int.tryParse(v);
    return null;
  }

  double? number(String key) {
    final v = this[key];
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }

  bool flag(String key, [bool fallback = false]) {
    final v = this[key];
    return v is bool ? v : fallback;
  }

  DateTime? date(String key) {
    final v = this[key];
    return v is String ? DateTime.tryParse(v)?.toLocal() : null;
  }

  Map<String, dynamic> obj(String key) {
    final v = this[key];
    return v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};
  }

  Map<String, dynamic>? objOrNull(String key) {
    final v = this[key];
    return v is Map ? Map<String, dynamic>.from(v) : null;
  }

  List<Map<String, dynamic>> objList(String key) {
    final v = this[key];
    if (v is! List) return const [];
    return v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }

  /// A text field that some rows store as a list: "a, b" either way.
  String joined(String key) {
    final v = this[key];
    if (v is List) return v.where((e) => e != null).map((e) => e.toString()).join(', ');
    return v == null ? '' : v.toString().trim();
  }

  List<String> strList(String key) {
    final v = this[key];
    if (v is! List) return const [];
    return v.where((e) => e != null).map((e) => e.toString()).toList();
  }
}

/// Amounts arrive in minor units (centavos): 350000 is 3,500 MZN.
String formatMinor(int minor, [String currency = 'MZN']) {
  final major = minor / 100;
  final digits = minor % 100 == 0 ? 0 : 2;
  return '${NumberFormat.decimalPatternDigits(locale: 'en', decimalDigits: digits).format(major)} $currency';
}

String formatDate(DateTime? d) => d == null ? '—' : DateFormat('d MMM yyyy').format(d);

String formatDateTime(DateTime? d) => d == null ? '—' : DateFormat('d MMM yyyy, HH:mm').format(d);

/// "3h ago" / "2d ago" — short enough for a list row.
String timeAgo(DateTime? d) {
  if (d == null) return '';
  final diff = DateTime.now().difference(d);
  if (diff.inMinutes < 1) return 'now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m';
  if (diff.inHours < 24) return '${diff.inHours}h';
  if (diff.inDays < 30) return '${diff.inDays}d';
  return formatDate(d);
}
