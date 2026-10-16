import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/theme';
import { AppScreen } from '../../shared/components/AppScreen';
import { AppHeader } from '../../shared/components/AppHeader';
import { EmptyState } from '../../shared/components/EmptyState';
import { ConfirmationModal } from '../../shared/components/ConfirmationModal';
import { TextInputField } from '../../shared/components/TextInputField';
import { usePlannerStore } from '../planner/plannerStore';
import { NoteCard } from './components/NoteCard';
import { NoteEditModal } from './components/NoteEditModal';
import { Note } from '../../domain/models/note';
import { defaultConfirmationPolicy, ConfirmationRequest } from '../../application/policies/confirmation';
import { toPersianDigits } from '../../core/calendar';

export const NotesScreen: React.FC = () => {
  const { colors, radii, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 10 : 6);
  const scrollBottomPadding = bottomOffset + 74 + 32;

  const noteSearchQuery = usePlannerStore((s) => s.noteSearchQuery);
  const setNoteSearchQuery = usePlannerStore((s) => s.setNoteSearchQuery);
  const addNote = usePlannerStore((s) => s.addNote);
  const updateNote = usePlannerStore((s) => s.updateNote);
  const deleteNote = usePlannerStore((s) => s.deleteNote);
  const togglePinNote = usePlannerStore((s) => s.togglePinNote);
  const getFilteredNotes = usePlannerStore((s) => s.getFilteredNotes);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);

  const filteredNotes = getFilteredNotes();

  const handleOpenAdd = () => {
    setEditingNote(null);
    setIsEditModalVisible(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setIsEditModalVisible(true);
  };

  const handleDeleteRequest = (note: Note) => {
    const req = defaultConfirmationPolicy.createConfirmationRequest({
      actionType: 'delete_note',
      targetId: note.id,
      targetTitle: note.title,
      source: 'user',
      isDestructive: true,
    });
    setConfirmationRequest(req);
  };

  const handleConfirmDelete = () => {
    if (confirmationRequest) {
      deleteNote(confirmationRequest.targetId);
      setConfirmationRequest(null);
    }
  };

  return (
    <AppScreen>
      <AppHeader
        title="یادداشت‌ها"
        subtitle={`${toPersianDigits(filteredNotes.length)} یادداشت ذخیره شده`}
        rightAction={
          <Pressable
            onPress={handleOpenAdd}
            style={[
              styles.headerAddBtn,
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

      {/* Persian Search Input */}
      <View style={{ paddingHorizontal: spacing.base, paddingVertical: spacing.xs }}>
        <TextInputField
          placeholder="جستجو در عنوان، متن یا برچسب‌ها..."
          value={noteSearchQuery}
          onChangeText={setNoteSearchQuery}
          style={{ height: 42 }}
        />
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: spacing.base, paddingBottom: scrollBottomPadding, flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            iconName="document-text-outline"
            title="یادداشتی پیدا نشد"
            description={
              noteSearchQuery
                ? 'نتیجه‌ای متناسب با عبارت جستجو شده یافت نشد.'
                : 'می‌توانید اولین یادداشت خود را با فشردن دکمه زیر ایجاد کنید.'
            }
            actionTitle={!noteSearchQuery ? 'یادداشت جدید' : undefined}
            onActionPress={handleOpenAdd}
            style={{ paddingVertical: spacing.xxxl }}
          />
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => handleOpenEdit(item)}
            onTogglePin={() => togglePinNote(item.id)}
            onDelete={() => handleDeleteRequest(item)}
          />
        )}
      />

      {/* Note Editor Modal */}
      <NoteEditModal
        visible={isEditModalVisible}
        note={editingNote}
        onClose={() => setIsEditModalVisible(false)}
        onSave={(data) => {
          if (editingNote) {
            updateNote(editingNote.id, data);
          } else {
            addNote(data);
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
  headerAddBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  listContent: {
    paddingTop: 8,
  },
});
