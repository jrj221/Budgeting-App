import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ScreenTourOverlay } from '@/components/screen-tour-overlay';
import { TourOverlay } from '@/components/tour-overlay';
import { WelcomeScreen } from '@/components/welcome-screen';
import { CategoriesProvider } from '@/contexts/categories-context';
import { GoalsProvider } from '@/contexts/goals-context';
import { OnboardingProvider, useOnboarding } from '@/contexts/onboarding-context';
import { PreferencesProvider } from '@/contexts/preferences-context';
import { ScreenTourProvider } from '@/contexts/screen-tour-context';
import { AppThemeProvider } from '@/contexts/theme-context';
import { TourProvider } from '@/contexts/tour-context';
import { TransactionsProvider } from '@/contexts/transactions-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppThemeProvider>
          <PreferencesProvider>
          <OnboardingProvider>
            <CategoriesProvider>
              <TransactionsProvider>
                <GoalsProvider>
                  <TourProvider>
                    <ScreenTourProvider>
                      <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      </Stack>
                      <StatusBar style="auto" />
                      <TourOverlay />
                      <ScreenTourOverlay />
                      <WelcomeGate />
                    </ScreenTourProvider>
                  </TourProvider>
                </GoalsProvider>
              </TransactionsProvider>
            </CategoriesProvider>
          </OnboardingProvider>
          </PreferencesProvider>
        </AppThemeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function WelcomeGate() {
  const { ready, hasSeenWelcome } = useOnboarding();
  return (
    <Modal
      visible={ready && !hasSeenWelcome}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={() => {}}>
      <WelcomeScreen />
    </Modal>
  );
}
