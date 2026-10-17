import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import {
  getJalaliMonthGrid,
  PERSIAN_WEEKDAY_NAMES_SHORT,
  JalaliCalendarDay,
  isSameJalaliDay,
  addJalaliMonths,
  subJalaliMonths,
  formatJalali,
} from '../../../core/calendar';

interface TaskDatePickerProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const TaskDatePicker: React.FC<TaskDatePickerProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const { colors, radii, spacing, typography, fonts, isDark } = useTheme();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(selectedDate);

  const gridDays = getJalaliMonthGrid(currentMonthDate, selectedDate);
  const monthYearLabel = formatJalali(currentMonthDate, 'MMMM yyyy');

  const handlePrevMonth = () => {
    setCurrentMonthDate((d) => subJalaliMonths(d, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((d) => addJalaliMonths(d, 1));
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceRaised,
          borderRadius: radii.lg,
          borderColor: isDark ? colors.border : colors.borderLight,
          padding: spacing.sm,
        },
      ]}
    >
      {/* Month Navigation Header */}
      <View style={styles.navRow}>
        <Pressable
          onPress={handlePrevMonth}
          hitSlop={8}
          style={[styles.arrowButton, { borderRadius: radii.full }]}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </Pressable>

        <Text
          style={[
            typography.titleSmall,
            { fontFamily: fonts.bold, color: colors.textPrimary },
          ]}
        >
          {monthYearLabel}
        </Text>

        <Pressable
          onPress={handleNextMonth}
          hitSlop={8}
          style={[styles.arrowButton, { borderRadius: radii.full }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Weekday Labels (Saturday to Friday) */}
      <View style={styles.weekdayRow}>
        {PERSIAN_WEEKDAY_NAMES_SHORT.map((weekday, idx) => (
          <View key={idx} style={styles.weekdayCell}>
            <Text
              style={[
                typography.caption,
                {
                  fontFamily: fonts.semiBold,
                  color: idx === 6 ? colors.danger : colors.textMuted,
                  fontSize: 11,
                  fontWeight: '600',
                },
              ]}
            >
              {weekday}
            </Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {gridDays.map((dayItem: JalaliCalendarDay, idx: number) => {
          const isSelected = isSameJalaliDay(dayItem.date, selectedDate);
          const isCurrentMonth = dayItem.isCurrentMonth;
          const isToday = dayItem.isToday;

          return (
            <Pressable
              key={idx}
              onPress={() => onSelectDate(dayItem.date)}
              style={styles.dayCellWrapper}
            >
              <View
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: isSelected
                      ? colors.accent
                      : isToday
                      ? isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)'
                      : 'transparent',
                    borderRadius: radii.full,
                    borderWidth: isToday && !isSelected ? 1 : 0,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.caption,
                    {
                      fontFamily: isSelected || isToday ? fonts.bold : fonts.regular,
                      color: isSelected
                        ? '#FFFFFF'
                        : !isCurrentMonth
                        ? colors.textMuted
                        : colors.textPrimary,
                      fontWeight: isSelected || isToday ? '700' : '400',
                      opacity: !isCurrentMonth ? 0.35 : 1,
                      fontSize: 12,
                    },
                  ]}
                >
                  {dayItem.dayNumberPersian}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginVertical: 6,
  },
  navRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  arrowButton: {
    padding: 6,
  },
  weekdayRow: {
    flexDirection: 'row-reverse',
    width: '100%',
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCellWrapper: {
    width: '14.285%',
    aspectRatio: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    width: '90%',
    height: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
