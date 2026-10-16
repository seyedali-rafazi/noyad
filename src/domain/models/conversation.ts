/**
 * Conversation and Message Domain Models
 *
 * Core business entities representing conversational AI interactions, natural
 * language task scheduling, and user prompts.
 */

import {
  ConversationId,
  MessageId,
  MessageRole,
  IsoDateTimeString,
} from '../types/common';

export interface MessageMetadata {
  /**
   * Detected user intent (e.g. 'create_task', 'query_schedule', 'delete_task')
   */
  readonly detectedIntent?: string;
  /**
   * AI confidence score from 0.0 to 1.0
   */
  readonly confidenceScore?: number;
  /**
   * Associated task or note IDs referenced in this message
   */
  readonly referencedEntityIds?: readonly string[];
  /**
   * Raw prompt or tool arguments
   */
  readonly rawToolCalls?: readonly unknown[];
  /**
   * Custom metadata
   */
  readonly [key: string]: unknown;
}

export interface Message {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly role: MessageRole;
  readonly content: string;
  readonly metadata?: MessageMetadata;
  readonly createdAt: IsoDateTimeString;
}

export interface Conversation {
  readonly id: ConversationId;
  readonly title: string;
  readonly createdAt: IsoDateTimeString;
  readonly updatedAt: IsoDateTimeString;
  readonly metadata?: Record<string, unknown>;
}

export interface CreateMessageProps {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly role: MessageRole;
  readonly content: string;
  readonly metadata?: MessageMetadata;
  readonly createdAt?: IsoDateTimeString;
}

export interface CreateConversationProps {
  readonly id: ConversationId;
  readonly title: string;
  readonly createdAt?: IsoDateTimeString;
  readonly updatedAt?: IsoDateTimeString;
  readonly metadata?: Record<string, unknown>;
}

export function createMessage(props: CreateMessageProps): Message {
  const now = new Date().toISOString();
  return {
    id: props.id,
    conversationId: props.conversationId,
    role: props.role,
    content: props.content,
    metadata: props.metadata,
    createdAt: props.createdAt ?? now,
  };
}

export function createConversation(props: CreateConversationProps): Conversation {
  const now = new Date().toISOString();
  return {
    id: props.id,
    title: props.title.trim(),
    createdAt: props.createdAt ?? now,
    updatedAt: props.updatedAt ?? now,
    metadata: props.metadata,
  };
}
