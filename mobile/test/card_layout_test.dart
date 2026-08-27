// Regression tests for the fixed-height rows on the home screen: at the
// largest font size the app allows, a card must still lay out inside the
// height its row gives it (the price line used to be clipped).

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/models/agent.dart';
import 'package:mobile/models/property.dart';
import 'package:mobile/widgets/agent_card.dart';
import 'package:mobile/widgets/property_card.dart';
import 'package:mobile/widgets/shimmer_loaders.dart';

Property _property() => Property(
      id: 'p1',
      title: 'River Bend Estate',
      description: '',
      location: 'Incomati Riverfront, Marracuene',
      city: 'Maputo',
      price: 2500,
      priceUnit: 'monthly',
      type: 'Villa',
      listingType: 'Rent',
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      isFeatured: true,
      images: const ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      hostId: 'a1',
      status: 'APPROVED',
      createdAt: DateTime(2026, 1, 1),
    );

Agent _agent() => Agent(
      id: 'a1',
      name: 'Ana Sitoe',
      initials: 'AS',
      title: 'Senior Property Consultant',
      location: 'Maputo',
      rating: 4.8,
    );

Widget _host({required double height, required Widget child}) {
  return ProviderScope(
    child: MaterialApp(
      home: MediaQuery(
        // The largest scale main.dart lets through.
        data: const MediaQueryData(textScaler: TextScaler.linear(1.2)),
        child: Scaffold(
          body: Align(
            alignment: Alignment.topLeft,
            child: SizedBox(height: height, child: child),
          ),
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('PropertyCard fits a 266dp home row at max text scale', (tester) async {
    await tester.pumpWidget(_host(height: 266, child: PropertyCard(property: _property())));
    expect(find.text('MT 2,500/mo'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('PropertyCard fits a 0.8 grid tile at max text scale', (tester) async {
    await tester.pumpWidget(_host(
      height: 158 / 0.8,
      child: SizedBox(
        width: 158,
        child: PropertyCard(property: _property(), width: double.infinity, swipeableImages: true),
      ),
    ));
    expect(tester.takeException(), isNull);
  });

  testWidgets('PropertyCardSkeleton fits the same row', (tester) async {
    await tester.pumpWidget(_host(height: 266, child: const PropertyCardSkeleton()));
    expect(tester.takeException(), isNull);
  });

  testWidgets('AgentCard fits a 148dp row at max text scale', (tester) async {
    await tester.pumpWidget(_host(height: 148, child: AgentCard(agent: _agent())));
    expect(tester.takeException(), isNull);
  });
}
