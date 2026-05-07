import { Tabs } from 'expo-router';
import React, { ComponentProps } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette } from '@/constants/colors';
import { Colors } from '@/constants/theme';
import { TOUR_STEPS, useTour } from '@/contexts/tour-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IconName = ComponentProps<typeof IconSymbol>['name'];

function TourAwareTabIcon({
  color,
  name,
  tabIndex,
}: {
  color: string;
  name: IconName;
  tabIndex: number;
}) {
  const { stepIndex } = useTour();
  const step = stepIndex !== null ? TOUR_STEPS[stepIndex] : null;
  const isTarget = step?.kind === 'tap-tab' && step.tabIndex === tabIndex;
  return <IconSymbol size={28} name={name} color={isTarget ? Palette.brand : color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TourAwareTabIcon color={color} name="house.fill" tabIndex={0} />
          ),
        }}
      />
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color }) => (
            <TourAwareTabIcon color={color} name="chart.pie.fill" tabIndex={1} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <TourAwareTabIcon color={color} name="clock.fill" tabIndex={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <TourAwareTabIcon color={color} name="gearshape.fill" tabIndex={3} />
          ),
        }}
      />
    </Tabs>
  );
}
