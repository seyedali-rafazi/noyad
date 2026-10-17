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

  // Symmetrical 15 days in past + today + 15 days in future (total 31 days)
  // Today is at the exact center (index 15)
  const days = useMemo(
    () => getHorizontalDaysStrip(new Date(), 15, 15, selectedDate),
    [selectedDate]
  );

  const centerDate = useCallback(
    (targetDate: Date, animated = true) => {
      if (!scrollViewRef.current || viewWidth <= 0 || contentWidth <= 0) return;
      const todayIdx = 15;
      const targetIdx = days.findIndex((d) => isSameJalaliDay(d.date, targetDate));
      const idx = targetIdx !== -1 ? targetIdx : todayIdx;

      // In row-reverse, index 15 (Today) is at the exact center of total content
      const midScrollX = (contentWidth - viewWidth) / 2;
      const deltaIdx = idx - todayIdx;
      const targetX = midScrollX + deltaIdx * ITEM_FULL_WIDTH;
      const maxScroll = Math.max(0, contentWidth - viewWidth);
      const clampedX = Math.max(0, Math.min(maxScroll, targetX));

      scrollViewRef.current.scrollTo({ x: clampedX, animated });
    },
    [days, viewWidth, contentWidth]
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
            const mid = Math.max(0, (w - viewWidth) / 2);
            scrollViewRef.current?.scrollTo({ x: mid, animated: false });
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
