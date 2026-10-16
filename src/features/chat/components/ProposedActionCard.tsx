import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { ProposedActionPreview } from '../../../shared/preview/mockData';
import { Button } from '../../../shared/components/Button';

interface ProposedActionCardProps {
  action: ProposedActionPreview;
  onConfirm: () => void;
}

export const ProposedActionCard: React.FC<ProposedActionCardProps> = ({
  action,
  onConfirm,
}) => {
  const { colors, radii, spacing, typography, isDark } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  if (isDismissed) return null;

  const isDelete = action.type === 'delete_task' || action.isDestructive;

  const handleConfirm = () => {
    setIsApplied(true);
    onConfirm();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : colors.surfaceRaised,
          borderRadius: radii.md,
          padding: spacing.md,
          borderColor: isDelete
            ? colors.danger
            : isDark
            ? colors.border
            : colors.borderLight,
          borderWidth: 1,
          marginTop: spacing.sm,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isDelete ? colors.dangerSubtle : colors.accentSubtle,
              borderRadius: radii.full,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              { color: isDelete ? colors.danger : colors.accent, fontWeight: '700' },
            ]}
          >
            {isDelete ? 'عملیات حساس' : 'پیشنهاد دستیار'}
          </Text>
        </View>

        <Ionicons
          name={isDelete ? 'warning-outline' : 'sparkles-outline'}
          size={16}
          color={isDelete ? colors.danger : colors.accent}
        />
      </View>

      {/* Action Title */}
      <Text
        style={[
          typography.titleSmall,
          { color: colors.textPrimary, textAlign: 'right', marginTop: 6 },
        ]}
      >
        {action.title}
      </Text>

      {/* Meta tags */}
      <View style={styles.metaRow}>
        {action.dueDateLabel && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {action.dueDateLabel}
            </Text>
          </View>
        )}
        {action.priorityLabel && (
          <View style={styles.metaItem}>
            <Ionicons name="flag-outline" size={12} color={colors.textSecondary} />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              اولویت: {action.priorityLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={[styles.buttonRow, { marginTop: spacing.md }]}>
        {isApplied ? (
          <View style={styles.appliedBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text
              style={[
                typography.caption,
                { color: colors.success, fontWeight: '700', marginRight: 4 },
              ]}
            >
              اعمال شد
            </Text>
          </View>
        ) : (
          <>
            <Button
              title="صرف‌نظر"
              variant="outline"
              size="sm"
              onPress={() => setIsDismissed(true)}
              style={{ flex: 1 }}
            />
            <Button
              title={isDelete ? 'تایید حذف' : 'تایید و اعمال'}
              variant={isDelete ? 'danger' : 'primary'}
              size="sm"
              onPress={handleConfirm}
              style={{ flex: 1 }}
            />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  buttonRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  appliedBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
  },
});
