/**
 * Application Operation Contracts and Result Types
 *
 * Provides a unified, type-safe response pattern for all application operations:
 * - Success: Contains strongly-typed entity/payload
 * - Failure: Contains structured ApplicationError
 * - Requires Confirmation: Triggers a user confirmation flow before executing destructive action
 */

import { ApplicationError } from '../../domain/errors';
import { ConfirmationRequest } from '../policies/confirmation';

export interface OperationSuccess<T> {
  readonly success: true;
  readonly data: T;
  readonly error?: never;
  readonly requiresConfirmation?: never;
  readonly confirmation?: never;
}

export interface OperationFailure {
  readonly success: false;
  readonly error: ApplicationError;
  readonly data?: never;
  readonly requiresConfirmation?: false;
  readonly confirmation?: never;
}

export interface OperationConfirmationRequired {
  readonly success: false;
  readonly requiresConfirmation: true;
  readonly confirmation: ConfirmationRequest;
  readonly data?: never;
  readonly error?: never;
}

export type OperationResult<T> =
  | OperationSuccess<T>
  | OperationFailure
  | OperationConfirmationRequired;

/* -------------------------------------------------------------------------- */
/*                               Helper Builders                              */
/* -------------------------------------------------------------------------- */

export function successResult<T>(data: T): OperationSuccess<T> {
  return { success: true, data };
}

export function failureResult(error: ApplicationError): OperationFailure {
  return { success: false, error, requiresConfirmation: false };
}

export function confirmationRequiredResult(
  confirmation: ConfirmationRequest
): OperationConfirmationRequired {
  return { success: false, requiresConfirmation: true, confirmation };
}

/**
 * Common orchestration interface for application operations.
 */
export interface ApplicationOperation<TInput, TOutput> {
  execute(input: TInput): Promise<OperationResult<TOutput>>;
}
