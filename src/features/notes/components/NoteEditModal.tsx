import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { Note } from '../../../domain/models/note';
import { Button } from '../../../shared/components/Button';
import { TextInputField } from '../../../shared/components/TextInputField';

interface NoteEditModalProps {
  visible: boolean;
  note?: Note | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    content: string;
    tags?: string[];
    isPinned?: boolean;
  }) => void;
}

const NoteForm: React.FC<{
  note?: Note | null;
  onClose: () => void;
  onSave: NoteEditModalProps['onSave'];
}> = ({ note, onClose, onSave }) => {
  const { colors, radii, spacing, typography, isDark } = useTheme();

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [tagsInput, setTagsInput] = useState(note?.tags ? note.tags.join('، ') : '');
  const [isPinned, setIsPinned] = useState(note?.isPinned ?? false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      setError('عنوان یادداشت نمی‌تواند خالی باشد');
      return;
    }

    const tags = tagsInput
      .split(/[,،\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    onSave({
      title: title.trim(),
      content: content.trim(),
      tags,
      isPinned,
    });
    onClose();
  };

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          padding: spacing.xl,
          borderColor: isDark ? colors.border : colors.borderLight,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text style={[typography.titleSmall, { color: colors.textPrimary }]}>
          {note ? 'ویرایش یادداشت' : 'یادداشت جدید'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <TextInputField
          label="عنوان یادداشت *"
          placeholder="مثال: نکات جلسه استراتژی"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (error) setError('');
          }}
          error={error}
          containerStyle={{ marginBottom: spacing.base }}
        />

        {/* Content */}
        <TextInputField
          label="متن یادداشت"
          placeholder="یادداشت‌های خود را اینجا بنویسید..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          style={{ minHeight: 140, textAlignVertical: 'top' }}
          containerStyle={{ marginBottom: spacing.base }}
        />

        {/* Tags */}
        <TextInputField
          label="برچسب‌ها (با کاما یا فاصله جدا کنید)"
          placeholder="طراحی، محصول، ایده"
          value={tagsInput}
          onChangeText={setTagsInput}
          containerStyle={{ marginBottom: spacing.base }}
        />

        {/* Pin Toggle */}
        <Pressable
          onPress={() => setIsPinned(!isPinned)}
          style={[
            styles.pinToggleRow,
            {
              backgroundColor: colors.surfaceRaised,
              borderRadius: radii.md,
              padding: spacing.md,
            },
          ]}
        >
          <Ionicons
            name={isPinned ? 'checkbox' : 'square-outline'}
            size={22}
            color={isPinned ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.textPrimary, marginRight: 8 },
            ]}
          >
            سنجاق به بالای لیست
          </Text>
        </Pressable>

        {/* Actions */}
        <View style={[styles.actionRow, { marginTop: spacing.xl }]}>
          <Button
            title={note ? 'ذخیره تغییرات' : 'ایجاد یادداشت'}
            variant="primary"
            size="md"
            onPress={handleSave}
            style={{ flex: 1 }}
          />
          <Button
            title="انصراف"
            variant="outline"
            size="md"
            onPress={onClose}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export const NoteEditModal: React.FC<NoteEditModalProps> = ({
  visible,
  note,
  onClose,
  onSave,
}) => {
  const screenHeight = Dimensions.get('window').height || 800;
  const [slideAnim] = useState(() => new Animated.Value(screenHeight));
  const useNativeDriver = Platform.OS !== 'web';

  React.useEffect(() => {
    if (visible) {
      slideAnim.setValue(screenHeight);
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 26,
        mass: 0.85,
        stiffness: 260,
        useNativeDriver,
      }).start();
    }
  }, [visible, screenHeight, slideAnim, useNativeDriver]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 180,
      useNativeDriver,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTouch} onPress={handleClose} />
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <NoteForm
            key={note ? note.id : 'new-note'}
            note={note}
            onClose={handleClose}
            onSave={onSave}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    flex: 1,
  },
  animatedContainer: {
    width: '100%',
    maxHeight: '88%',
  },
  sheet: {
    width: '100%',
    maxHeight: '100%',
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pinToggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 16,
  },
});
