import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { Note } from '../../../domain/models/note';
import { formatJalaliShortDate } from '../../../core/calendar';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onTogglePin?: () => void;
  onDelete?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPress,
  onTogglePin,
  onDelete,
}) => {
  const { colors, radii, spacing, typography, isDark } = useTheme();

  const formattedDate = formatJalaliShortDate(note.updatedAt);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.base,
          borderColor: note.isPinned
            ? colors.accent
            : isDark
            ? colors.border
            : colors.borderLight,
          borderWidth: note.isPinned ? 1.5 : 1,
        },
        pressed && { opacity: 0.92 },
      ]}
    >
      {/* Top row: Title and Pin action */}
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          {note.isPinned && (
            <Ionicons
              name="pin"
              size={15}
              color={colors.accent}
              style={{ marginLeft: 6 }}
            />
          )}
          <Text
            numberOfLines={1}
            style={[
              typography.titleSmall,
              { color: colors.textPrimary, textAlign: 'right', flex: 1 },
            ]}
          >
            {note.title}
          </Text>
        </View>

        {onTogglePin && (
          <Pressable onPress={onTogglePin} hitSlop={8} style={styles.pinButton}>
            <Ionicons
              name={note.isPinned ? 'pin' : 'pin-outline'}
              size={18}
              color={note.isPinned ? colors.accent : colors.textMuted}
            />
          </Pressable>
        )}
      </View>

      {/* Content Preview */}
      <Text
        numberOfLines={3}
        style={[
          typography.bodyMedium,
          {
            color: colors.textSecondary,
            textAlign: 'right',
            marginTop: 6,
            lineHeight: 22,
          },
        ]}
      >
        {note.content}
      </Text>

      {/* Footer: Tags and Update Date */}
      <View style={styles.footerRow}>
        <View style={styles.tagsContainer}>
          {note.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tagBadge,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderRadius: radii.sm,
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                #{tag}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.rightFooter}>
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {formattedDate}
          </Text>
          {onDelete && (
            <Pressable onPress={onDelete} hitSlop={8} style={{ marginRight: 10 }}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  pinButton: {
    padding: 2,
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  tagsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rightFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
});
