import React, { useEffect, useState } from 'react';
import { Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  // 0 = off (left/inactive), 1 = on (right/active)
  const [animValue] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: value ? 1 : 0,
      damping: 20,
      stiffness: 300,
      useNativeDriver: false,
    }).start();
  }, [value, animValue]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  // Interpolate translateX for the knob
  // Total track width: 48, thumb: 22, padding: 3 -> travel distance: 48 - 22 - 6 = 20
  const knobTranslate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  const trackBgColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      colors.accent,
    ],
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={[styles.pressableWrap, style]}
    >
      <Animated.View
        style={[
          styles.track,
          {
            backgroundColor: trackBgColor,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            {
              transform: [{ translateX: knobTranslate }],
              backgroundColor: '#FFFFFF',
              shadowColor: '#000000',
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableWrap: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.5,
    elevation: 2,
  },
});
