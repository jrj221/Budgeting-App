import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { TourOverlay } from '@/components/tour-overlay';
import { WelcomeScreen } from '@/components/welcome-screen';
import { CategoriesProvider } from '@/contexts/categories-context';
import { GoalsProvider } from '@/contexts/goals-context';
import { OnboardingProvider, useOnboarding } from '@/contexts/onboarding-context';
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
          <OnboardingProvider>
            <TourProvider>
              <CategoriesProvider>
                <TransactionsProvider>
                  <GoalsProvider>
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    </Stack>
                    <StatusBar style="auto" />
                    <TourOverlay />
                    <WelcomeGate />
                  </GoalsProvider>
                </TransactionsProvider>
              </CategoriesProvider>
            </TourProvider>
          </OnboardingProvider>
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
