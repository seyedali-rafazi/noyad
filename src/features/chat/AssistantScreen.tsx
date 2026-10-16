import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/theme';
import { AppScreen } from '../../shared/components/AppScreen';
import { AppHeader } from '../../shared/components/AppHeader';
import { ConfirmationModal } from '../../shared/components/ConfirmationModal';
import { useChatStore } from './chatStore';
import { MessageBubble } from './components/MessageBubble';
import { ChatComposer } from './components/ChatComposer';
import { ConfirmationRequest } from '../../application/policies/confirmation';

export const AssistantScreen: React.FC = () => {
  const { colors, radii, spacing, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const confirmAction = useChatStore((s) => s.confirmAction);
  const activeConfirmation = useChatStore((s) => s.activeConfirmation);
  const dismissConfirmation = useChatStore((s) => s.dismissConfirmation);

  const flatListRef = useRef<FlatList>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleKeyboardShow = () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const handleKeyboardHide = () => {
      setIsKeyboardVisible(false);
    };

    const willShowSub = Keyboard.addListener('keyboardWillShow', handleKeyboardShow);
    const didShowSub = Keyboard.addListener('keyboardDidShow', handleKeyboardShow);
    const willHideSub = Keyboard.addListener('keyboardWillHide', handleKeyboardHide);
    const didHideSub = Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return () => {
      willShowSub.remove();
      didShowSub.remove();
      willHideSub.remove();
      didHideSub.remove();
    };
  }, []);

  // Calculate clearance for floating glass tab bar
  const tabClearance = Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 10 : 6) + 74 + 10;

  // Auto scroll to bottom on new message
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, isTyping]);

  // Construct ConfirmationRequest for destructive action modal
  const confirmationReq: ConfirmationRequest | null = activeConfirmation
    ? {
        token: 'conf-chat-preview',
        actionType: 'delete_task',
        targetId: 'chat-target',
        targetTitle: activeConfirmation.title,
        promptPersian: activeConfirmation.description,
        promptEnglish: 'Confirm deletion',
        isDestructive: true,
        severity: 'critical',
        createdAt: new Date().toISOString(),
      }
    : null;

  return (
    <AppScreen>
      <AppHeader
        title="دستیار هوشمند"
        subtitle="موتور فوق‌سریع هوش مصنوعی Groq (Llama 8B)"
        rightAction={
          <View
            style={[
              styles.prototypeTag,
              {
                backgroundColor: 'rgba(249, 115, 22, 0.14)',
                borderRadius: radii.full,
              },
            ]}
          >
            <Ionicons name="flash" size={13} color="#f97316" />
            <Text
              style={[
                typography.caption,
                { color: '#f97316', fontWeight: '700' },
              ]}
            >
              Groq LPU (8B)
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={styles.keyboardContainer}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messageListContainer}
          contentContainerStyle={[
            styles.messageList,
            { paddingVertical: spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { paddingHorizontal: spacing.xl }]}>
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: colors.accentSubtle,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons name="sparkles" size={32} color={colors.accent} />
              </View>
              <Text
                style={[
                  typography.titleSmall,
                  { color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
                ]}
              >
                سلام! چطور می‌توانم کمکتان کنم؟
              </Text>
              <Text
                style={[
                  typography.bodySmall,
                  {
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 20,
                    maxWidth: 300,
                  },
                ]}
              >
                می‌توانید کارهای امروز را بپرسید، برای فردا برنامه‌ریزی کنید یا با پیشنهادات سریع زیر گفتگو را شروع کنید.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onConfirmAction={confirmAction}
            />
          )}
          ListFooterComponent={
            isTyping ? (
              <View style={[styles.typingRow, { paddingHorizontal: spacing.base }]}>
                <View
                  style={[
                    styles.typingBubble,
                    {
                      backgroundColor: isDark ? colors.surfaceRaised : colors.surface,
                      borderRadius: radii.lg,
                      borderColor: isDark ? colors.border : colors.borderLight,
                      padding: spacing.sm,
                    },
                  ]}
                >
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, marginRight: 8 },
                    ]}
                  >
                    دستیار در حال پاسخ است...
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Chat Composer with dynamic clearance for floating glass tab bar */}
        <View
          style={{
            paddingBottom: isKeyboardVisible
              ? (Platform.OS === 'ios' ? 6 : Math.max(insets.bottom, 6))
              : tabClearance + 6,
          }}
        >
          <ChatComposer onSend={sendMessage} disabled={isTyping} />
        </View>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={activeConfirmation !== null}
        request={confirmationReq}
        onConfirm={() => activeConfirmation?.onConfirm()}
        onCancel={dismissConfirmation}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  messageListContainer: {
    flex: 1,
  },
  prototypeTag: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 4,
  },
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  typingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginVertical: 4,
  },
  typingBubble: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
  },
});
