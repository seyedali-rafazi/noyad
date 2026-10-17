import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../shared/theme';
import {
  getPersianGreeting,
  formatJalaliFullDate,
  isSameJalaliDay,
  getRelativeJalaliLabel,
} from '../../../core/calendar';

interface PlannerHeaderProps {
  currentDate?: Date;
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  currentDate = new Date(),
}) => {
  const { colors, spacing, typography, radii, isDark } = useTheme();
  const router = useRouter();

  // Dynamic live clock for dynamic greeting updates every 30 seconds
  const [liveDate, setLiveDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const isSelectedToday = isSameJalaliDay(currentDate, liveDate);
  const greeting = getPersianGreeting(liveDate);
  const title = isSelectedToday
    ? greeting
    : `برنامه ${getRelativeJalaliLabel(currentDate, liveDate)}`;
  const formattedDate = formatJalaliFullDate(currentDate);

  const hour = liveDate.getHours();
  const greetingIcon: keyof typeof Ionicons.glyphMap =
    hour >= 5 && hour < 12
      ? 'sunny-outline'
      : hour >= 12 && hour < 16
        ? 'sunny'
        : hour >= 16 && hour < 20
          ? 'partly-sunny-outline'
          : 'moon-outline';

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.base, paddingTop: spacing.sm }]}>
      <View style={styles.topRow}>
        {/* Greeting & Date on the right (RTL start) */}
        <View style={styles.textColumn}>
          <View style={styles.greetingTitleRow}>
            {isSelectedToday && (
              <Ionicons
                name={greetingIcon}
                size={22}
                color={colors.accent}
                style={styles.greetingIcon}
              />
            )}
            <Text
              style={[
                typography.titleLarge,
                { color: colors.textPrimary, textAlign: 'right' },
              ]}
            >
              {title}
            </Text>
          </View>
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
            ]}
          >
            {formattedDate}
          </Text>
        </View>

        {/* Top actions on the left (in Persian RTL layout) */}
        <View style={styles.actionsRow}>
          {/* Calendar button */}
          <Pressable
            onPress={() => router.push('/calendar')}
            accessibilityLabel="تقویم شمسی"
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
                borderRadius: radii.full,
                transform: [{ scale: pressed ? 0.90 : 1 }],
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.accent} />
          </Pressable>

          {/* Settings button */}
          <Pressable
            onPress={() => router.push('/settings')}
            accessibilityLabel="تنظیمات"
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
                borderRadius: radii.full,
                transform: [{ scale: pressed ? 0.90 : 1 }],
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    alignItems: 'flex-end',
  },
  greetingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  greetingIcon: {
    marginLeft: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
