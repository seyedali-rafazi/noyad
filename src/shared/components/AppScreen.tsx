import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StatusBar, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface AppScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: readonly ('top' | 'right' | 'bottom' | 'left')[];
  animated?: boolean;
}

export const AppScreen: React.FC<AppScreenProps> = ({
  children,
  style,
  edges = ['top'],
  animated = false,
}) => {
  const { colors, isDark } = useTheme();
  const [animValue] = useState(() => new Animated.Value(animated ? 0 : 1));

  useEffect(() => {
    if (animated) {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [animated, animValue]);

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.container,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {animated ? (
        <Animated.View
          style={[
            styles.content,
            {
              opacity: animValue,
              transform: [
                {
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
