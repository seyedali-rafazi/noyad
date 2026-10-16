import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/shared/theme';

export default function TabLayout() {
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Elevate completely above Samsung 3-button navigation bar (48dp) and gestures
  const bottomOffset = Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 10 : 6);

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark
          ? 'rgba(255, 255, 255, 0.45)'
          : 'rgba(30, 41, 59, 0.45)',
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 10.5,
          lineHeight: 16,
          fontWeight: '700',
          writingDirection: 'rtl',
          marginTop: 2,
          marginBottom: 1,
          includeFontPadding: false,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: bottomOffset,
          height: 74,
          borderRadius: 24,
          backgroundColor: isDark
            ? 'rgba(18, 22, 36, 0.78)'
            : 'rgba(255, 255, 255, 0.82)',
          borderTopWidth: 0,
          borderWidth: 1.2,
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.16)'
            : 'rgba(255, 255, 255, 0.65)',
          shadowColor: isDark ? '#000000' : colors.accent,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.45 : 0.14,
          shadowRadius: 20,
          elevation: 10,
          overflow: 'hidden',
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 70 : 85}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            {/* Specular top highlight for frosted glass realism */}
            <View
              style={[
                styles.specularShine,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.26)'
                    : 'rgba(255, 255, 255, 0.85)',
                },
              ]}
            />
          </View>
        ),
      }}
    >
      {/* RTL order: assistant (leftmost), notes, calendar, tasks, today (rightmost) */}
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'دستیار',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.22)'
                    : 'rgba(99, 102, 241, 0.12)',
                  borderColor: isDark
                    ? 'rgba(129, 140, 248, 0.35)'
                    : 'rgba(99, 102, 241, 0.22)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={22}
                color={focused ? colors.accent : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'یادداشت‌ها',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.22)'
                    : 'rgba(99, 102, 241, 0.12)',
                  borderColor: isDark
                    ? 'rgba(129, 140, 248, 0.35)'
                    : 'rgba(99, 102, 241, 0.22)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'document-text' : 'document-text-outline'}
                size={22}
                color={focused ? colors.accent : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'تقویم',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.22)'
                    : 'rgba(99, 102, 241, 0.12)',
                  borderColor: isDark
                    ? 'rgba(129, 140, 248, 0.35)'
                    : 'rgba(99, 102, 241, 0.22)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={22}
                color={focused ? colors.accent : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'کارها',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.22)'
                    : 'rgba(99, 102, 241, 0.12)',
                  borderColor: isDark
                    ? 'rgba(129, 140, 248, 0.35)'
                    : 'rgba(99, 102, 241, 0.22)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'checkbox' : 'checkbox-outline'}
                size={22}
                color={focused ? colors.accent : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'امروز',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: isDark
                    ? 'rgba(99, 102, 241, 0.22)'
                    : 'rgba(99, 102, 241, 0.12)',
                  borderColor: isDark
                    ? 'rgba(129, 140, 248, 0.35)'
                    : 'rgba(99, 102, 241, 0.22)',
                },
              ]}
            >
              <Ionicons
                name={focused ? 'today' : 'today-outline'}
                size={22}
                color={focused ? colors.accent : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 42,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
