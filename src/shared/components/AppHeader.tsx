import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
}) => {
  const { colors, spacing, typography, isDark } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          backgroundColor: colors.background,
          borderBottomColor: isDark ? colors.border : colors.borderLight,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Right side in Persian (Title / Info) */}
        <View style={styles.textColumn}>
          <Text
            style={[
              typography.titleMedium,
              { color: colors.textPrimary, textAlign: 'right' },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                typography.bodySmall,
                { color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Left side in Persian (Actions or Back button) */}
        <View style={styles.actionsRow}>
          {rightAction}
          {showBack && (
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="chevron-forward" // In RTL back points right/forward
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
