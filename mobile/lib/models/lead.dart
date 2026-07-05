class Lead {
  final String id;
  final String name;
  final String email;
  final String subject;
  final String message;
  final String? propertyId;
  final String? agentId;
  final bool isRead;
  final DateTime createdAt;

  Lead({
    required this.id,
    required this.name,
    required this.email,
    required this.subject,
    required this.message,
    this.propertyId,
    this.agentId,
    this.isRead = false,
    required this.createdAt,
  });

  factory Lead.fromJson(Map<String, dynamic> json) {
    return Lead(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      message: json['message'] as String? ?? '',
      propertyId: json['propertyId'] as String?,
      agentId: json['agentId'] as String?,
      isRead: json['isRead'] as bool? ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
