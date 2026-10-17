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
function parseDigits(raw: string): number | null {
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

  const [isHourFocused, setIsHourFocused] = useState(false);
  const [isMinuteFocused, setIsMinuteFocused] = useState(false);

  const [hourInputText, setHourInputText] = useState<string | null>(null);
  const [minuteInputText, setMinuteInputText] = useState<string | null>(null);

  const hourDisplay =
    isHourFocused && hourInputText !== null
      ? hourInputText
      : toPersianDigits(selectedHour.toString().padStart(2, '0'));

  const minuteDisplay =
    isMinuteFocused && minuteInputText !== null
      ? minuteInputText
      : toPersianDigits(selectedMinute.toString().padStart(2, '0'));

  const handleHourFocus = () => {
    setIsHourFocused(true);
    setHourInputText(toPersianDigits(selectedHour.toString().padStart(2, '0')));
  };

  const handleHourChange = (text: string) => {
    const parsed = parseDigits(text);

    if (parsed === null) {
      setHourInputText('');
      return;
    }

    const clamped = Math.max(0, Math.min(23, parsed));
    setHourInputText(toPersianDigits(clamped.toString()));
    onChangeHour(clamped);

    // Auto-advance to minute input when 2 digits are entered
    const cleanDigits = text.replace(/[^0-9۰-۹٠-٩]/g, '');
    if (cleanDigits.length >= 2) {
      minuteInputRef.current?.focus();
    }
  };

  const handleHourBlur = () => {
    setIsHourFocused(false);
    if (hourInputText !== null) {
      const parsed = parseDigits(hourInputText);
      const val = parsed !== null ? Math.max(0, Math.min(23, parsed)) : selectedHour;
      onChangeHour(val);
    }
    setHourInputText(null);
  };

  const handleMinuteFocus = () => {
    setIsMinuteFocused(true);
    setMinuteInputText(toPersianDigits(selectedMinute.toString().padStart(2, '0')));
  };

  const handleMinuteChange = (text: string) => {
    const parsed = parseDigits(text);

    if (parsed === null) {
      setMinuteInputText('');
      return;
    }

    const clamped = Math.max(0, Math.min(59, parsed));
    setMinuteInputText(toPersianDigits(clamped.toString()));
    onChangeMinute(clamped);
  };

  const handleMinuteBlur = () => {
    setIsMinuteFocused(false);
    if (minuteInputText !== null) {
      const parsed = parseDigits(minuteInputText);
      const val = parsed !== null ? Math.max(0, Math.min(59, parsed)) : selectedMinute;
      onChangeMinute(val);
    }
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
            onChangeText={handleHourChange}
            onFocus={handleHourFocus}
            onBlur={handleHourBlur}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
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
            onChangeText={handleMinuteChange}
            onFocus={handleMinuteFocus}
            onBlur={handleMinuteBlur}
            onKeyPress={handleMinuteKeyPress}
            keyboardType="number-pad"
            maxLength={2}
            selectTextOnFocus
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
