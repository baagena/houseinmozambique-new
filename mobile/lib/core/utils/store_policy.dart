import 'package:flutter/foundation.dart';

/// Run with `--dart-define=SIMULATE_IOS=true` to see the iOS behaviour on
/// Chrome or Android, e.g. to check the listing flow without an iPhone.
const _simulateIos = bool.fromEnvironment('SIMULATE_IOS');

/// Apple requires digital purchases made inside an iOS app to go through
/// in-app purchase, and rejects apps that show other ways to pay. The iOS
/// build therefore never shows plans, prices or payment instructions: agents
/// there post on the free Standard plan, and paid plans stay on Android and
/// the website.
///
/// The admin console follows the same rule on iOS: no payment verification,
/// ledger or price list there. Admins can still give an account access
/// ("Dar acesso"), worded by what it unlocks — never plan names or prices.
bool get showsPaidPlans => !_simulateIos && defaultTargetPlatform != TargetPlatform.iOS;
