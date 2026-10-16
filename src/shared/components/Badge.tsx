import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { TaskPriority, TaskStatus } from '../../domain/types/common';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const { colors, radii, spacing, typography } = useTheme();

  const getPriorityConfig = () => {
    switch (priority) {
      case 'urgent':
        return { label: 'فوری', color: colors.priorityUrgent, bg: colors.dangerSubtle };
      case 'high':
        return { label: 'زیاد', color: colors.priorityHigh, bg: colors.warningSubtle };
      case 'medium':
        return { label: 'متوسط', color: colors.priorityMedium, bg: colors.successSubtle };
      case 'low':
      default:
        return { label: 'کم', color: colors.priorityLow, bg: colors.surfaceSubtle };
    }
  };

  const { label, color, bg } = getPriorityConfig();

  const containerStyle: ViewStyle = {
    backgroundColor: bg,
    paddingHorizontal: size === 'sm' ? spacing.xs + 4 : spacing.sm,
    paddingVertical: size === 'sm' ? 3 : spacing.xs + 1,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  };

  return (
    <View style={containerStyle}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          typography.caption,
          {
            color,
            fontSize: size === 'sm' ? 11 : 12,
            fontWeight: '600',
            writingDirection: 'rtl',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { colors, radii, spacing, typography } = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return { label: 'انجام شد', color: colors.success, bg: colors.successSubtle };
      case 'in_progress':
        return { label: 'در حال انجام', color: colors.accent, bg: colors.accentSubtle };
      case 'cancelled':
        return { label: 'لغو شده', color: colors.textMuted, bg: colors.surfaceSubtle };
      case 'pending':
      default:
        return { label: 'در انتظار', color: colors.warning, bg: colors.warningSubtle };
    }
  };

  const { label, color, bg } = getStatusConfig();

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radii.full,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={[
          typography.caption,
          {
            color,
            fontWeight: '600',
            writingDirection: 'rtl',
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
