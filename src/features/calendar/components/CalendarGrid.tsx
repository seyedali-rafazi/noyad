import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../shared/theme';
import {
  getJalaliMonthGrid,
  PERSIAN_WEEKDAY_NAMES_SHORT,
  JalaliCalendarDay,
  isSameJalaliDay,
} from '../../../core/calendar';
import { Task } from '../../../domain/models/task';

interface CalendarGridProps {
  currentMonthDate: Date;
  selectedDate: Date;
  tasks: Task[];
  onSelectDate: (date: Date) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonthDate,
  selectedDate,
  tasks,
  onSelectDate,
}) => {
  const { colors, radii, typography, fonts, isDark } = useTheme();

  const gridDays = getJalaliMonthGrid(currentMonthDate, selectedDate);

  // Check if a day has tasks scheduled
  const dayHasTasks = (date: Date) => {
    return tasks.some((t) => t.dueDate && isSameJalaliDay(new Date(t.dueDate), date));
  };

  return (
    <View style={styles.container}>
      {/* 7-column Weekday Labels */}
      <View style={styles.weekdayRow}>
        {PERSIAN_WEEKDAY_NAMES_SHORT.map((weekday, idx) => (
          <View key={idx} style={styles.weekdayCell}>
            <Text
              style={[
                typography.caption,
                {
                  fontFamily: fonts.semiBold,
                  color: idx === 6 ? colors.danger : colors.textMuted, // جمعه (Friday) is red in Persian calendar
                  fontWeight: '600',
                },
              ]}
            >
              {weekday}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid of Days */}
      <View style={styles.daysGrid}>
        {gridDays.map((dayItem: JalaliCalendarDay, idx: number) => {
          const isSelected = isSameJalaliDay(dayItem.date, selectedDate);
          const hasTasks = dayHasTasks(dayItem.date);
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
                      ? colors.surfaceRaised
                      : 'transparent',
                    borderRadius: radii.full,
                    borderWidth: isToday && !isSelected ? 1 : 0,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodyMedium,
                    {
                      fontFamily: isSelected || isToday ? fonts.bold : fonts.regular,
                      color: isSelected
                        ? '#FFFFFF'
                        : !isCurrentMonth
                        ? colors.textMuted
                        : colors.textPrimary,
                      fontWeight: isSelected || isToday ? '700' : '400',
                      opacity: !isCurrentMonth ? 0.35 : 1,
                    },
                  ]}
                >
                  {dayItem.dayNumberPersian}
                </Text>

                {/* Dot marker for tasks */}
                {hasTasks && (
                  <View
                    style={[
                      styles.taskDot,
                      {
                        backgroundColor: isSelected
                          ? '#FFFFFF'
                          : isDark
                          ? colors.accent
                          : colors.accent,
                      },
                    ]}
                  />
                )}
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
    width: '100%',
  },
  weekdayRow: {
    flexDirection: 'row-reverse',
    width: '100%',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  daysGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCellWrapper: {
    width: '14.285%', // 100% / 7 columns
    aspectRatio: 1,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    width: '88%',
    height: '88%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
});
