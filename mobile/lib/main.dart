import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'controllers/auth_controller.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'services/firebase_services.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();
  // Push notifications and analytics. A no-op until Firebase is configured,
  // and it can never stop the app from starting.
  await initFirebase();
  // The app is light-themed everywhere: keep the status bar transparent with
  // dark icons instead of the platform's default dark band.
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
  ));
  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('pt')],
      path: 'assets/translations',
      fallbackLocale: const Locale('en'),
      child: const ProviderScope(child: HouseInMozambiqueApp()),
    ),
  );
}

class HouseInMozambiqueApp extends ConsumerStatefulWidget {
  const HouseInMozambiqueApp({super.key});

  @override
  ConsumerState<HouseInMozambiqueApp> createState() => _HouseInMozambiqueAppState();
}

class _HouseInMozambiqueAppState extends ConsumerState<HouseInMozambiqueApp> {
  @override
  void initState() {
    super.initState();
    // Notification taps open the screen the server named (e.g. "/my-leads").
    ref.read(pushServiceProvider).startListening((route) {
      final router = ref.read(appRouterProvider);
      // Guarded routes redirect on their own if the account can't open them.
      router.push(route);
    });
    // Someone already signed in when the app opens never triggers the
    // sign-in listener below, so register this phone once at start-up too
    // (and again once a restored session finishes loading).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _syncCurrent();
    });
  }

  String? _syncedFor;

  void _syncCurrent() {
    final agent = ref.read(authControllerProvider).agent;
    final key = agent == null ? null : '${agent.id}:${agent.role}';
    if (key == null || key == _syncedFor) return;
    _syncedFor = key;
    Analytics.setAccount(agent);
    ref.read(pushServiceProvider).syncFor(agent, lang: context.locale.languageCode, appVersion: appVersion);
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    final lang = context.locale.languageCode;
    Analytics.setLanguage(lang);

    // Sign-in, sign-out and account changes: keep analytics' account type and
    // this phone's push registration in step with who is signed in.
    ref.listen<AuthState>(authControllerProvider, (previous, next) {
      if (previous?.agent?.id == next.agent?.id && previous?.agent?.role == next.agent?.role) return;
      final key = next.agent == null ? null : '${next.agent!.id}:${next.agent!.role}';
      if (key != null && key == _syncedFor) return; // already done at start-up
      _syncedFor = key;
      Analytics.setAccount(next.agent);
      ref.read(pushServiceProvider).syncFor(next.agent, lang: lang, appVersion: appVersion);
    });

    return MaterialApp.router(
      title: 'House in Mozambique',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      scaffoldMessengerKey: pushMessengerKey,
      // Several rows and cards are laid out at a fixed height (the home
      // property rows, the bottom nav). Let the system font size grow, but
      // cap it so those never clip their last line.
      builder: (context, child) => MediaQuery.withClampedTextScaling(
        maxScaleFactor: 1.2,
        child: child ?? const SizedBox.shrink(),
      ),
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      routerConfig: router,
    );
  }
}
