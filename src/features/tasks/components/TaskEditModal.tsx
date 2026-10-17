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
import { Task } from '../../../domain/models/task';
import { TaskPriority, TASK_PRIORITIES } from '../../../domain/types/common';
import { Button } from '../../../shared/components/Button';
import { TextInputField } from '../../../shared/components/TextInputField';
import {
  formatJalaliFullDate,
  isSameJalaliDay,
  addJalaliDays,
} from '../../../core/calendar';
import { TaskDatePicker } from './TaskDatePicker';
import { ScrollTimePicker } from './ScrollTimePicker';

export interface TaskEditModalProps {
  visible: boolean;
  task?: Task | null;
  initialDate?: Date;
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
  initialDate?: Date;
  onClose: () => void;
  onSave: TaskEditModalProps['onSave'];
}> = ({ task, initialDate, onClose, onSave }) => {
  const { colors, radii, spacing, typography, fonts, isDark } = useTheme();

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');

  // Initial date & time logic
  const initialBaseDate = task?.dueDate
    ? new Date(task.dueDate)
    : initialDate ?? new Date();

  const [hasDueDate, setHasDueDate] = useState<boolean>(
    task ? task.dueDate !== null : true
  );
  const [selectedDate, setSelectedDate] = useState<Date>(initialBaseDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const [hasSpecificTime, setHasSpecificTime] = useState<boolean>(
    task ? task.dueDate !== null && !task.isAllDay : true
  );

  const [selectedHour, setSelectedHour] = useState<number>(() => {
    if (task?.dueDate) {
      return new Date(task.dueDate).getHours();
    }
    return 10;
  });

  const [selectedMinute, setSelectedMinute] = useState<number>(() => {
    if (task?.dueDate) {
      return new Date(task.dueDate).getMinutes();
    }
    return 0;
  });

  const [error, setError] = useState('');

  const isTodaySelected =
    hasDueDate && isSameJalaliDay(selectedDate, new Date());
  const isTomorrowSelected =
    hasDueDate && isSameJalaliDay(selectedDate, addJalaliDays(new Date(), 1));
  const isCustomSelected =
    hasDueDate && !isTodaySelected && !isTomorrowSelected;

  const handleSave = () => {
    if (!title.trim()) {
      setError('عنوان تسک نمی‌تواند خالی باشد');
      return;
    }

    let dueDateIso: string | null = null;
    let isAllDay = false;

    if (hasDueDate) {
      const d = new Date(selectedDate);
      if (hasSpecificTime) {
        d.setHours(selectedHour, selectedMinute, 0, 0);
        isAllDay = false;
      } else {
        d.setHours(12, 0, 0, 0);
        isAllDay = true;
      }
      dueDateIso = d.toISOString();
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDateIso,
      priority,
      isAllDay,
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
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
          borderColor: isDark ? colors.border : colors.borderLight,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={onClose} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
        <Text
          style={[
            typography.titleSmall,
            { color: colors.textPrimary, fontFamily: fonts.bold },
          ]}
        >
          {task ? 'ویرایش تسک' : 'افزودن تسک جدید'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
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
          style={{ minHeight: 65, textAlignVertical: 'top' }}
          containerStyle={{ marginBottom: spacing.base }}
        />

        {/* Priority Selector */}
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'right',
              marginBottom: 8,
              fontWeight: '600',
            },
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
                    borderColor: selected
                      ? colors.accent
                      : isDark
                      ? colors.border
                      : colors.borderLight,
                    borderWidth: 1,
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

        {/* Date Selection Section */}
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
          تاریخ سررسید
        </Text>

        {/* Quick Date Presets Row */}
        <View style={styles.segmentedRow}>
          <Pressable
            onPress={() => {
              setHasDueDate(true);
              setSelectedDate(new Date());
              setIsCalendarOpen(false);
            }}
            style={[
              styles.segmentItem,
              {
                backgroundColor: isTodaySelected ? colors.accent : colors.surfaceRaised,
                borderRadius: radii.md,
                borderColor: isTodaySelected
                  ? colors.accent
                  : isDark
                  ? colors.border
                  : colors.borderLight,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                typography.bodySmall,
                {
                  color: isTodaySelected ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: isTodaySelected ? '700' : '500',
                },
              ]}
            >
              امروز
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setHasDueDate(true);
              setSelectedDate(addJalaliDays(new Date(), 1));
              setIsCalendarOpen(false);
            }}
            style={[
              styles.segmentItem,
              {
                backgroundColor: isTomorrowSelected ? colors.accent : colors.surfaceRaised,
                borderRadius: radii.md,
                borderColor: isTomorrowSelected
                  ? colors.accent
                  : isDark
                  ? colors.border
                  : colors.borderLight,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                typography.bodySmall,
                {
                  color: isTomorrowSelected ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: isTomorrowSelected ? '700' : '500',
                },
              ]}
            >
              فردا
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setHasDueDate(true);
              setIsCalendarOpen((prev) => !prev);
            }}
            style={[
              styles.segmentItem,
              {
                backgroundColor:
                  isCustomSelected || isCalendarOpen
                    ? colors.accent
                    : colors.surfaceRaised,
                borderRadius: radii.md,
                borderColor:
                  isCustomSelected || isCalendarOpen
                    ? colors.accent
                    : isDark
                    ? colors.border
                    : colors.borderLight,
                borderWidth: 1,
                flexDirection: 'row-reverse',
                gap: 4,
              },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={
                isCustomSelected || isCalendarOpen ? '#FFFFFF' : colors.textPrimary
              }
            />
            <Text
              style={[
                typography.bodySmall,
                {
                  color:
                    isCustomSelected || isCalendarOpen
                      ? '#FFFFFF'
                      : colors.textPrimary,
                  fontWeight: isCustomSelected || isCalendarOpen ? '700' : '500',
                },
              ]}
            >
              تقویم
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setHasDueDate(false);
              setIsCalendarOpen(false);
            }}
            style={[
              styles.segmentItem,
              {
                backgroundColor: !hasDueDate ? colors.accent : colors.surfaceRaised,
                borderRadius: radii.md,
                borderColor: !hasDueDate
                  ? colors.accent
                  : isDark
                  ? colors.border
                  : colors.borderLight,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                typography.bodySmall,
                {
                  color: !hasDueDate ? '#FFFFFF' : colors.textPrimary,
                  fontWeight: !hasDueDate ? '700' : '500',
                },
              ]}
            >
              بدون تاریخ
            </Text>
          </Pressable>
        </View>

        {/* Selected Date Summary & Calendar Expand */}
        {hasDueDate && (
          <Pressable
            onPress={() => setIsCalendarOpen((prev) => !prev)}
            style={[
              styles.selectedDateBanner,
              {
                backgroundColor: colors.surfaceRaised,
                borderRadius: radii.md,
                borderColor: isDark ? colors.border : colors.borderLight,
                marginTop: spacing.sm,
              },
            ]}
          >
            <View style={styles.dateLabelRow}>
              <Ionicons name="calendar" size={16} color={colors.accent} />
              <Text
                style={[
                  typography.caption,
                  {
                    fontFamily: fonts.bold,
                    color: colors.textPrimary,
                    marginRight: 6,
                  },
                ]}
              >
                {formatJalaliFullDate(selectedDate)}
              </Text>
            </View>
            <View style={styles.dateActionRow}>
              <Text style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
                {isCalendarOpen ? 'بستن تقویم' : 'تغییر از تقویم'}
              </Text>
              <Ionicons
                name={isCalendarOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.accent}
              />
            </View>
          </Pressable>
        )}

        {/* Interactive Calendar Grid */}
        {hasDueDate && isCalendarOpen && (
          <TaskDatePicker
            selectedDate={selectedDate}
            onSelectDate={(newDate) => {
              setSelectedDate(newDate);
            }}
          />
        )}

        {/* Time Selector Section */}
        {hasDueDate && (
          <View style={{ marginTop: spacing.md }}>
            <View style={styles.timeSectionHeader}>
              <View style={styles.timeTypeSwitch}>
                <Pressable
                  onPress={() => setHasSpecificTime(true)}
                  style={[
                    styles.timeTypePill,
                    {
                      backgroundColor: hasSpecificTime
                        ? colors.accent
                        : colors.surfaceRaised,
                      borderRadius: radii.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: hasSpecificTime ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: hasSpecificTime ? '700' : '500',
                      },
                    ]}
                  >
                    ساعت مشخص
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setHasSpecificTime(false)}
                  style={[
                    styles.timeTypePill,
                    {
                      backgroundColor: !hasSpecificTime
                        ? colors.accent
                        : colors.surfaceRaised,
                      borderRadius: radii.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: !hasSpecificTime ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: !hasSpecificTime ? '700' : '500',
                      },
                    ]}
                  >
                    تمام روز
                  </Text>
                </Pressable>
              </View>

              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textSecondary,
                    textAlign: 'right',
                    fontWeight: '600',
                  },
                ]}
              >
                زمان انجام
              </Text>
            </View>

            {/* Scrollable Time Picker Wheel */}
            {hasSpecificTime && (
              <View style={{ marginTop: 10 }}>
                <ScrollTimePicker
                  selectedHour={selectedHour}
                  selectedMinute={selectedMinute}
                  onChangeHour={setSelectedHour}
                  onChangeMinute={setSelectedMinute}
                />
              </View>
            )}
          </View>
        )}

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
  initialDate,
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
          <TaskForm
            key={task ? task.id : 'new-task'}
            task={task}
            initialDate={initialDate}
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
    maxHeight: '92%',
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
    marginBottom: 16,
  },
  segmentedRow: {
    flexDirection: 'row-reverse',
    gap: 6,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  dateLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  dateActionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  timeSectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeTypeSwitch: {
    flexDirection: 'row-reverse',
    gap: 4,
  },
  timeTypePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: 16,
  },
});
