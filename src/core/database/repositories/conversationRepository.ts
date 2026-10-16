import { eq, desc, asc } from 'drizzle-orm';
import { getDatabase, type AppDatabase } from '../client';
import { conversations, type ConversationSelect } from '../schema/conversations';
import { messages, type MessageSelect } from '../schema/messages';
import {
  Conversation,
  Message,
  createConversation,
  createMessage,
} from '../../../domain/models/conversation';
import { ConversationId } from '../../../domain/types/common';
import { IConversationRepository } from '../../../application/ports/repositories';

export function mapConversationRecordToDomain(
  record: ConversationSelect
): Conversation {
  let metadata: Record<string, unknown> | undefined = undefined;
  if (record.metadata) {
    try {
      metadata = JSON.parse(record.metadata);
    } catch {
      metadata = undefined;
    }
  }

  return createConversation({
    id: record.id,
    title: record.title,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    metadata,
  });
}

export function mapMessageRecordToDomain(record: MessageSelect): Message {
  let metadata: Record<string, unknown> | undefined = undefined;
  if (record.metadata) {
    try {
      metadata = JSON.parse(record.metadata);
    } catch {
      metadata = undefined;
    }
  }

  return createMessage({
    id: record.id,
    conversationId: record.conversationId,
    role: record.role,
    content: record.content,
    metadata,
    createdAt: record.createdAt,
  });
}

export class SqliteConversationRepository implements IConversationRepository {
  constructor(private readonly getDb: () => AppDatabase = getDatabase) {}

  async findById(id: ConversationId): Promise<Conversation | null> {
    const db = this.getDb();
    const rows = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return mapConversationRecordToDomain(rows[0]);
  }

  async create(conversation: Conversation): Promise<Conversation> {
    const db = this.getDb();
    await db.insert(conversations).values({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      metadata: conversation.metadata
        ? JSON.stringify(conversation.metadata)
        : null,
    });
    return conversation;
  }

  async listRecent(limit = 20): Promise<readonly Conversation[]> {
    const db = this.getDb();
    const rows = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(limit);

    return rows.map(mapConversationRecordToDomain);
  }

  async getMessages(
    conversationId: ConversationId
  ): Promise<readonly Message[]> {
    const db = this.getDb();
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return rows.map(mapMessageRecordToDomain);
  }

  async addMessage(message: Message): Promise<Message> {
    const db = this.getDb();
    await db.insert(messages).values({
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null,
      createdAt: message.createdAt,
    });

    // Touch conversation updatedAt
    await db
      .update(conversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(conversations.id, message.conversationId));

    return message;
  }

  async delete(id: ConversationId): Promise<boolean> {
    const db = this.getDb();
    await db.delete(conversations).where(eq(conversations.id, id));
    return true;
  }
}

export const conversationRepository = new SqliteConversationRepository();
