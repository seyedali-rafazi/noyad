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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/theme';
import { Task } from '../../../domain/models/task';
import { TaskPriority, TASK_PRIORITIES } from '../../../domain/types/common';
import { Button } from '../../../shared/components/Button';
import { TextInputField } from '../../../shared/components/TextInputField';

interface TaskEditModalProps {
  visible: boolean;
  task?: Task | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description?: string;
    dueDate?: string | null;
    isAllDay?: boolean;
    priority?: TaskPriority;
  }) => void;
}

const TaskForm: React.FC<{
  task?: Task | null;
  onClose: () => void;
  onSave: TaskEditModalProps['onSave'];
}> = ({ task, onClose, onSave }) => {
  const { colors, radii, spacing, typography, isDark } = useTheme();

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [dateChoice, setDateChoice] = useState<'today' | 'tomorrow' | 'none'>(
    task?.dueDate ? 'today' : 'none'
  );
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim()) {
      setError('عنوان تسک نمی‌تواند خالی باشد');
      return;
    }

    let dueDateIso: string | null = null;
    if (dateChoice === 'today') {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      dueDateIso = d.toISOString();
    } else if (dateChoice === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
      dueDateIso = d.toISOString();
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDateIso,
      priority,
      isAllDay: false,
    });
    onClose();
  };

  const priorityLabels: Record<TaskPriority, string> = {
    urgent: 'فوری',
    high: 'زیاد',
    medium: 'متوسط',
    low: 'کم',
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
          {task ? 'ویرایش تسک' : 'افزودن تسک جدید'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <TextInputField
          label="عنوان تسک *"
          placeholder="مثال: جلسه با تیم محصول"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (error) setError('');
          }}
          error={error}
          containerStyle={{ marginBottom: spacing.base }}
        />

        {/* Description */}
        <TextInputField
          label="توضیحات (اختیاری)"
          placeholder="جزییات، مکان، یا نکات مربوطه..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ minHeight: 70, textAlignVertical: 'top' }}
          containerStyle={{ marginBottom: spacing.base }}
        />

        {/* Priority Selector */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, textAlign: 'right', marginBottom: 8, fontWeight: '600' },
          ]}
        >
          اولویت
        </Text>
        <View style={styles.segmentedRow}>
          {TASK_PRIORITIES.map((p) => {
            const selected = priority === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.segmentItem,
                  {
                    backgroundColor: selected ? colors.accent : colors.surfaceRaised,
                    borderRadius: radii.md,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: selected ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: selected ? '700' : '500',
                    },
                  ]}
                >
                  {priorityLabels[p]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Date Choice */}
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'right',
              marginTop: spacing.base,
              marginBottom: 8,
              fontWeight: '600',
            },
          ]}
        >
          زمان سررسید
        </Text>
        <View style={styles.segmentedRow}>
          {(['today', 'tomorrow', 'none'] as const).map((choice) => {
            const selected = dateChoice === choice;
            const label =
              choice === 'today'
                ? 'امروز'
                : choice === 'tomorrow'
                ? 'فردا'
                : 'بدون سررسید';
            return (
              <Pressable
                key={choice}
                onPress={() => setDateChoice(choice)}
                style={[
                  styles.segmentItem,
                  {
                    backgroundColor: selected ? colors.accent : colors.surfaceRaised,
                    borderRadius: radii.md,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: selected ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: selected ? '700' : '500',
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={[styles.actionRow, { marginTop: spacing.xl }]}>
          <Button
            title={task ? 'ذخیره تغییرات' : 'افزودن تسک'}
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

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  visible,
  task,
  onClose,
  onSave,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <TaskForm
          key={task ? task.id : 'new-task'}
          task={task}
          onClose={onClose}
          onSave={onSave}
        />
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
  sheet: {
    maxHeight: '85%',
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  segmentedRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 16,
  },
});
