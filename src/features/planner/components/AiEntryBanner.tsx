import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../shared/theme';

export const AiEntryBanner: React.FC = () => {
  const { colors, radii, spacing, typography } = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/assistant')}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.accent,
          borderRadius: radii.lg,
          padding: spacing.base,
          marginHorizontal: spacing.base,
          marginVertical: spacing.sm,
          borderWidth: 1.2,
        },
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Sparkle Icon Container */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: colors.accentSubtle,
              borderRadius: radii.full,
            },
          ]}
        >
          <Ionicons name="sparkles" size={22} color={colors.accent} />
        </View>

        {/* Text Info */}
        <View style={styles.textColumn}>
          <View style={styles.badgeRow}>
            <Text
              style={[
                typography.titleSmall,
                { color: colors.textPrimary, textAlign: 'right' },
              ]}
            >
              دستیار هوشمند برنامه‌ریزی
            </Text>
            <View
              style={[
                styles.prototypePill,
                { backgroundColor: colors.accentSubtle, borderRadius: radii.full },
              ]}
            >
              <Text style={[typography.caption, { color: colors.accent, fontWeight: '700' }]}>
                هوشمند
              </Text>
            </View>
          </View>

          <Text
            style={[
              typography.bodySmall,
              { color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
            ]}
          >
            کارهای امروزمو مرتب کن یا برای فردا برنامه بریز...
          </Text>
        </View>

        {/* Left Arrow in RTL */}
        <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  prototypePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
