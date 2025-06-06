export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // Store date as ISO string (YYYY-MM-DD)
  startTime?: string; // Store time as HH:mm
  endTime?: string; // Store time as HH:mm
  allDay: boolean;
  reminderMinutes?: number; // Minutes before the event to send a notification (optional)
}

export interface TodoItem {
    id: string;
    title: string;
    date: string; // Store date as ISO string (YYYY-MM-DD)
    completed: boolean;
    description?: string;
}
