import { GroqClient } from '../src/core/ai/groqClient';
import { aiClient } from '../src/core/ai/aiClient';
import { useAiSettingsStore, GROQ_MODEL_ID } from '../src/core/ai/aiSettingsStore';
import { useChatStore } from '../src/features/chat/chatStore';
import { usePlannerStore } from '../src/features/planner/plannerStore';

// Mock global fetch
const originalFetch = globalThis.fetch;

describe('Groq AI Engine & Assistant Action Tests', () => {
  beforeEach(() => {
    // Reset Zustand store state
    useAiSettingsStore.setState({
      keys: [],
      selectedModel: GROQ_MODEL_ID,
      isLoading: false,
      isInitialized: true,
    });

    usePlannerStore.setState({
      tasks: [],
      taskFilter: 'today',
      selectedDate: new Date(),
    });

    useChatStore.setState({
      messages: [],
      isTyping: false,
      activeConfirmation: null,
    });

    jest.clearAllMocks();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Groq Key Management Store', () => {
    it('adds new Groq keys and prevents duplicate keys', async () => {
      const store = useAiSettingsStore.getState();
      const added1 = await store.addKey('gsk_testGroqKey123', 'کلید گرواک اصلی');
      expect(added1).toBe(true);

      const added2 = await store.addKey('gsk_testGroqKey456', 'کلید گرواک دوم');
      expect(added2).toBe(true);

      expect(useAiSettingsStore.getState().keys.length).toBe(2);

      // Attempt duplicate key
      const addedDuplicate = await store.addKey('gsk_testGroqKey123', 'کلید تکراری');
      expect(addedDuplicate).toBe(false);
      expect(useAiSettingsStore.getState().keys.length).toBe(2);
    });

    it('filters active keys and handles status lifecycle', async () => {
      const store = useAiSettingsStore.getState();
      await store.addKey('gsk_groq1', 'گرواک ۱');
      await store.addKey('gsk_groq2', 'گرواک ۲');

      expect(store.getActiveKeys().length).toBe(2);

      // Mark Groq key exhausted (e.g. rate limit)
      await store.markKeyExhausted('gsk_groq1');
      expect(store.getActiveKeys().length).toBe(1);
      expect(store.getActiveKeys()[0].apiKey).toBe('gsk_groq2');

      // Reset statuses returns it to active
      await store.resetKeyStatuses();
      expect(store.getActiveKeys().length).toBe(2);
    });
  });

  describe('Groq (GPT 20B) Failover & Invocation', () => {
    it('returns guidance message when no Groq API keys are registered', async () => {
      const client = new GroqClient();
      const response = await client.generateResponse('سلام من برنامه جدید می‌خوام');

      expect(response.success).toBe(false);
      expect(response.reason).toBe('NO_KEYS');
      expect(response.provider).toBe('groq');
      expect(response.reply).toContain('کلید API گرواک (Groq) ثبت نشده است');
    });

    it('successfully calls Groq OpenAI-compatible endpoint with Bearer auth and GPT 20B model', async () => {
      const store = useAiSettingsStore.getState();
      await store.addKey('gsk_validKeyTest123', 'کلید گرواک سالم');

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'سلام! با هوش مصنوعی سریع Groq در خدمت شما هستم.',
              },
            },
          ],
        }),
      });

      const client = new GroqClient();
      const response = await client.generateResponse('سلام Groq');

      expect(response.success).toBe(true);
      expect(response.provider).toBe('groq');
      expect(response.reply).toContain('سلام! با هوش مصنوعی سریع Groq');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      // Inspect call headers & endpoint
      const [url, options] = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
      expect(options.headers.Authorization).toBe('Bearer gsk_validKeyTest123');

      const parsedBody = JSON.parse(options.body);
      expect(parsedBody.model).toBe(GROQ_MODEL_ID);
    });

    it('fails over to second Groq key when first key hits 429 rate limit', async () => {
      const store = useAiSettingsStore.getState();
      await store.addKey('gsk_groqKey1_Exhausted', 'گرواک سهمیه تمام');
      await store.addKey('gsk_groqKey2_Healthy', 'گرواک سالم');

      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({ error: { message: 'Rate limit reached' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'پاسخ گرواک از کلید دوم.',
                },
              },
            ],
          }),
        });

      const client = new GroqClient();
      const response = await client.generateResponse('تسک جدید بده');

      expect(response.success).toBe(true);
      expect(response.provider).toBe('groq');
      expect(response.reply).toBe('پاسخ گرواک از کلید دوم.');
      expect(response.failoverOccurred).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);

      const key1 = useAiSettingsStore.getState().keys.find((k) => k.apiKey === 'gsk_groqKey1_Exhausted');
      expect(key1?.status).toBe('exhausted');
    });

    it('marks key invalid on 401 Unauthorized', async () => {
      const store = useAiSettingsStore.getState();
      await store.addKey('gsk_invalidKey', 'کلید اشتباه');

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API Key' } }),
      });

      const client = new GroqClient();
      const response = await client.generateResponse('سلام');

      expect(response.success).toBe(false);
      const key = useAiSettingsStore.getState().keys.find((k) => k.apiKey === 'gsk_invalidKey');
      expect(key?.status).toBe('invalid');
    });

    it('recovers cleanly when Groq returns 400 tool_use_failed with failed_generation', async () => {
      const store = useAiSettingsStore.getState();
      await store.addKey('gsk_keyWithFailedGen', 'کلید تست failed_generation');

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            message: 'Tool choice is none, but model called a tool',
            type: 'invalid_request_error',
            code: 'tool_use_failed',
            failed_generation:
              '{"name": "assistant<|channel|>final", "arguments": متوجه شدم! جلسه کاری شما را برای ساعت ۹ شب برنامه‌ریزی می‌کنیم.\\n\\n```json\\n{\\n  "action": "create_task",\\n  "title": "جلسه کاری",\\n  "dueDateLabel": "امروز ۲۱:۰۰",\\n  "dueDate": "2026-10-17T21:00:00.000Z",\\n  "priority": "high",\\n  "priorityLabel": "بالا"\\n}\\n```\\n}',
          },
        }),
      });

      const client = new GroqClient();
      const response = await client.generateResponse('نه شب جلسه دارم');

      expect(response.success).toBe(true);
      expect(response.provider).toBe('groq');
      expect(response.reply).toContain('متوجه شدم! جلسه کاری شما را برای ساعت ۹ شب');
      expect(response.proposedAction).toBeDefined();
      expect(response.proposedAction?.title).toBe('جلسه کاری');
      expect(response.proposedAction?.priorityLabel).toBe('بالا');
    });
  });

  describe('Unified AiClient Dispatcher', () => {
    it('dispatches requests to Groq GPT 20B client directly', async () => {
      await useAiSettingsStore.getState().addKey('gsk_test123', 'گرواک');

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'پاسخ ارسالی از گرواک مدل ۲۰ میلیاردی',
              },
            },
          ],
        }),
      });

      const response = await aiClient.generateResponse('تست گرواک');
      expect(response.success).toBe(true);
      expect(response.provider).toBe('groq');
      expect(response.reply).toBe('پاسخ ارسالی از گرواک مدل ۲۰ میلیاردی');
    });
  });

  describe('Assistant Task Creation & Persistence Fix', () => {
    it('creates and adds task to planner with due date when user confirms proposed action', () => {
      const chat = useChatStore.getState();
      const planner = usePlannerStore.getState();

      expect(planner.tasks.length).toBe(0);

      // Simulate proposed action from AI
      chat.confirmAction({
        type: 'create_task',
        title: 'جلسه بازبینی طراحی اپلیکیشن',
        dueDateLabel: 'امروز ۱۸:۰۰',
        priorityLabel: 'بالا',
        isDestructive: false,
      });

      const updatedTasks = usePlannerStore.getState().tasks;
      expect(updatedTasks.length).toBe(1);
      expect(updatedTasks[0].title).toBe('جلسه بازبینی طراحی اپلیکیشن');
      expect(updatedTasks[0].priority).toBe('high');
      expect(updatedTasks[0].dueDate).toBeDefined();
      expect(updatedTasks[0].dueDate).not.toBeNull();

      // Verify it appears in today filtered tasks
      const filteredToday = usePlannerStore.getState().getFilteredTasks();
      expect(filteredToday.some((t) => t.title === 'جلسه بازبینی طراحی اپلیکیشن')).toBe(true);
    });

    it('correctly handles meeting action types (create_meeting, schedule_meeting) and syncs selectedDate', () => {
      const chat = useChatStore.getState();

      // Simulate action with action type "create_meeting"
      chat.confirmAction({
        type: 'create_task',
        action: 'create_meeting',
        title: 'جلسه اضطراری با تیم فنی',
        dueDateLabel: 'فردا ساعت ۱۰:۳۰',
        priorityLabel: 'فوری',
        isDestructive: false,
      } as any);

      const tasks = usePlannerStore.getState().tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('جلسه اضطراری با تیم فنی');
      expect(tasks[0].priority).toBe('urgent');

      // Check that selectedDate in planner was synchronized to the meeting day
      const selectedDate = usePlannerStore.getState().selectedDate;
      const meetingDue = new Date(tasks[0].dueDate!);
      expect(selectedDate.getDate()).toBe(meetingDue.getDate());

      // Check tasks for selectedDate returns the newly created meeting immediately
      const tasksOnDate = usePlannerStore.getState().getTasksForDate(selectedDate);
      expect(tasksOnDate.some((t) => t.title === 'جلسه اضطراری با تیم فنی')).toBe(true);
    });
  });
});
