import { usePlannerStore } from '../../features/planner/plannerStore';
import { formatJalaliFullDate, formatJalaliShortDate, formatPersianTime } from '../calendar';
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
 * Converts markdown pipe tables to clean numbered list lines (e.g. "۱. عنوان تسک - ۱۷ مهر").
 * Avoids broken/ugly ASCII pipe tables in mobile chat bubbles.
 */
export function convertMarkdownTableToList(text: string): string {
  if (!text || !text.includes('|')) return text;

  const lines = text.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;

    // Find separator row (contains only -, :, |, space)
    const sepIndex = tableRows.findIndex((line) =>
      /^\|[\s\-:|]+\|$/.test(line.trim())
    );

    let dataRows: string[] = [];
    if (sepIndex >= 0) {
      dataRows = tableRows.slice(sepIndex + 1);
    } else {
      // If no separator row, check if first row is header
      dataRows = tableRows.length > 1 ? tableRows.slice(1) : tableRows;
    }

    let itemNumber = 1;
    for (const row of dataRows) {
      const trimmed = row.trim();
      if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      if (cells.length === 0) continue;

      // Check if first cell is already a number or ordinal (e.g. "1", "۱", "1.", "۱-")
      const firstCell = cells[0];
      const isFirstCellIndex = /^[\d۰-۹]+[\.\-\)]?$/.test(firstCell);

      let indexStr = '';
      let contentCells: string[] = [];
      if (isFirstCellIndex) {
        indexStr = firstCell.replace(/[\.\-\)]/g, '').trim();
        contentCells = cells.slice(1);
      } else {
        indexStr = String(itemNumber);
        contentCells = cells;
      }

      if (contentCells.length > 0) {
        const lineText = contentCells.join(' - ');
        result.push(`${indexStr}. ${lineText}`);
        itemNumber++;
      }
    }

    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1;

    if (isTableRow) {
      inTable = true;
      tableRows.push(trimmed);
    } else {
      if (inTable) {
        flushTable();
      }
      result.push(line);
    }
  }

  if (inTable) {
    flushTable();
  }

  return result.join('\n');
}

/**
 * Builds the comprehensive system prompt for Persian Jalali calendar management.
 */
export function getAiSystemPrompt(): string {
  const planner = usePlannerStore.getState();
  const today = new Date();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const jalaliToday = formatJalaliFullDate(today);
  const jalaliTomorrow = formatJalaliFullDate(tomorrow);
  const jalaliDayAfterTomorrow = formatJalaliFullDate(dayAfterTomorrow);
  const jalaliYesterday = formatJalaliFullDate(yesterday);

  const todayIso = today.toISOString().split('T')[0];
  const tomorrowIso = tomorrow.toISOString().split('T')[0];
  const dayAfterTomorrowIso = dayAfterTomorrow.toISOString().split('T')[0];

  const todayTasks = planner.getTasksForDate(today);
  const tomorrowTasks = planner.getTasksForDate(tomorrow);
  const overdueTasks = planner.getOverdueTasks();

  const priorityLabelMap: Record<string, string> = {
    urgent: 'فوری',
    high: 'بالا',
    medium: 'متوسط',
    low: 'پایین',
  };

  const tasksSummary =
    todayTasks.length === 0
      ? 'هیچ تسکی برای امروز ثبت نشده است.'
      : todayTasks
          .map((t, idx) => {
            const timeStr = t.dueDate ? formatPersianTime(t.dueDate) : '';
            const priorityStr = priorityLabelMap[t.priority] || 'متوسط';
            return `${idx + 1}. ${t.title}${timeStr ? ` (ساعت: ${timeStr})` : ''} [وضعیت: ${
              t.status === 'completed' ? 'انجام شده' : 'در انتظار'
            }، اولویت: ${priorityStr}]`;
          })
          .join('\n');

  const tomorrowTasksSummary =
    tomorrowTasks.length === 0
      ? 'هیچ تسکی برای فردا ثبت نشده است (لیست تسک‌های فردا کاملاً خالی است).'
      : tomorrowTasks
          .map((t, idx) => {
            const timeStr = t.dueDate ? formatPersianTime(t.dueDate) : '';
            const priorityStr = priorityLabelMap[t.priority] || 'متوسط';
            return `${idx + 1}. ${t.title}${timeStr ? ` (ساعت: ${timeStr})` : ''} [وضعیت: ${
              t.status === 'completed' ? 'انجام شده' : 'در انتظار'
            }، اولویت: ${priorityStr}]`;
          })
          .join('\n');

  const overdueSummary =
    overdueTasks.length === 0
      ? 'هیچ تسک عقب‌افتاده‌ای وجود ندارد.'
      : overdueTasks
          .map((t, idx) => {
            const dateStr = t.dueDate ? formatJalaliShortDate(t.dueDate) : '';
            const priorityStr = priorityLabelMap[t.priority] || 'متوسط';
            return `${idx + 1}. ${t.title}${dateStr ? ` - ${dateStr}` : ''} [اولویت: ${priorityStr}]`;
          })
          .join('\n');

  return `شما یک دستیار هوشمند، بسیار منظم، دقیق و فارسی‌زبان برای مدیریت زمان و برنامه‌ریزی روزانه بر مبنای گاه‌شماری هجری شمسی (جلالی) در اپلیکیشن «نویاد» (Noyad) هستید.
نام شما «نویاد» (دستیار هوشمند نویاد) است.

اطلاعات تقویم و زمان دقیق:
- دیروز: ${jalaliYesterday}
- امروز: ${jalaliToday} (معادل میلادی: ${todayIso})
- فردا: ${jalaliTomorrow} (معادل میلادی: ${tomorrowIso})
- پس‌فردا: ${jalaliDayAfterTomorrow} (معادل میلادی: ${dayAfterTomorrowIso})
- ساعت محلی فعلی: ${today.toLocaleTimeString('fa-IR')}

برنامه کارهای کاربر:
- کارهای ثبت‌شده امروز (${jalaliToday}):
${tasksSummary}

- کارهای ثبت‌شده فردا (${jalaliTomorrow}):
${tomorrowTasksSummary}

- کارهای عقب‌افتاده:
${overdueSummary}

قوانین رفتار و پاسخ‌دهی (بسیار مهم و الزامی):
۱. همواره به زبان فارسی سلیس، محترمانه، پرانرژی و خلاصه پاسخ دهید.
۲. تقویم اصلی کاربر تقویم شمسی (جلالی) است و آغاز هفته شنبه می‌باشد.
۳. قانون قطعی برنامه‌ریزی برای فردا (فقط و فقط بر اساس تسک‌های ثبت‌شده فردا):
- تاریخ فردا دقیقاً برابر است با: «${jalaliTomorrow}». هرگز روز هفته دیگری را اشتباه نگویید.
- وقتی کاربر می‌گوید «برای فردا برنامه‌ریزی کن» یا درباره برنامه فردا می‌پرسد:
  الف) برنامه‌ریزی فردا باید صرفاً، منحصراً و فقط بر اساس تسک‌های ثبت‌شده در بخش «کارهای ثبت‌شده فردا» چیده شود.
  ب) اکیداً و به هیچ وجه تسک‌های ساختگی، خیالی یا روتین‌های فرضی (مانند بیدار شدن، ورزش صبحگاهی، صبحانه، بررسی ایمیل، مطالعه و...) از خودتان اختراع نکنید! تنها کارهایی که در لیست کارهای فردا وجود دارند را زمان‌بندی کنید.
  ج) اگر هیچ تسکی برای فردا ثبت نشده است (لیست خالی است): به طور واضح و خلاصه بگویید «برای فردا (${jalaliTomorrow}) هیچ تسکی ثبت نشده است و وقت شما کاملاً آزاد است.» و از ساختن برنامه فرضی خودداری کنید. می‌توانید از کاربر بپرسید که آیا مایل است تسک خاصی برای فردا ثبت کند یا تسکی از کارهای امروز/عقب‌افتاده را به فردا موکول کند.
  د) هرگز تسک‌های امروز یا تسک‌های عقب‌افتاده را سرخود و بدون درخواست صریح کاربر به برنامه فردا منتقل نکنید.
۴. ممنوعیت رسم هرگونه جدول مارک‌داون (عدم استفاده از Table):
- اکیداً از کشیدن جدول مارک‌داون (مانند جدول‌های خطوط پایپ | و ستون‌بندی) خودداری کنید، چراکه در نمایشگر موبایل بسیار زشت و به‌هم‌ریخته نمایش داده می‌شود. به هیچ عنوان جدول نکشید.
- هنگام نمایش کارهای عقب‌افتاده یا هر لیست کاری، صرفاً و منحصراً از یک لیست شماره‌دار ساده و خطی از ۱ تا آخر استفاده کنید؛ دقیقاً به این فرمت نمونه:
  ۱. عنوان کار اول - ۱۷ مهر
  ۲. عنوان کار دوم - ۲۰ مهر
۵. در صورتی که کاربر از شما خواست کاری، تسکی، قراری یا برنامه‌ای ثبت، اضافه یا تنظیم کند، علاوه بر پاسخ متنی زیبا و دلگرم‌کننده، در انتهای پیام خود یک بلاک کد JSON با فرمت زیر اضافه کنید تا اپلیکیشن بتواند آن را مستقیماً به کارت تعاملی تایید تبدیل کند:
\`\`\`json
{
  "action": "create_task",
  "title": "عنوان کار به فارسی",
  "dueDateLabel": "مثلا: فردا ساعت ۱۰:۰۰ یا امروز ۱۸:۰۰",
  "dueDate": "${tomorrow.toISOString()}",
  "priority": "low" | "medium" | "high" | "urgent",
  "priorityLabel": "پایین" | "متوسط" | "بالا" | "فوری"
}
\`\`\`
۶. توجه: از هیچ‌گونه فراخوانی ابزار (Function/Tool call) یا تگ‌های سیستمی و کانال‌ها (مانند channel) استفاده نکنید. پاسخ شما باید کاملاً به صورت متن ساده و یکپارچه بدون جدول باشد. اگر کاربر صرفاً مشورت خواست یا پرسش عمومی درباره کارهایش داشت، نیازی به بلاک JSON نیست و فقط پاسخ متنی به او بدهید.`;
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
  const labelStr = String(label || '').toLowerCase();

  const targetDate = new Date();
  let dayAdjusted = false;

  if (labelStr.includes('پس‌فردا') || labelStr.includes('پس فردا')) {
    targetDate.setDate(targetDate.getDate() + 2);
    dayAdjusted = true;
  } else if (labelStr.includes('فردا')) {
    targetDate.setDate(targetDate.getDate() + 1);
    dayAdjusted = true;
  } else if (labelStr.includes('امروز')) {
    dayAdjusted = true;
  }

  // Convert Persian/Arabic digits to English digits
  const normalized = labelStr.replace(/[۰-۹]/g, (w) =>
    String.fromCharCode(w.charCodeAt(0) - 1728)
  );

  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/) || normalized.match(/ساعت\s*(\d{1,2})/);
  let extractedHours: number | null = null;
  let extractedMinutes: number | null = null;

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      extractedHours = hours;
      extractedMinutes = minutes;
    }
  }

  if (typeof rawDate === 'string' && rawDate.trim() && !isNaN(Date.parse(rawDate))) {
    const parsedDate = new Date(rawDate);
    if (dayAdjusted) {
      parsedDate.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    }
    if (extractedHours !== null && extractedMinutes !== null) {
      parsedDate.setHours(extractedHours, extractedMinutes, 0, 0);
    }
    return parsedDate.toISOString();
  }

  if (extractedHours !== null && extractedMinutes !== null) {
    targetDate.setHours(extractedHours, extractedMinutes, 0, 0);
  } else {
    targetDate.setHours(18, 0, 0, 0);
  }

  return targetDate.toISOString();
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
    return { cleanReply: convertMarkdownTableToList(text).trim() };
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
        dueDateLabel: parsed.dueDateLabel || 'فردا',
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
    cleanReply = convertMarkdownTableToList(cleanReply).trim();
    return { cleanReply, proposedAction };
  } catch {
    return { cleanReply: convertMarkdownTableToList(text).trim() };
  }
}

