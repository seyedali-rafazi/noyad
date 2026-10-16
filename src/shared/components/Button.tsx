import React from 'react';
import {
  Pressable,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  disabled = false,
  loading = false,
  style,
}) => {
  const { colors, radii, spacing, typography, fonts } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    let bg = colors.accent;
    let border = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        bg = colors.accent;
        break;
      case 'secondary':
        bg = colors.surfaceRaised;
        break;
      case 'outline':
        bg = 'transparent';
        border = colors.border;
        borderWidth = 1;
        break;
      case 'ghost':
        bg = 'transparent';
        break;
      case 'danger':
        bg = colors.danger;
        break;
    }

    let paddingVertical: number = spacing.sm + 4;
    let paddingHorizontal: number = spacing.base;

    if (size === 'sm') {
      paddingVertical = spacing.xs + 4;
      paddingHorizontal = spacing.md;
    } else if (size === 'lg') {
      paddingVertical = spacing.md + 2;
      paddingHorizontal = spacing.xl;
    }

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth,
      borderRadius: radii.md,
      paddingVertical,
      paddingHorizontal,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      opacity: disabled || loading ? 0.5 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color = '#FFFFFF';

    switch (variant) {
      case 'primary':
      case 'danger':
        color = '#FFFFFF';
        break;
      case 'secondary':
        color = colors.textPrimary;
        break;
      case 'outline':
        color = colors.textPrimary;
        break;
      case 'ghost':
        color = colors.accent;
        break;
    }

    let fontSize: number = typography.bodyMedium.fontSize;
    if (size === 'sm') fontSize = typography.bodySmall.fontSize;
    if (size === 'lg') fontSize = typography.bodyLarge.fontSize;

    return {
      fontFamily: fonts.semiBold,
      color,
      fontSize,
      fontWeight: '600',
      writingDirection: 'rtl',
      textAlign: 'center',
      includeFontPadding: false,
    };
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        getContainerStyle(),
        style,
        pressed && !disabled && !loading && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.accent}
        />
      ) : (
        <>
          {icon && iconPosition === 'start' && <View>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'end' && <View>{icon}</View>}
        </>
      )}
    </Pressable>
  );
};
