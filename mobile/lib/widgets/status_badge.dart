import 'package:flutter/material.dart';

/// Consistent status/role pill used across the admin screens. Soft tinted
/// background with a dark, readable text shade of the same hue.
class StatusBadge extends StatelessWidget {
  final String status;
  const StatusBadge({super.key, required this.status});

  static const _green = (Color(0xFFDCF2E3), Color(0xFF166534));
  static const _amber = (Color(0xFFFDF0D5), Color(0xFF92600A));
  static const _red = (Color(0xFFFCE1DE), Color(0xFF9F1B12));
  static const _blue = (Color(0xFFDDE6F5), Color(0xFF1E3A5F));
  static const _teal = (Color(0xFFDCEFF2), Color(0xFF0F5B66));
  static const _gray = (Color(0xFFE8EAED), Color(0xFF44474E));

  static const _styles = <String, (Color, Color)>{
    'PUBLISHED': _green,
    'ACTIVE': _green,
    'APPROVED': _green,
    'PENDING': _amber,
    'REJECTED': _red,
    'REVOKED': _red,
    'ADMIN': _blue,
    'AGENT': _teal,
    'CUSTOMER': _gray,
    'DRAFT': _gray,
  };

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _styles[status.toUpperCase()] ?? _gray;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.6),
      ),
    );
  }
}

/// Horizontal filter pill row (e.g. All / Pending / Published / Rejected).
class FilterPills extends StatelessWidget {
  final List<(String label, String? value)> options;
  final String? selected;
  final ValueChanged<String?> onSelected;
  const FilterPills({super.key, required this.options, required this.selected, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final (label, value) in options)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Material(
                color: selected == value ? const Color(0xFF002045) : const Color(0xFFECEEF0),
                borderRadius: BorderRadius.circular(20),
                child: InkWell(
                  onTap: () => onSelected(value),
                  borderRadius: BorderRadius.circular(20),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Text(
                      label,
                      style: TextStyle(
                        color: selected == value ? Colors.white : const Color(0xFF43474E),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
