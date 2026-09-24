import 'package:flutter/foundation.dart';

/// Apple requires digital purchases made inside an iOS app to go through
/// in-app purchase, and rejects apps that show other ways to pay. The iOS
/// build therefore never shows plans, prices or payment instructions: agents
/// there post on the free Standard plan, and paid plans stay on Android and
/// the website.
bool get showsPaidPlans => defaultTargetPlatform != TargetPlatform.iOS;
