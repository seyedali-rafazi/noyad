import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '../../../shared/theme';
import {
  getHorizontalDaysStrip,
  JalaliCalendarDay,
  isSameJalaliDay,
} from '../../../core/calendar';

interface DaysStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const DaysStrip: React.FC<DaysStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const { colors, radii, spacing, typography, fonts, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const days = getHorizontalDaysStrip(new Date(), 7, 14, selectedDate);

  // Auto-scroll to selected day on mount
  useEffect(() => {
    // 7 past days * approx 56px item width
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: 7 * 56, animated: false });
    }, 100);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
      >
        {days.map((dayItem: JalaliCalendarDay, idx: number) => {
          const isSelected = isSameJalaliDay(dayItem.date, selectedDate);
          const isToday = dayItem.isToday;

          return (
            <Pressable
              key={idx}
              onPress={() => onSelectDate(dayItem.date)}
              style={[
                styles.dayPill,
                {
                  backgroundColor: isSelected
                    ? colors.accent
                    : isToday
                    ? colors.surfaceRaised
                    : colors.surface,
                  borderColor: isSelected
                    ? colors.accent
                    : isToday
                    ? colors.accent
                    : isDark
                    ? colors.border
                    : colors.borderLight,
                  borderRadius: radii.lg,
                  borderWidth: isToday || isSelected ? 1.5 : 1,
                  marginHorizontal: 4,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  {
                    fontFamily: isSelected || isToday ? fonts.bold : fonts.medium,
                    color: isSelected
                      ? '#FFFFFF'
                      : isToday
                      ? colors.accent
                      : colors.textSecondary,
                    fontWeight: isSelected || isToday ? '700' : '500',
                  },
                ]}
              >
                {dayItem.weekdayName.substring(0, 2)}
              </Text>
              <Text
                style={[
                  typography.titleSmall,
                  {
                    fontFamily: fonts.bold,
                    color: isSelected
                      ? '#FFFFFF'
                      : colors.textPrimary,
                    fontWeight: '700',
                    marginTop: 2,
                  },
                ]}
              >
                {dayItem.dayNumberPersian}
              </Text>
              {isToday && (
                <View
                  style={[
                    styles.todayDot,
                    { backgroundColor: isSelected ? '#FFFFFF' : colors.accent },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  dayPill: {
    width: 50,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
