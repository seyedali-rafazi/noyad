import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'calendar-outline',
  title,
  description,
  actionTitle,
  onActionPress,
  style,
}) => {
  const { colors, spacing, typography, radii } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xl }, style]}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: colors.surfaceSubtle,
            borderRadius: radii.full,
            width: 64,
            height: 64,
            marginBottom: spacing.base,
          },
        ]}
      >
        <Ionicons name={iconName} size={32} color={colors.textMuted} />
      </View>
      <Text
        style={[
          typography.titleSmall,
          {
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          typography.bodyMedium,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: actionTitle ? spacing.base : 0,
            maxWidth: 280,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onActionPress && (
        <Button
          title={actionTitle}
          onPress={onActionPress}
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.sm }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
