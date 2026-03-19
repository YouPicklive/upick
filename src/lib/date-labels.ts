/**
 * Smart event date label formatting.
 * Produces compact, human-friendly labels from starts_at / ends_at strings.
 */

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isTomorrow(d: Date): boolean {
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return d.getFullYear() === tom.getFullYear() && d.getMonth() === tom.getMonth() && d.getDate() === tom.getDate();
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayLabel(d: Date): string {
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return `${SHORT_DAYS[d.getDay()]} • ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function timeStr(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return m === 0 ? `${h}:00 ${ampm}` : `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function hasTime(d: Date): boolean {
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

/**
 * Format an event date label from ISO strings.
 *
 * Examples:
 *  - Today • 7:00 PM
 *  - Today • 7:00 PM–9:00 PM
 *  - Sat • Mar 21 • 7:00 PM
 *  - Sat • Mar 21 • 7:00 PM–9:00 PM
 *  - Fri • Mar 21 • 7:00 PM – Sun • Mar 23 • 4:00 PM
 *  - Sat • Mar 21
 */
export function formatEventDateLabel(startsAt?: string | null, endsAt?: string | null): string {
  if (!startsAt) return '';

  const start = new Date(startsAt);
  if (isNaN(start.getTime())) return '';

  const startDay = dayLabel(start);
  const startHasTime = hasTime(start);

  if (!endsAt) {
    // No end date
    return startHasTime ? `${startDay} • ${timeStr(start)}` : startDay;
  }

  const end = new Date(endsAt);
  if (isNaN(end.getTime())) {
    return startHasTime ? `${startDay} • ${timeStr(start)}` : startDay;
  }

  if (sameDay(start, end)) {
    // Same day
    if (startHasTime && hasTime(end)) {
      return `${startDay} • ${timeStr(start)}–${timeStr(end)}`;
    }
    if (startHasTime) {
      return `${startDay} • ${timeStr(start)}`;
    }
    return startDay;
  }

  // Multi-day
  const endDay = dayLabel(end);
  if (startHasTime && hasTime(end)) {
    return `${startDay} • ${timeStr(start)} – ${endDay} • ${timeStr(end)}`;
  }
  if (startHasTime) {
    return `${startDay} • ${timeStr(start)} – ${endDay}`;
  }
  return `${startDay} – ${endDay}`;
}

export type FeedTimeframe = 'today' | 'weekend' | 'week';

/**
 * Compute ISO date-window boundaries for a given timeframe.
 */
export function getTimeframeRange(timeframe: FeedTimeframe): { rangeStart: string; rangeEnd: string } {
  const now = new Date();

  switch (timeframe) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    case 'weekend': {
      // Find this Friday 00:00 → Sunday 23:59:59
      const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
      let fridayOffset: number;
      if (day === 0) {
        // Sunday — show today as weekend
        fridayOffset = -2;
      } else if (day === 6) {
        // Saturday — show from yesterday (Friday)
        fridayOffset = -1;
      } else {
        fridayOffset = 5 - day;
      }
      const friday = new Date(now);
      friday.setDate(friday.getDate() + fridayOffset);
      friday.setHours(0, 0, 0, 0);
      const monday = new Date(friday);
      monday.setDate(monday.getDate() + 3);
      return { rangeStart: friday.toISOString(), rangeEnd: monday.toISOString() };
    }
    case 'week': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
  }
}

export const TIMEFRAME_LABELS: Record<FeedTimeframe, string> = {
  today: 'Today',
  weekend: 'This Weekend',
  week: 'Next 7 Days',
};
