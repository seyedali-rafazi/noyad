import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useTheme } from '../../../shared/theme';
import { toPersianDigits } from '../../../core/calendar';

interface ScrollTimePickerProps {
  selectedHour: number; // 0 - 23
  selectedMinute: number; // 0 - 59
  onChangeHour: (hour: number) => void;
  onChangeMinute: (minute: number) => void;
}

/**
 * Normalizes Persian, Arabic, and English digits into an integer, or null if invalid.
 */
export function parseTimeDigits(raw: string): number | null {
  const english = raw
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
    .replace(/[^0-9]/g, '');

  if (!english) return null;
  return parseInt(english, 10);
}

export const ScrollTimePicker: React.FC<ScrollTimePickerProps> = ({
  selectedHour,
  selectedMinute,
  onChangeHour,
  onChangeMinute,
}) => {
  const { colors, radii, typography, fonts, isDark } = useTheme();

  const hourInputRef = useRef<TextInput>(null);
  const minuteInputRef = useRef<TextInput>(null);

  // Refs prevent stale-closure reads when onBlur fires synchronously after focus()
  const hourTextRef = useRef<string | null>(null);
  const minuteTextRef = useRef<string | null>(null);

  const [isHourFocused, setIsHourFocused] = useState(false);
  const [isMinuteFocused, setIsMinuteFocused] = useState(false);

  const [hourInputText, setHourInputText] = useState<string | null>(null);
  const [minuteInputText, setMinuteInputText] = useState<string | null>(null);

  const paddedHour = toPersianDigits(selectedHour.toString().padStart(2, '0'));
  const paddedMinute = toPersianDigits(selectedMinute.toString().padStart(2, '0'));

  const hourDisplay = isHourFocused && hourInputText !== null ? hourInputText : paddedHour;
  const minuteDisplay = isMinuteFocused && minuteInputText !== null ? minuteInputText : paddedMinute;

  const handleHourFocus = () => {
    setIsHourFocused(true);
    hourTextRef.current = '';
    setHourInputText('');
  };

  const handleHourChange = (text: string) => {
    const cleanDigits = text
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
      .replace(/[^0-9]/g, '')
      .slice(0, 2);

    if (!cleanDigits) {
      hourTextRef.current = '';
      setHourInputText('');
      return;
    }

    const parsed = parseInt(cleanDigits, 10);
    const clamped = Math.max(0, Math.min(23, parsed));
    const displayText =
      cleanDigits.length === 2
        ? toPersianDigits(clamped.toString().padStart(2, '0'))
        : toPersianDigits(cleanDigits);

    hourTextRef.current = displayText;
    setHourInputText(displayText);
    onChangeHour(clamped);

    // Auto-advance to minute input after state/ref update when 2 digits are entered
    if (cleanDigits.length >= 2) {
      setTimeout(() => {
        minuteInputRef.current?.focus();
      }, 0);
    }
  };

  const handleHourBlur = () => {
    setIsHourFocused(false);
    const latest = hourTextRef.current;
    if (latest !== null && latest.length > 0) {
      const parsed = parseTimeDigits(latest);
      if (parsed !== null) {
        onChangeHour(Math.max(0, Math.min(23, parsed)));
      }
    }
    hourTextRef.current = null;
    setHourInputText(null);
  };

  const handleMinuteFocus = () => {
    setIsMinuteFocused(true);
    minuteTextRef.current = '';
    setMinuteInputText('');
  };

  const handleMinuteChange = (text: string) => {
    const cleanDigits = text
      .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
      .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString())
      .replace(/[^0-9]/g, '')
      .slice(0, 2);

    if (!cleanDigits) {
      minuteTextRef.current = '';
      setMinuteInputText('');
      return;
    }

    const parsed = parseInt(cleanDigits, 10);
    const clamped = Math.max(0, Math.min(59, parsed));
    const displayText =
      cleanDigits.length === 2
        ? toPersianDigits(clamped.toString().padStart(2, '0'))
        : toPersianDigits(cleanDigits);

    minuteTextRef.current = displayText;
    setMinuteInputText(displayText);
    onChangeMinute(clamped);
  };

  const handleMinuteBlur = () => {
    setIsMinuteFocused(false);
    const latest = minuteTextRef.current;
    if (latest !== null && latest.length > 0) {
      const parsed = parseTimeDigits(latest);
      if (parsed !== null) {
        onChangeMinute(Math.max(0, Math.min(59, parsed)));
      }
    }
    minuteTextRef.current = null;
    setMinuteInputText(null);
  };

  const handleMinuteKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    // If backspacing on empty minute input, jump back to hour
    if (e.nativeEvent.key === 'Backspace' && (!minuteDisplay || minuteDisplay.length === 0)) {
      hourInputRef.current?.focus();
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.timeInputRow}>
        {/* Hour Input Box (Left) */}
        <View style={styles.inputBoxContainer}>
          <Text
            style={[
              typography.caption,
              styles.boxLabel,
              { color: isHourFocused ? colors.accent : colors.textSecondary },
            ]}
          >
            ساعت
          </Text>
          <TextInput
            ref={hourInputRef}
            value={hourDisplay}
            placeholder={paddedHour}
            placeholderTextColor={colors.textMuted}
            onChangeText={handleHourChange}
            onFocus={handleHourFocus}
            onBlur={handleHourBlur}
            keyboardType="number-pad"
            maxLength={2}
            textAlign="center"
            returnKeyType="next"
            onSubmitEditing={() => minuteInputRef.current?.focus()}
            style={[
              styles.inputBox,
              {
                fontFamily: fonts.bold,
                backgroundColor: isDark ? colors.surfaceRaised : '#F4F5F7',
                borderColor: isHourFocused
                  ? colors.accent
                  : isDark
                  ? colors.border
                  : colors.borderLight,
                borderWidth: isHourFocused ? 2 : 1,
                borderRadius: radii.lg,
                color: colors.textPrimary,
              },
            ]}
          />
        </View>

        {/* Separator Colon */}
        <View style={styles.colonContainer}>
          <Text
            style={[
              styles.colonText,
              {
                color: colors.accent,
                fontFamily: fonts.bold,
              },
            ]}
          >
            :
          </Text>
        </View>

        {/* Minute Input Box (Right) */}
        <View style={styles.inputBoxContainer}>
          <Text
            style={[
              typography.caption,
              styles.boxLabel,
              { color: isMinuteFocused ? colors.accent : colors.textSecondary },
            ]}
          >
            دقیقه
          </Text>
          <TextInput
            ref={minuteInputRef}
            value={minuteDisplay}
            placeholder={paddedMinute}
            placeholderTextColor={colors.textMuted}
            onChangeText={handleMinuteChange}
            onFocus={handleMinuteFocus}
            onBlur={handleMinuteBlur}
            onKeyPress={handleMinuteKeyPress}
            keyboardType="number-pad"
            maxLength={2}
            textAlign="center"
            returnKeyType="done"
            style={[
              styles.inputBox,
              {
                fontFamily: fonts.bold,
                backgroundColor: isDark ? colors.surfaceRaised : '#F4F5F7',
                borderColor: isMinuteFocused
                  ? colors.accent
                  : isDark
                  ? colors.border
                  : colors.borderLight,
                borderWidth: isMinuteFocused ? 2 : 1,
                borderRadius: radii.lg,
                color: colors.textPrimary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inputBoxContainer: {
    alignItems: 'center',
  },
  boxLabel: {
    marginBottom: 6,
    fontWeight: '700',
    fontSize: 12,
  },
  inputBox: {
    width: 84,
    height: 56,
    fontSize: 26,
    textAlign: 'center',
  },
  colonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    width: 20,
  },
  colonText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
});
