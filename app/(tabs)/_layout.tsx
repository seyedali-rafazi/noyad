import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Platform, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/shared/theme';
import { usePlannerStore } from '../../src/features/planner/plannerStore';

interface TabIconProps {
  nameFocused: keyof typeof Ionicons.glyphMap;
  nameUnfocused: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: any;
  activeColor: string;
}

const AnimatedTabIcon: React.FC<TabIconProps> = ({
  nameFocused,
  nameUnfocused,
  focused,
  color,
  activeColor,
}) => {
  const [scale] = useState(() => new Animated.Value(focused ? 1.08 : 1));

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.08 : 1,
      useNativeDriver: Platform.OS !== 'web',
      friction: 6,
      tension: 120,
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons
        name={focused ? nameFocused : nameUnfocused}
        size={24}
        color={focused ? activeColor : color}
      />
    </Animated.View>
  );
};

export default function TabLayout() {
  const { colors, fonts, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Elevate completely above Samsung 3-button navigation bar (48dp) and gestures
  const bottomOffset = Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 10 : 6);

  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        lazy: false,
        sceneStyleInterpolator: ({ current }) => {
          const { width: screenWidth } = Dimensions.get('window');
          return {
            sceneStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-screenWidth * 0.25, 0, screenWidth],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          };
        },
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 240,
            easing: Easing.out(Easing.cubic),
          },
        },
        tabBarHideOnKeyboard: true,
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
      {/* RTL order from Right to Left: index (امروز), assistant (دستیار), tasks (کارها), notes (یادداشت‌ها) */}
      <Tabs.Screen
        name="notes"
        options={{
          title: 'یادداشت‌ها',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              nameFocused="document-text"
              nameUnfocused="document-text-outline"
              focused={focused}
              color={color}
              activeColor={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'کارها',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              nameFocused="checkbox"
              nameUnfocused="checkbox-outline"
              focused={focused}
              color={color}
              activeColor={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'دستیار',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              nameFocused="sparkles"
              nameUnfocused="sparkles-outline"
              focused={focused}
              color={color}
              activeColor={colors.accent}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: () => {
            usePlannerStore.getState().setSelectedDate(new Date());
          },
        }}
        options={{
          title: 'امروز',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              nameFocused="today"
              nameUnfocused="today-outline"
              focused={focused}
              color={color}
              activeColor={colors.accent}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
