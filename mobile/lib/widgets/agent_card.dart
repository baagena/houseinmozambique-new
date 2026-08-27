import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';
import '../models/agent.dart';

class AgentCard extends StatelessWidget {
  final Agent agent;
  final double width;

  const AgentCard({super.key, required this.agent, this.width = 160});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/agent/${agent.id}'),
      child: SizedBox(
        width: width,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 36,
              backgroundColor: AppColors.surfaceVariant,
              backgroundImage: agent.avatar != null ? CachedNetworkImageProvider(agent.avatar!) : null,
              child: agent.avatar == null
                  ? Text(agent.initials, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))
                  : null,
            ),
            const SizedBox(height: 8),
            Text(agent.name, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            Text(agent.title, maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
            if (agent.rating > 0) ...[
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.star, size: 14, color: AppColors.secondary),
                  const SizedBox(width: 2),
                  Text(agent.rating.toStringAsFixed(1), style: const TextStyle(fontSize: 12)),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
