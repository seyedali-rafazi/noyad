import { usePlannerStore } from '../../features/planner/plannerStore';
import { formatJalaliFullDate } from '../calendar';
import { ProposedActionPreview } from '../../shared/preview/mockData';
import { TaskPriority } from '../../domain/types/common';

export interface AiResponse {
  success: boolean;
  reply: string;
  proposedAction?: ProposedActionPreview;
  usedKeyId?: string;
  failoverOccurred?: boolean;
  provider?: 'groq';
  reason?: 'NO_KEYS' | 'ALL_KEYS_EXHAUSTED' | 'NETWORK_ERROR' | 'INVALID_RESPONSE';
}

/**
 * Builds the comprehensive system prompt for Persian Jalali calendar management.
 */
export function getAiSystemPrompt(): string {
  const planner = usePlannerStore.getState();
  const today = new Date();
  const jalaliToday = formatJalaliFullDate(today);
  const todayTasks = planner.getTasksForDate(today);
  const overdueTasks = planner.getOverdueTasks();

  const tasksSummary =
    todayTasks.length === 0
      ? 'هیچ تسکی برای امروز ثبت نشده است.'
      : todayTasks
          .map(
            (t) =>
              `- ${t.title} [وضعیت: ${
                t.status === 'completed' ? 'انجام شده' : 'در انتظار'
              }, اولویت: ${t.priority}]`
          )
          .join('\n');

  const overdueSummary =
    overdueTasks.length === 0
      ? 'هیچ تسک عقب‌افتاده‌ای وجود ندارد.'
      : overdueTasks.map((t) => `- ${t.title}`).join('\n');

  return `شما یک دستیار هوشمند، بسیار منظم، دقیق و فارسی‌زبان برای مدیریت زمان و برنامه‌ریزی روزانه بر مبنای گاه‌شماری هجری شمسی (جلالی) هستید.
نام شما «دستیار هوشمند تقویم» است.

اطلاعات زمانی و برنامه کاربر:
- امروز: ${jalaliToday} (معادل میلادی: ${today.toISOString().split('T')[0]})
- ساعت محلی فعلی: ${today.toLocaleTimeString('fa-IR')}
- کارهای ثبت‌شده امروز:
${tasksSummary}
- کارهای عقب‌افتاده:
${overdueSummary}

قوانین رفتار:
۱. همواره به زبان فارسی سلیس، محترمانه، پرانرژی و خلاصه پاسخ دهید.
۲. تقویم اصلی کاربر تقویم شمسی (جلالی) است و آغاز هفته شنبه می‌باشد.
۳. در صورتی که کاربر از شما خواست کاری، تسکی، قراری یا برنامه‌ای ثبت، اضافه یا تنظیم کند، علاوه بر پاسخ متنی زیبا و دلگرم‌کننده، در انتهای پیام خود یک بلاک کد JSON با فرمت زیر اضافه کنید تا اپلیکیشن بتواند آن را مستقیماً به کارت تعاملی تایید تبدیل کند:
\`\`\`json
{
  "action": "create_task",
  "title": "عنوان کار به فارسی",
  "dueDateLabel": "مثلا: امروز ۱۸:۰۰ یا فردا ۱۰:۰۰",
  "dueDate": "${today.toISOString()}",
  "priority": "low" | "medium" | "high" | "urgent",
  "priorityLabel": "پایین" | "متوسط" | "بالا" | "فوری"
}
\`\`\`
۴. توجه بسیار مهم: از هیچ‌گونه فراخوانی ابزار (Function/Tool call) یا تگ‌های سیستمی و کانال‌ها (مانند channel) استفاده نکنید. پاسخ شما باید کاملاً به صورت متن ساده و یکپارچه باشد و در صورت نیاز به ثبت کار، تنها از بلاک مارک‌داون json در انتهای پیام استفاده شود.
اگر کاربر صرفاً مشورت خواست یا پرسش عمومی درباره کارهایش داشت، نیازی به بلاک JSON نیست و فقط پاسخ متنی به او بدهید.`;
}

/**
 * Extracts and recovers generated text from Groq's failed_generation payload
 * (which occurs when Groq misclassifies output formatting as tool calls e.g. "Tool choice is none, but model called a tool").
 */
export function extractFromFailedGeneration(failedGen: unknown): string | null {
  if (!failedGen) return null;
  const raw = typeof failedGen === 'string' ? failedGen : JSON.stringify(failedGen);
  if (!raw.trim()) return null;

  // 1. Try parsing directly if valid JSON
  try {
    const parsed = typeof failedGen === 'object' && failedGen !== null ? failedGen : JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const args = (parsed as Record<string, unknown>).arguments ??
        (parsed as Record<string, unknown>).args ??
        (parsed as Record<string, unknown>).parameters;

      if (typeof args === 'string' && args.trim().length > 0) {
        let content = args.trim();
        if (content.includes('\\n')) {
          content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
        return content;
      }
      if (typeof args === 'object' && args !== null) {
        return '```json\n' + JSON.stringify(args, null, 2) + '\n```';
      }
    }
  } catch {
    // Continue to regex
  }

  // 2. Regex match for "arguments": ...
  const argMatch = raw.match(/"arguments"\s*:\s*([\s\S]*)$/);
  if (argMatch) {
    let content = argMatch[1].trim();

    // Check if quoted string
    if (
      (content.startsWith('"') && content.endsWith('"')) ||
      (content.startsWith("'") && content.endsWith("'"))
    ) {
      try {
        content = JSON.parse(content);
      } catch {
        content = content.slice(1, -1);
      }
    } else if (content.endsWith('}')) {
      content = content.replace(/\s*\}\s*$/, '');
    }

    if (content.includes('\\n')) {
      content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }

    return content.trim();
  }

  // 3. Fallback: check for channel tag
  const channelMatch = raw.match(/<\|channel\|>[^\n]*\n([\s\S]*)/);
  if (channelMatch) {
    return channelMatch[1].trim();
  }

  return raw.trim();
}

export function resolveDueDateIso(rawDate?: unknown, label?: unknown): string {
  if (typeof rawDate === 'string' && rawDate.trim() && !isNaN(Date.parse(rawDate))) {
    return new Date(rawDate).toISOString();
  }

  const d = new Date();
  const labelStr = String(label || '').toLowerCase();

  if (labelStr.includes('پس‌فردا') || labelStr.includes('پس فردا')) {
    d.setDate(d.getDate() + 2);
  } else if (labelStr.includes('فردا')) {
    d.setDate(d.getDate() + 1);
  }

  // Convert Persian/Arabic digits to English digits
  const normalized = labelStr.replace(/[۰-۹]/g, (w) =>
    String.fromCharCode(w.charCodeAt(0) - 1728)
  );

  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/) || normalized.match(/ساعت\s*(\d{1,2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    }
  }

  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

/**
 * Extracts structured JSON action block from AI response text if present.
 */
export function extractActionFromText(text: string): {
  cleanReply: string;
  proposedAction?: ProposedActionPreview;
} {
  const jsonMatch =
    text.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
    text.match(/```\s*(\{[\s\S]*?"action"\s*:\s*"[^"]+"[\s\S]*?\})\s*```/) ||
    text.match(/(\{[\s\S]*?"action"\s*:\s*"[^"]+"[\s\S]*?\})/);

  if (!jsonMatch) {
    return { cleanReply: text.trim() };
  }

  try {
    const rawJson = jsonMatch[1];
    const parsed = JSON.parse(rawJson);
    let proposedAction: ProposedActionPreview | undefined = undefined;

    const actionType = String(parsed.action || parsed.type || '').toLowerCase();
    const isTaskOrMeeting =
      actionType === 'create_task' ||
      actionType === 'add_task' ||
      actionType === 'new_task' ||
      actionType === 'create_event' ||
      actionType === 'add_event' ||
      actionType === 'new_event' ||
      actionType === 'create_meeting' ||
      actionType === 'add_meeting' ||
      actionType === 'new_meeting' ||
      actionType === 'set_meeting' ||
      actionType === 'schedule_meeting' ||
      actionType === 'meeting' ||
      actionType === 'event';

    if (isTaskOrMeeting && parsed.title) {
      const dueDateIso = resolveDueDateIso(parsed.dueDate, parsed.dueDateLabel);

      const priorityMap: Record<string, TaskPriority> = {
        urgent: 'urgent',
        high: 'high',
        medium: 'medium',
        low: 'low',
        فوری: 'urgent',
        زیاد: 'high',
        بالا: 'high',
        متوسط: 'medium',
        پایین: 'low',
        کم: 'low',
      };

      const mappedPriority: TaskPriority =
        priorityMap[parsed.priority] || priorityMap[parsed.priorityLabel] || 'medium';

      const priorityLabels: Record<TaskPriority, string> = {
        urgent: 'فوری',
        high: 'بالا',
        medium: 'متوسط',
        low: 'پایین',
      };

      proposedAction = {
        type: 'create_task',
        title: parsed.title,
        dueDate: dueDateIso,
        dueDateLabel: parsed.dueDateLabel || 'امروز',
        priority: mappedPriority,
        priorityLabel: parsed.priorityLabel || priorityLabels[mappedPriority],
        isDestructive: false,
      };
    }

    // Remove json code block from text
    let cleanReply = text.replace(/```json\s*\{[\s\S]*?\}\s*```/, '').trim();
    if (cleanReply === text.trim() && jsonMatch[0]) {
      cleanReply = text.replace(jsonMatch[0], '').trim();
    }
    return { cleanReply, proposedAction };
  } catch {
    return { cleanReply: text.trim() };
  }
}
