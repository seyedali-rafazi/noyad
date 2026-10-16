import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { useTheme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'subtle';
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'flat',
  onPress,
}) => {
  const { colors, radii, spacing, isDark } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return colors.surfaceRaised;
      case 'subtle':
        return colors.surfaceSubtle;
      case 'flat':
      default:
        return colors.surface;
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: radii.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: isDark ? colors.border : colors.borderLight,
    shadowColor: isDark ? '#000000' : '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 6,
    elevation: 2,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          cardStyle,
          style,
          pressed && { opacity: 0.88, transform: [{ scale: 0.995 }] },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.container, cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
