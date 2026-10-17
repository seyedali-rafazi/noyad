import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/theme';
import { AppScreen } from '../../shared/components/AppScreen';
import { AppHeader } from '../../shared/components/AppHeader';
import { Card } from '../../shared/components/Card';
import { EmptyState } from '../../shared/components/EmptyState';
import { ConfirmationModal } from '../../shared/components/ConfirmationModal';
import { useScreenModalAnimation } from '../../shared/hooks';
import { usePlannerStore } from '../planner/plannerStore';
import { CalendarGrid } from './components/CalendarGrid';
import { TaskCard } from '../tasks/components/TaskCard';
import { TaskEditModal } from '../tasks/components/TaskEditModal';
import { Task } from '../../domain/models/task';
import { defaultConfirmationPolicy, ConfirmationRequest } from '../../application/policies/confirmation';
import {
  addJalaliMonths,
  subJalaliMonths,
  formatJalali,
  formatJalaliFullDate,
  toPersianDigits,
} from '../../core/calendar';

export const CalendarScreen: React.FC = () => {
  const { handleClose, animatedStyle } = useScreenModalAnimation();
  const { colors, radii, spacing, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 10 : 6);
  const scrollBottomPadding = bottomOffset + 40;

  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);
  const tasks = usePlannerStore((s) => s.tasks);
  const toggleTaskComplete = usePlannerStore((s) => s.toggleTaskComplete);
  const addTask = usePlannerStore((s) => s.addTask);
  const updateTask = usePlannerStore((s) => s.updateTask);
  const deleteTask = usePlannerStore((s) => s.deleteTask);
  const getTasksForDate = usePlannerStore((s) => s.getTasksForDate);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(selectedDate);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);

  const selectedDayTasks = getTasksForDate(selectedDate);
  const monthYearLabel = formatJalali(currentMonthDate, 'MMMM yyyy');

  const handlePrevMonth = () => {
    setCurrentMonthDate((d) => subJalaliMonths(d, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((d) => addJalaliMonths(d, 1));
  };

  const handleTodayPress = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setIsEditModalVisible(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditModalVisible(true);
  };

  const handleDeleteRequest = (task: Task) => {
    const req = defaultConfirmationPolicy.createConfirmationRequest({
      actionType: 'delete_task',
      targetId: task.id,
      targetTitle: task.title,
      source: 'user',
      isDestructive: true,
    });
    setConfirmationRequest(req);
  };

  const handleConfirmDelete = () => {
    if (confirmationRequest) {
      deleteTask(confirmationRequest.targetId);
      setConfirmationRequest(null);
    }
  };

  return (
    <AppScreen style={{ backgroundColor: 'transparent' }}>
      <Animated.View style={[animatedStyle, { backgroundColor: colors.background, flex: 1 }]}>
        <AppHeader
          title="تقویم شمسی"
          subtitle="برنامه زمانی و رویدادهای ماهانه"
          showBack={true}
          onBackPress={handleClose}
          rightAction={
            <Pressable
              onPress={handleTodayPress}
              style={[
                styles.todayButton,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: isDark ? colors.border : colors.borderLight,
                  borderRadius: radii.full,
                },
              ]}
            >
              <Text
                style={[
                  typography.caption,
                  { color: colors.accent, fontWeight: '700' },
                ]}
              >
                امروز
              </Text>
            </Pressable>
          }
        />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: scrollBottomPadding }}
      >
        {/* Month Navigation Card */}
        <Card
          variant="flat"
          style={{
            marginHorizontal: spacing.base,
            marginTop: spacing.sm,
            paddingVertical: spacing.md,
          }}
        >
          <View style={styles.monthHeaderRow}>
            {/* Next Month Button in RTL (points left) */}
            <Pressable
              onPress={handleNextMonth}
              hitSlop={8}
              style={[styles.monthNavBtn, { backgroundColor: colors.surfaceRaised, borderRadius: radii.full }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>

            {/* Current Month & Year Display */}
            <View style={styles.monthTitleWrapper}>
              <Text style={[typography.titleMedium, { color: colors.textPrimary, textAlign: 'center' }]}>
                {monthYearLabel}
              </Text>
            </View>

            {/* Prev Month Button in RTL (points right) */}
            <Pressable
              onPress={handlePrevMonth}
              hitSlop={8}
              style={[styles.monthNavBtn, { backgroundColor: colors.surfaceRaised, borderRadius: radii.full }]}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Jalali Calendar Grid */}
          <View style={{ marginTop: spacing.md }}>
            <CalendarGrid
              currentMonthDate={currentMonthDate}
              selectedDate={selectedDate}
              tasks={tasks}
              onSelectDate={setSelectedDate}
            />
          </View>
        </Card>

        {/* Selected Day Agenda Header */}
        <View style={[styles.agendaHeader, { paddingHorizontal: spacing.base, marginTop: spacing.lg }]}>
          <Pressable
            onPress={handleOpenAdd}
            style={[
              styles.addAgendaBtn,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: isDark ? colors.border : colors.borderLight,
                borderRadius: radii.full,
              },
            ]}
          >
            <Ionicons name="add" size={16} color={colors.accent} />
            <Text style={[typography.caption, { color: colors.accent, fontWeight: '700' }]}>
              تسک در این روز
            </Text>
          </Pressable>

          <View style={styles.agendaTitleWrapper}>
            <Text style={[typography.titleSmall, { color: colors.textPrimary, textAlign: 'right' }]}>
              برنامه {formatJalaliFullDate(selectedDate)}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'right' }]}>
              {toPersianDigits(selectedDayTasks.length)} کار ثبت شده
            </Text>
          </View>
        </View>

        {/* Selected Day Agenda List */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.xs }}>
          {selectedDayTasks.length === 0 ? (
            <EmptyState
              iconName="calendar-outline"
              title="رویدادی برای این تاریخ ثبت نشده"
              description="می‌توانید با دکمه بالا یک تسک جدید برای این تاریخ ایجاد کنید."
              style={{ paddingVertical: spacing.xl }}
            />
          ) : (
            selectedDayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={() => toggleTaskComplete(task.id)}
                onPress={() => handleOpenEdit(task)}
                onDelete={() => handleDeleteRequest(task)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Task Add / Edit Modal */}
      <TaskEditModal
        visible={isEditModalVisible}
        task={editingTask}
        initialDate={selectedDate}
        onClose={() => setIsEditModalVisible(false)}
        onSave={(data) => {
          if (editingTask) {
            updateTask(editingTask.id, data);
          } else {
            addTask(data);
          }
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmationRequest !== null}
        request={confirmationRequest}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmationRequest(null)}
      />
      </Animated.View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthTitleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agendaTitleWrapper: {
    alignItems: 'flex-end',
  },
  addAgendaBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 4,
  },
});
