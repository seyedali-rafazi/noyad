import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { SUGGESTED_PROMPTS } from '../../../shared/preview/mockData';

interface ChatComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSend,
  disabled = false,
}) => {
  const { colors, radii, spacing, typography, fonts, isDark } = useTheme();
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handlePromptPress = (prompt: string) => {
    onSend(prompt);
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: isDark ? colors.border : colors.borderLight,
        },
      ]}
    >
      {/* Horizontal Suggested Prompts */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.promptsContainer, { paddingHorizontal: spacing.base }]}
      >
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <Pressable
            key={idx}
            onPress={() => handlePromptPress(prompt)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.promptChip,
              {
                backgroundColor: colors.surface,
                borderColor: isDark ? colors.border : colors.borderLight,
                borderRadius: radii.full,
              },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Ionicons name="sparkles-outline" size={12} color={colors.accent} style={{ marginLeft: 4 }} />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {prompt}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Input Row */}
      <View style={[styles.inputRow, { paddingHorizontal: spacing.base, paddingBottom: spacing.sm }]}>
        {/* Send Button (in RTL: on the left side) */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSend ? colors.accent : colors.surfaceRaised,
              borderRadius: radii.full,
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? '#FFFFFF' : colors.textMuted}
          />
        </Pressable>

        {/* Text Input (RTL: on the right side) */}
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? colors.border : colors.borderLight,
              borderRadius: radii.xl,
            },
          ]}
        >
          <TextInput
            placeholder="پیام یا درخواست خود را بنویسید..."
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            style={[
              styles.textInput,
              {
                color: colors.textPrimary,
                fontSize: typography.bodyMedium.fontSize,
                fontFamily: fonts.regular,
              },
            ]}
            textAlign="right"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  promptsContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingBottom: 8,
  },
  promptChip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row', // left: send button, right: text input
    alignItems: 'flex-end',
    gap: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  textInput: {
    padding: 0,
    writingDirection: 'rtl',
  },
});
