/**
 * Destructive Operation Confirmation Policy
 *
 * Implements a structured safety barrier for operations that permanently delete or
 * overwrite user data. Ensures that:
 * 1. AI-initiated destructive actions always require explicit user confirmation.
 * 2. Destructive operations (e.g., delete_task, delete_note) require explicit confirmation
 *    unless explicitly passed `confirmed: true`.
 * 3. Future UI layers can render localized confirmation dialogs/bottom-sheets without
 *    coupling UI to business logic.
 */

import { OperationSource } from '../../domain/types/common';

export const CONFIRMATION_ACTION_TYPES = [
  'delete_task',
  'delete_note',
  'update_task',
  'update_note',
  'bulk_delete',
] as const;

export type ConfirmationActionType = (typeof CONFIRMATION_ACTION_TYPES)[number];

export type ConfirmationSeverity = 'standard' | 'critical';

export interface ConfirmationRequest {
  /**
   * Unique confirmation session token
   */
  readonly token: string;
  readonly actionType: ConfirmationActionType;
  readonly targetId: string;
  readonly targetTitle: string;
  /**
   * Persian prompt message for user confirmation
   */
  readonly promptPersian: string;
  /**
   * English fallback prompt message
   */
  readonly promptEnglish: string;
  readonly isDestructive: boolean;
  readonly severity: ConfirmationSeverity;
  readonly createdAt: string;
}

export interface ConfirmationEvaluationContext {
  readonly actionType: ConfirmationActionType;
  readonly targetId: string;
  readonly targetTitle: string;
  readonly source: OperationSource;
  readonly confirmed?: boolean;
  readonly isDestructive?: boolean;
}

export interface IConfirmationPolicy {
  requiresConfirmation(context: ConfirmationEvaluationContext): boolean;
  createConfirmationRequest(context: ConfirmationEvaluationContext): ConfirmationRequest;
}

export class DefaultConfirmationPolicy implements IConfirmationPolicy {
  public requiresConfirmation(context: ConfirmationEvaluationContext): boolean {
    // If the user already confirmed the operation in UI, bypass confirmation
    if (context.confirmed === true) {
      return false;
    }

    // AI operations targeting deletions or destructive actions ALWAYS require user confirmation
    if (context.source === 'ai') {
      return true;
    }

    // Direct deletions require user confirmation unless explicitly pre-confirmed
    if (
      context.actionType === 'delete_task' ||
      context.actionType === 'delete_note' ||
      context.actionType === 'bulk_delete'
    ) {
      return true;
    }

    return false;
  }

  public createConfirmationRequest(
    context: ConfirmationEvaluationContext
  ): ConfirmationRequest {
    const isDelete =
      context.actionType === 'delete_task' ||
      context.actionType === 'delete_note' ||
      context.actionType === 'bulk_delete';

    const entityLabelPersian =
      context.actionType === 'delete_task' ? 'تسک' : 'یادداشت';
    const entityLabelEnglish =
      context.actionType === 'delete_task' ? 'task' : 'note';

    const promptPersian = isDelete
      ? `آیا از حذف ${entityLabelPersian} «${context.targetTitle}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`
      : `آیا تغییرات اعمال شده روی ${entityLabelPersian} «${context.targetTitle}» را تایید می‌کنید؟`;

    const promptEnglish = isDelete
      ? `Are you sure you want to delete the ${entityLabelEnglish} "${context.targetTitle}"? This action cannot be undone.`
      : `Do you want to confirm the changes to ${entityLabelEnglish} "${context.targetTitle}"?`;

    // Deterministic or pseudo-unique token for future session verification
    const token = `conf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      token,
      actionType: context.actionType,
      targetId: context.targetId,
      targetTitle: context.targetTitle,
      promptPersian,
      promptEnglish,
      isDestructive: context.isDestructive ?? isDelete,
      severity: isDelete ? 'critical' : 'standard',
      createdAt: new Date().toISOString(),
    };
  }
}

export const defaultConfirmationPolicy = new DefaultConfirmationPolicy();
