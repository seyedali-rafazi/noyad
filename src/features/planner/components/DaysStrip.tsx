import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
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

const ITEM_WIDTH = 50;
const ITEM_MARGIN = 4; // marginHorizontal 4 -> 8px total margin per item
const ITEM_FULL_WIDTH = ITEM_WIDTH + ITEM_MARGIN * 2; // 58px

export const DaysStrip: React.FC<DaysStripProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const { colors, radii, spacing, typography, fonts, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: windowWidth } = useWindowDimensions();

  const [viewWidth, setViewWidth] = useState<number>(windowWidth);
  const [contentWidth, setContentWidth] = useState<number>(0);
  const isInitialScrollDone = useRef(false);

  // Generous 25 days in past + today + 25 days in future (total 51 days)
  const days = useMemo(
    () => getHorizontalDaysStrip(new Date(), 25, 25, selectedDate),
    [selectedDate]
  );

  const centerDate = useCallback(
    (targetDate: Date, animated = true) => {
      if (!scrollViewRef.current || viewWidth <= 0 || contentWidth <= 0) return;
      const targetIdx = days.findIndex((d) => isSameJalaliDay(d.date, targetDate));
      if (targetIdx === -1) return;

      const padding = spacing.base;
      // In row-reverse layout:
      // Index 0 (farthest past) is at the far right.
      // Index days.length - 1 (farthest future) is at the far left (x = 0).
      // Distance of item targetIdx center from left edge (x = 0):
      const itemDistanceFromLeft =
        padding + (days.length - 1 - targetIdx + 0.5) * ITEM_FULL_WIDTH;
      const targetX = itemDistanceFromLeft - viewWidth / 2;
      const maxScroll = Math.max(0, contentWidth - viewWidth);
      const clampedX = Math.max(0, Math.min(maxScroll, targetX));

      scrollViewRef.current.scrollTo({ x: clampedX, animated });
    },
    [days, viewWidth, contentWidth, spacing.base]
  );

  // Auto-center whenever date or measured widths change
  useEffect(() => {
    if (contentWidth > 0 && viewWidth > 0) {
      if (!isInitialScrollDone.current) {
        isInitialScrollDone.current = true;
        centerDate(selectedDate, false);
      } else {
        centerDate(selectedDate, true);
      }
    }
  }, [selectedDate, contentWidth, viewWidth, centerDate]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== viewWidth) {
            setViewWidth(w);
          }
        }}
        onContentSizeChange={(w) => {
          setContentWidth(w);
          if (!isInitialScrollDone.current && w > 0 && viewWidth > 0) {
            isInitialScrollDone.current = true;
            centerDate(selectedDate, false);
          }
        }}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
      >
        {days.map((dayItem: JalaliCalendarDay, idx: number) => {
          const isSelected = isSameJalaliDay(dayItem.date, selectedDate);
          const isToday = dayItem.isToday;

          return (
            <Pressable
              key={idx}
              onPress={() => {
                onSelectDate(dayItem.date);
                centerDate(dayItem.date, true);
              }}
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
                  marginHorizontal: ITEM_MARGIN,
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
    width: ITEM_WIDTH,
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
