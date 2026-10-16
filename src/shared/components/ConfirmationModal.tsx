import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Button } from './Button';
import { ConfirmationRequest } from '../../application/policies/confirmation';

interface ConfirmationModalProps {
  visible: boolean;
  request: ConfirmationRequest | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  request,
  onConfirm,
  onCancel,
}) => {
  const { colors, radii, spacing, typography, isDark } = useTheme();

  if (!request) return null;

  const isCritical = request.severity === 'critical';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
              borderRadius: radii.xl,
              padding: spacing.xl,
              borderColor: isDark ? colors.border : colors.borderLight,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isCritical ? colors.dangerSubtle : colors.warningSubtle,
                borderRadius: radii.full,
                marginBottom: spacing.base,
              },
            ]}
          >
            <Ionicons
              name={isCritical ? 'trash-outline' : 'alert-circle-outline'}
              size={32}
              color={isCritical ? colors.danger : colors.warning}
            />
          </View>

          <Text
            style={[
              typography.titleSmall,
              {
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: spacing.xs,
              },
            ]}
          >
            {isCritical ? 'تایید عملیات حساس' : 'تایید اقدام'}
          </Text>

          <Text
            style={[
              typography.bodyMedium,
              {
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: spacing.xl,
                lineHeight: 22,
              },
            ]}
          >
            {request.promptPersian}
          </Text>

          <View style={styles.buttonRow}>
            <Button
              title={isCritical ? 'بله، حذف کن' : 'تایید'}
              variant={isCritical ? 'danger' : 'primary'}
              size="md"
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
            <Button
              title="انصراف"
              variant="outline"
              size="md"
              onPress={onCancel}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    gap: 12,
  },
});
