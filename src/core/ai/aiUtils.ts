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
اگر کاربر صرفاً مشورت خواست یا پرسش عمومی درباره کارهایش داشت، نیازی به بلاک JSON نیست و فقط پاسخ متنی به او بدهید.`;
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

    const actionType = parsed.action || parsed.type;
    if (
      (actionType === 'create_task' || actionType === 'add_task' || actionType === 'new_task') &&
      parsed.title
    ) {
      let dueDateIso = parsed.dueDate;
      if (!dueDateIso || isNaN(Date.parse(dueDateIso))) {
        const d = new Date();
        const label = parsed.dueDateLabel || '';
        if (label.includes('پس‌فردا')) {
          d.setDate(d.getDate() + 2);
          d.setHours(10, 0, 0, 0);
        } else if (label.includes('فردا')) {
          d.setDate(d.getDate() + 1);
          d.setHours(10, 0, 0, 0);
        } else {
          d.setHours(18, 0, 0, 0);
        }
        dueDateIso = d.toISOString();
      }

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
