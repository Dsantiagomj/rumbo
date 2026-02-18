import { Tabs } from 'expo-router';
import { colors, fontFamily } from '@/config/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontFamily: fontFamily.medium },
        tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: 12 },
        tabBarActiveTintColor: colors.light.primary,
        tabBarInactiveTintColor: colors.light.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.light.background,
          borderTopColor: colors.light.border,
        },
        headerStyle: {
          backgroundColor: colors.light.background,
        },
        headerTintColor: colors.light.foreground,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
        }}
      />
    </Tabs>
  );
}
