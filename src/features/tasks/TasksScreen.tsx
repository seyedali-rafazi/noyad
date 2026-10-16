import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/theme';
import { AppScreen } from '../../shared/components/AppScreen';
import { AppHeader } from '../../shared/components/AppHeader';
import { EmptyState } from '../../shared/components/EmptyState';
import { ConfirmationModal } from '../../shared/components/ConfirmationModal';
import { usePlannerStore, TaskFilter } from '../planner/plannerStore';
import { TaskCard } from './components/TaskCard';
import { TaskEditModal } from './components/TaskEditModal';
import { Task } from '../../domain/models/task';
import { defaultConfirmationPolicy, ConfirmationRequest } from '../../application/policies/confirmation';
import { toPersianDigits } from '../../core/calendar';

export const TasksScreen: React.FC = () => {
  const { colors, radii, spacing, typography, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 10 : 6);
  const scrollBottomPadding = bottomOffset + 74 + 32;

  const taskFilter = usePlannerStore((s) => s.taskFilter);
  const setTaskFilter = usePlannerStore((s) => s.setTaskFilter);
  const toggleTaskComplete = usePlannerStore((s) => s.toggleTaskComplete);
  const addTask = usePlannerStore((s) => s.addTask);
  const updateTask = usePlannerStore((s) => s.updateTask);
  const deleteTask = usePlannerStore((s) => s.deleteTask);
  const getFilteredTasks = usePlannerStore((s) => s.getFilteredTasks);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);

  const filteredTasks = getFilteredTasks();

  const filters: { key: TaskFilter; label: string }[] = [
    { key: 'today', label: 'امروز' },
    { key: 'upcoming', label: 'پیش‌رو' },
    { key: 'completed', label: 'انجام‌شده' },
    { key: 'all', label: 'همه' },
  ];

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
      <AppHeader
        title="مدیریت کارها"
        subtitle={`${toPersianDigits(filteredTasks.length)} مورد در این بخش`}
        rightAction={
          <Pressable
            onPress={handleOpenAdd}
            style={[
              styles.headerAddButton,
              {
                backgroundColor: colors.surfaceRaised,
                borderColor: isDark ? colors.border : colors.borderLight,
                borderRadius: radii.full,
              },
            ]}
          >
            <Ionicons name="add" size={22} color={colors.accent} />
          </Pressable>
        }
      />

      {/* Segmented Filter Bar */}
      <View style={[styles.filterBar, { paddingHorizontal: spacing.base, paddingVertical: spacing.sm }]}>
        <View
          style={[
            styles.segmentedContainer,
            {
              backgroundColor: colors.surfaceRaised,
              borderRadius: radii.lg,
              padding: 4,
            },
          ]}
        >
          {filters.map((f) => {
            const isSelected = taskFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setTaskFilter(f.key)}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: isSelected ? colors.surface : 'transparent',
                    borderRadius: radii.md,
                    shadowColor: isSelected ? '#000000' : 'transparent',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isSelected ? 0.08 : 0,
                    shadowRadius: 2,
                    elevation: isSelected ? 1 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodySmall,
                    {
                      color: isSelected ? colors.accent : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: spacing.base, paddingBottom: scrollBottomPadding, flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            iconName="checkbox-outline"
            title="موردی در این دسته وجود ندارد"
            description={
              taskFilter === 'completed'
                ? 'هنوز تسکی به عنوان انجام‌شده علامت نخورده است.'
                : 'می‌توانید با زدن دکمه زیر یک تسک جدید ثبت کنید.'
            }
            actionTitle={taskFilter !== 'completed' ? 'افزودن اولین تسک' : undefined}
            onActionPress={handleOpenAdd}
            style={{ paddingVertical: spacing.xxxl }}
          />
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggleComplete={() => toggleTaskComplete(item.id)}
            onPress={() => handleOpenEdit(item)}
            onDelete={() => handleDeleteRequest(item)}
          />
        )}
      />

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
  headerAddButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterBar: {
    width: '100%',
  },
  segmentedContainer: {
    flexDirection: 'row-reverse',
    width: '100%',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 8,
  },
});
