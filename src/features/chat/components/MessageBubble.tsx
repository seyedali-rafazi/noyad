import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { ChatMessageItem } from '../../../shared/preview/mockData';
import { formatPersianTime } from '../../../core/calendar';
import { ProposedActionCard } from './ProposedActionCard';

interface MessageBubbleProps {
  message: ChatMessageItem;
  onConfirmAction?: (action: NonNullable<ChatMessageItem['proposedAction']>) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onConfirmAction,
}) => {
  const { colors, radii, spacing, typography, isDark } = useTheme();

  const isUser = message.role === 'user';
  const formattedTime = formatPersianTime(message.createdAt);

  return (
    <View
      style={[
        styles.container,
        {
          alignItems: isUser ? 'flex-end' : 'flex-start',
          marginVertical: spacing.xs + 2,
          paddingHorizontal: spacing.base,
        },
      ]}
    >
      <View style={styles.bubbleRow}>
        {!isUser && (
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: colors.accentSubtle,
                borderRadius: radii.full,
                marginRight: 8,
              },
            ]}
          >
            <Ionicons name="sparkles" size={14} color={colors.accent} />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isUser
                ? colors.accent
                : isDark
                ? colors.surfaceRaised
                : colors.surface,
              borderRadius: radii.lg,
              borderTopRightRadius: isUser ? radii.xs : radii.lg,
              borderTopLeftRadius: !isUser ? radii.xs : radii.lg,
              padding: spacing.md,
              borderColor: isUser
                ? 'transparent'
                : isDark
                ? colors.border
                : colors.borderLight,
              borderWidth: isUser ? 0 : 1,
            },
          ]}
        >
          <Text
            style={[
              typography.bodyMedium,
              {
                color: isUser ? '#FFFFFF' : colors.textPrimary,
                textAlign: 'right',
                lineHeight: 22,
              },
            ]}
          >
            {message.content}
          </Text>

          {/* Timestamp */}
          <Text
            style={[
              typography.caption,
              {
                color: isUser ? 'rgba(255, 255, 255, 0.75)' : colors.textMuted,
                textAlign: 'left',
                marginTop: 4,
                fontSize: 10,
              },
            ]}
          >
            {formattedTime}
          </Text>

          {/* Structured Proposed Action (if any) */}
          {message.proposedAction && (
            <ProposedActionCard
              action={message.proposedAction}
              onConfirm={() => onConfirmAction && onConfirmAction(message.proposedAction!)}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '88%',
  },
  avatar: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  bubble: {
    flexShrink: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
});
