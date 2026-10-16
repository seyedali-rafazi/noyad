import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { Card } from '../../../shared/components/Card';
import { toPersianDigits } from '../../../core/calendar';

interface TaskSummaryCardProps {
  totalCount: number;
  completedCount: number;
}

export const TaskSummaryCard: React.FC<TaskSummaryCardProps> = ({
  totalCount,
  completedCount,
}) => {
  const { colors, radii, spacing, typography } = useTheme();

  const remainingCount = Math.max(0, totalCount - completedCount);
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card variant="flat" style={{ marginHorizontal: spacing.base, marginVertical: spacing.xs }}>
      <View style={styles.headerRow}>
        <View style={styles.badgeWrapper}>
          <Text
            style={[
              typography.caption,
              { color: colors.accent, fontWeight: '700' },
            ]}
          >
            {toPersianDigits(percentage)}٪
          </Text>
        </View>

        <View style={styles.titleWrapper}>
          <Text style={[typography.titleSmall, { color: colors.textPrimary, textAlign: 'right' }]}>
            وضعیت کارهای امروز
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
            ]}
          >
            {totalCount === 0
              ? 'هیچ کاری برای امروز تعریف نشده است'
              : remainingCount === 0
              ? 'همه کارهای امروز با موفقیت انجام شدند! 🎉'
              : `${toPersianDigits(remainingCount)} کار باقی‌مانده از مجموع ${toPersianDigits(
                  totalCount
                )} کار`}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        style={[
          styles.progressBarBg,
          {
            backgroundColor: colors.surfaceRaised,
            borderRadius: radii.full,
            marginTop: spacing.md,
          },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: percentage === 100 ? colors.success : colors.accent,
              borderRadius: radii.full,
              width: `${Math.max(percentage, 4)}%`,
            },
          ]}
        />
      </View>

      {/* Mini stats row */}
      <View style={[styles.statsRow, { marginTop: spacing.md }]}>
        <View style={styles.statItem}>
          <Ionicons name="checkbox-outline" size={16} color={colors.success} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            انجام شده: {toPersianDigits(completedCount)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={colors.warning} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            در انتظار: {toPersianDigits(remainingCount)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="list-outline" size={16} color={colors.textMuted} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            کل: {toPersianDigits(totalCount)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'flex-end',
  },
  badgeWrapper: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBarBg: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
    flexDirection: 'row-reverse',
  },
  progressBarFill: {
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
});
