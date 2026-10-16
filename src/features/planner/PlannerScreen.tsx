import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/theme';
import { AppScreen } from '../../shared/components/AppScreen';
import { EmptyState } from '../../shared/components/EmptyState';
import { ConfirmationModal } from '../../shared/components/ConfirmationModal';
import { usePlannerStore } from './plannerStore';
import { PlannerHeader } from './components/PlannerHeader';
import { DaysStrip } from './components/DaysStrip';
import { TaskSummaryCard } from './components/TaskSummaryCard';
import { AiEntryBanner } from './components/AiEntryBanner';
import { TaskCard } from '../tasks/components/TaskCard';
import { TaskEditModal } from '../tasks/components/TaskEditModal';
import { Task } from '../../domain/models/task';
import { defaultConfirmationPolicy, ConfirmationRequest } from '../../application/policies/confirmation';
import { isSameJalaliDay, formatJalaliShortDate } from '../../core/calendar';

export const PlannerScreen: React.FC = () => {
  const { colors, radii, spacing, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 10 : 6);
  const fabBottom = bottomOffset + 74 + 12;

  const selectedDate = usePlannerStore((s) => s.selectedDate);
  const setSelectedDate = usePlannerStore((s) => s.setSelectedDate);
  const toggleTaskComplete = usePlannerStore((s) => s.toggleTaskComplete);
  const addTask = usePlannerStore((s) => s.addTask);
  const updateTask = usePlannerStore((s) => s.updateTask);
  const deleteTask = usePlannerStore((s) => s.deleteTask);
  const getTasksForDate = usePlannerStore((s) => s.getTasksForDate);
  const getOverdueTasks = usePlannerStore((s) => s.getOverdueTasks);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);

  const isToday = isSameJalaliDay(selectedDate, new Date());
  const dayTasks = getTasksForDate(selectedDate);
  const overdueTasks = isToday ? getOverdueTasks() : [];

  const completedCount = dayTasks.filter((t) => t.status === 'completed').length;
  const totalCount = dayTasks.length;

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
    <AppScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: fabBottom + 70 }}
      >
        {/* Header with Greeting & Date */}
        <PlannerHeader currentDate={selectedDate} />

        {/* Compact Horizontal Date Strip */}
        <DaysStrip
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Task Summary Card */}
        <TaskSummaryCard
          totalCount={totalCount}
          completedCount={completedCount}
        />

        {/* AI Assistant Callout */}
        <AiEntryBanner />

        {/* Overdue Tasks Alert (if any exist and today is viewed) */}
        {overdueTasks.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: spacing.base }]}>
            <View
              style={[
                styles.overdueHeader,
                {
                  backgroundColor: colors.dangerSubtle,
                  borderRadius: radii.md,
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text
                style={[
                  typography.caption,
                  { color: colors.danger, fontWeight: '700', marginRight: 6 },
                ]}
              >
                کارهای عقب‌افتاده ({overdueTasks.length})
              </Text>
            </View>

            {overdueTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={() => toggleTaskComplete(task.id)}
                onPress={() => handleOpenEdit(task)}
                onDelete={() => handleDeleteRequest(task)}
              />
            ))}
          </View>
        )}

        {/* Selected Day Agenda Section */}
        <View style={[styles.section, { paddingHorizontal: spacing.base, marginTop: spacing.md }]}>
          <View style={styles.sectionHeaderRow}>
            <Pressable
              onPress={handleOpenAdd}
              style={[
                styles.quickAddPill,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: isDark ? colors.border : colors.borderLight,
                  borderRadius: radii.full,
                },
              ]}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={[typography.caption, { color: colors.accent, fontWeight: '700' }]}>
                تسک جدید
              </Text>
            </Pressable>

            <Text style={[typography.titleSmall, { color: colors.textPrimary, textAlign: 'right' }]}>
              {isToday ? 'برنامه امروز' : `برنامه ${formatJalaliShortDate(selectedDate)}`}
            </Text>
          </View>

          {dayTasks.length === 0 ? (
            <EmptyState
              iconName="calendar-outline"
              title="کاری برای این روز ثبت نشده"
              description="می‌توانید کارهای شخصی، کاری یا یادآورهای خود را به این روز اضافه کنید."
              actionTitle="افزودن تسک"
              onActionPress={handleOpenAdd}
              style={{ paddingVertical: spacing.xxl }}
            />
          ) : (
            dayTasks.map((task) => (
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

      {/* Quick Add Floating Button */}
      <Pressable
        onPress={handleOpenAdd}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: fabBottom,
            backgroundColor: colors.accent,
            borderRadius: radii.full,
            shadowColor: colors.accent,
          },
          pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] },
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Task Add / Edit Modal */}
      <TaskEditModal
        visible={isEditModalVisible}
        task={editingTask}
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
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  section: {
    marginVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickAddPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 4,
  },
  overdueHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20, // in RTL, floating action button on left is ergonomically balanced
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
