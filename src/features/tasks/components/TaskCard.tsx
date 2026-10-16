import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { Task } from '../../../domain/models/task';
import { PriorityBadge } from '../../../shared/components/Badge';
import {
  formatPersianTime,
  getRelativeJalaliLabel,
  isOverdue as checkIsOverdue,
} from '../../../core/calendar';

interface TaskCardProps {
  task: Task;
  onToggleComplete: () => void;
  onPress?: () => void;
  onDelete?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onPress,
  onDelete,
}) => {
  const { colors, radii, spacing, typography, isDark } = useTheme();

  const isCompleted = task.status === 'completed';
  const overdue = task.dueDate && !isCompleted ? checkIsOverdue(task.dueDate) : false;

  const dueLabel = task.dueDate
    ? `${getRelativeJalaliLabel(task.dueDate)} ${formatPersianTime(task.dueDate)}`
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.base,
          borderColor: overdue
            ? colors.danger
            : isDark
            ? colors.border
            : colors.borderLight,
          borderWidth: overdue ? 1.5 : 1,
        },
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Toggle checkbox (RTL: right side) */}
        <Pressable
          onPress={onToggleComplete}
          hitSlop={8}
          style={[
            styles.checkbox,
            {
              borderColor: isCompleted ? colors.success : colors.border,
              backgroundColor: isCompleted ? colors.success : 'transparent',
              borderRadius: radii.sm,
            },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </Pressable>

        {/* Task Details */}
        <View style={styles.detailsColumn}>
          <View style={styles.headerRow}>
            <Text
              numberOfLines={2}
              style={[
                typography.titleSmall,
                {
                  color: isCompleted ? colors.textMuted : colors.textPrimary,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                  textAlign: 'right',
                  flex: 1,
                },
              ]}
            >
              {task.title}
            </Text>
          </View>

          {task.description && (
            <Text
              numberOfLines={2}
              style={[
                typography.bodySmall,
                {
                  color: colors.textSecondary,
                  textAlign: 'right',
                  marginTop: 4,
                  lineHeight: 18,
                },
              ]}
            >
              {task.description}
            </Text>
          )}

          {/* Metadata Row: Time, Priority, Overdue indicator */}
          <View style={styles.metaRow}>
            <PriorityBadge priority={task.priority} size="sm" />

            {dueLabel && (
              <View style={styles.timeTag}>
                <Ionicons
                  name={overdue ? 'alert-circle' : 'time-outline'}
                  size={13}
                  color={overdue ? colors.danger : colors.textSecondary}
                />
                <Text
                  style={[
                    typography.caption,
                    {
                      color: overdue ? colors.danger : colors.textSecondary,
                      fontWeight: overdue ? '600' : '400',
                    },
                  ]}
                >
                  {dueLabel}
                </Text>
              </View>
            )}

            {overdue && (
              <View
                style={[
                  styles.overdueBadge,
                  { backgroundColor: colors.dangerSubtle, borderRadius: radii.full },
                ]}
              >
                <Text style={[typography.caption, { color: colors.danger, fontWeight: '700' }]}>
                  عقب‌افتاده
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Optional delete button */}
        {onDelete && (
          <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailsColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  timeTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  overdueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deleteButton: {
    padding: 4,
    alignSelf: 'center',
  },
});
