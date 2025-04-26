"use client";

import type { CalendarEvent } from "@/lib/types";

const EVENTS_STORAGE_KEY = "chronozen_events";

// Helper to safely get events from local storage
const safelyGetEvents = (): CalendarEvent[] => {
  if (typeof window === "undefined") {
    return []; // Return empty array if not in browser environment
  }
  try {
    const storedEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
    return storedEvents ? (JSON.parse(storedEvents) as CalendarEvent[]) : [];
  } catch (error) {
    console.error("Error reading events from local storage:", error);
    return [];
  }
};

// Helper to safely set events to local storage
const safelySetEvents = (events: CalendarEvent[]): void => {
  if (typeof window === "undefined") {
    return; // Do nothing if not in browser environment
  }
  try {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error("Error writing events to local storage:", error);
  }
};

export const getEvents = (): CalendarEvent[] => {
  return safelyGetEvents();
};

export const addEvent = (newEvent: Omit<CalendarEvent, 'id'>): CalendarEvent => {
  const events = safelyGetEvents();
  const eventWithId: CalendarEvent = {
    ...newEvent,
    id: crypto.randomUUID(), // Generate a unique ID
  };
  const updatedEvents = [...events, eventWithId];
  safelySetEvents(updatedEvents);
  return eventWithId;
};

export const updateEvent = (updatedEvent: CalendarEvent): CalendarEvent | null => {
  const events = safelyGetEvents();
  const eventIndex = events.findIndex((event) => event.id === updatedEvent.id);
  if (eventIndex === -1) {
    console.error("Event not found for update:", updatedEvent.id);
    return null; // Event not found
  }
  const updatedEvents = [...events];
  updatedEvents[eventIndex] = updatedEvent;
  safelySetEvents(updatedEvents);
  return updatedEvent;
};

export const deleteEvent = (eventId: string): boolean => {
  const events = safelyGetEvents();
  const initialLength = events.length;
  const updatedEvents = events.filter((event) => event.id !== eventId);
  if (updatedEvents.length === initialLength) {
     console.warn("Event not found for deletion:", eventId);
     return false; // Event not found
  }
  safelySetEvents(updatedEvents);
  return true; // Deletion successful
};

export const getEventsForDate = (date: string): CalendarEvent[] => {
  const events = safelyGetEvents();
  return events.filter(event => event.date === date);
};

export const getEventsForWeek = (startDate: Date): CalendarEvent[] => {
  const events = safelyGetEvents();
  const weekEvents: CalendarEvent[] = [];
  const weekStart = new Date(startDate);
  weekStart.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    const dateString = currentDate.toISOString().split('T')[0];
    weekEvents.push(...events.filter(event => event.date === dateString));
  }
  return weekEvents.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
};

export const getEventsForMonth = (year: number, month: number): CalendarEvent[] => {
  const events = safelyGetEvents();
  const monthString = `${year}-${String(month + 1).padStart(2, '0')}`; // YYYY-MM
  return events.filter(event => event.date.startsWith(monthString));
};
