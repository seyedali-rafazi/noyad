import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Text,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { SUGGESTED_PROMPTS } from '../../../shared/preview/mockData';

interface WebSpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: {
        transcript: string;
      };
    };
  };
}

interface WebSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function createWebSpeechRecognition(): WebSpeechRecognition | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: new () => WebSpeechRecognition;
    webkitSpeechRecognition?: new () => WebSpeechRecognition;
  };
  const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (!Ctor) return null;
  const instance = new Ctor();
  instance.lang = 'fa-IR';
  instance.interimResults = true;
  instance.continuous = false;
  return instance;
}

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
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  const handleToggleVoice = () => {
    if (disabled) return;

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
      return;
    }

    const recognition = createWebSpeechRecognition();
    if (!recognition) {
      setVoiceHint('ورودی صوتی در این محیط پشتیبانی نمی‌شود؛ از کیبورد صوتی دستگاه استفاده کنید.');
      setTimeout(() => setVoiceHint(null), 3500);
      return;
    }

    recognitionRef.current = recognition;
    const baseText = text.trim();

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i]?.[0]?.transcript ?? '';
      }
      const combined = baseText ? `${baseText} ${transcript.trim()}` : transcript.trim();
      setText(combined);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceHint('دریافت صدا ناموفق بود. لطفاً مجوز میکروفون را بررسی کنید.');
      setTimeout(() => setVoiceHint(null), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      setVoiceHint(null);
      setIsListening(true);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
    }
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

      {voiceHint ? (
        <Text
          style={[
            typography.caption,
            {
              color: colors.textMuted,
              textAlign: 'right',
              paddingHorizontal: spacing.base,
              paddingBottom: 4,
            },
          ]}
        >
          {voiceHint}
        </Text>
      ) : null}

      {/* Input Row */}
      <View style={[styles.inputRow, { paddingHorizontal: spacing.base, paddingBottom: spacing.sm }]}>
        {/* Send Button (in RTL: on the left side) */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityLabel="ارسال پیام"
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

        {/* Voice Input Button */}
        <Pressable
          onPress={handleToggleVoice}
          disabled={disabled}
          accessibilityLabel={isListening ? 'توقف ضبط صدا' : 'ورودی صوتی'}
          style={[
            styles.sendButton,
            {
              backgroundColor: isListening ? colors.danger : colors.surfaceRaised,
              borderRadius: radii.full,
            },
          ]}
        >
          <Ionicons
            name={isListening ? 'stop' : 'mic-outline'}
            size={19}
            color={isListening ? '#FFFFFF' : colors.textSecondary}
          />
        </Pressable>

        {/* Text Input (RTL: on the right side) */}
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.surface,
              borderColor: isListening
                ? colors.danger
                : isDark
                ? colors.border
                : colors.borderLight,
              borderRadius: radii.xl,
            },
          ]}
        >
          <TextInput
            placeholder={isListening ? 'در حال گوش دادن...' : 'پیام یا درخواست خود را بنویسید...'}
            placeholderTextColor={isListening ? colors.danger : colors.textMuted}
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
    flexDirection: 'row', // left: send & voice buttons, right: text input
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
