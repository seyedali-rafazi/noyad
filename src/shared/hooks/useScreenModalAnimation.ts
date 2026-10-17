import { useState, useEffect, useCallback } from 'react';
import { Animated, Easing, Platform, BackHandler, StyleProp, ViewStyle, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

interface UseScreenModalAnimationOptions {
  onBeforeClose?: () => void;
  fallbackRoute?: string;
  durationIn?: number;
  durationOut?: number;
}

export function useScreenModalAnimation(options?: UseScreenModalAnimationOptions) {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const slideDistance = windowHeight > 0 ? windowHeight : 850;

  const durationIn = options?.durationIn ?? 280;
  const durationOut = options?.durationOut ?? 240;
  const fallbackRoute = options?.fallbackRoute ?? '/(tabs)';

  const [animValue] = useState(() => new Animated.Value(0));
  const [isClosing, setIsClosing] = useState(false);

  // Entrance animation on mount: slide up from bottom to top at 100% solid opacity
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: 1,
      duration: durationIn,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [animValue, durationIn]);

  // Smooth exit animation: slide down to bottom off-screen at 100% solid opacity, then close
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    options?.onBeforeClose?.();

    Animated.timing(animValue, {
      toValue: 0,
      duration: durationOut,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace(fallbackRoute as any);
        }
      } catch {
        router.replace(fallbackRoute as any);
      }
    });
  }, [isClosing, animValue, durationOut, options, router, fallbackRoute]);

  // Intercept hardware back button on Android to play the exit animation
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => subscription.remove();
  }, [handleClose]);

  // Pure vertical slide with 100% solid opacity — zero opacity fading, zero skeleton look
  const animatedStyle: StyleProp<ViewStyle> = {
    flex: 1,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [slideDistance, 0],
        }),
      },
    ],
  };

  return {
    handleClose,
    animatedStyle,
    isClosing,
  };
}
