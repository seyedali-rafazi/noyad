import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

interface TextInputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...rest
}) => {
  const { colors, radii, spacing, typography, fonts, isDark } = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'right',
              marginBottom: 6,
              fontWeight: '600',
              fontFamily: fonts.semiBold,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.danger
              : isDark
              ? colors.border
              : colors.borderLight,
            borderRadius: radii.md,
            paddingHorizontal: spacing.base,
            paddingVertical: spacing.md - 2,
            color: colors.textPrimary,
            fontSize: typography.bodyMedium.fontSize,
            fontFamily: fonts.regular,
          },
          style,
        ]}
        textAlign="right"
        {...rest}
      />

      {error ? (
        <Text
          style={[
            typography.caption,
            {
              color: colors.danger,
              textAlign: 'right',
              marginTop: 4,
              fontFamily: fonts.medium,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    writingDirection: 'rtl',
    fontFamily: 'Vazirmatn-Regular',
  },
});
