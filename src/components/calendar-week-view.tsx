
 "use client";

import React, { FC } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addHours, startOfDay } from "date-fns";
import { CheckSquare } from 'lucide-react';

import type { CalendarEvent, TodoItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Removed CardDescription as it's not used
import { ScrollArea } from "@/components/ui/scroll-area";


interface CalendarWeekViewProps {
  date: Date;
  events: CalendarEvent[];
  todos: TodoItem[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onTodoClick: (todo: TodoItem) => void;
}

const CalendarWeekView: FC<CalendarWeekViewProps> = ({
    date,
    events,
    todos,
    onEventClick,
    onDateClick,
    onTodoClick,
}) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const currentMonth = date.getMonth();

  const dayStartHour = startOfDay(new Date());
  const hours = Array.from({ length: 24 }, (_, i) => addHours(dayStartHour, i));
  const hourHeight = 50; // Slightly reduced hour height for potentially more vertical space

  const getEventPosition = (event: CalendarEvent): { top: number; height: number } | null => {
     if (event.allDay || !event.startTime) {
       return null;
     }

     const [startHour, startMinute] = event.startTime.split(':').map(Number);
     const startTimeInMinutes = startHour * 60 + startMinute;

     let endTimeInMinutes: number;
     if (event.endTime) {
       const [endHour, endMinute] = event.endTime.split(':').map(Number);
       endTimeInMinutes = endHour * 60 + endMinute;
     } else {
       endTimeInMinutes = startTimeInMinutes + 60; // Default to 1 hour duration
     }

     if (endTimeInMinutes <= startTimeInMinutes) {
        endTimeInMinutes = startTimeInMinutes + 60; // Ensure minimum 1 hour if end time is invalid
     }

     const top = (startTimeInMinutes / 60) * hourHeight;
     const height = ((endTimeInMinutes - startTimeInMinutes) / 60) * hourHeight;

     return { top, height: Math.max(height, 15) }; // Minimum height for visibility
   };


  // Filter events and todos once per render cycle for the current week
  const weekEvents = React.useMemo(() => events.filter(event => {
      const eventDate = new Date(event.date + 'T00:00:00');
      return eventDate >= weekStart && eventDate <= weekEnd;
  }), [events, weekStart, weekEnd]);

  const weekTodos = React.useMemo(() => todos.filter(todo => {
      const todoDate = new Date(todo.date + 'T00:00:00');
      return todoDate >= weekStart && todoDate <= weekEnd;
  }), [todos, weekStart, weekEnd]);

  // Group pre-filtered items by day
  const eventsByDay = days.map(day =>
    weekEvents.filter(event => isSameDay(new Date(event.date + 'T00:00:00'), day))
  );
  const todosByDay = days.map(day =>
     weekTodos.filter(todo => isSameDay(new Date(todo.date + 'T00:00:00'), day))
   );

  const allDayEventsByDay = eventsByDay.map(dayEvents => dayEvents.filter(e => e.allDay));
  const timedEventsByDay = eventsByDay.map(dayEvents => dayEvents.filter(e => !e.allDay && e.startTime));


  return (
    <Card className="h-full flex flex-col">
       {/* Header Section (Week title and Day headers) */}
       <CardHeader className="pb-0 pt-3 px-2 sm:px-4 flex-shrink-0">
        <CardTitle className="text-base sm:text-lg text-center sm:text-left mb-2">
            Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </CardTitle>
        {/* Day Headers */}
        <div className="grid grid-cols-[30px_repeat(7,1fr)] sm:grid-cols-[48px_repeat(7,1fr)] border-b sticky top-0 bg-card z-10">
          <div className="text-xs text-muted-foreground w-full pr-1 sm:pr-2"></div> {/* Spacer for time column */}
           {days.map((day) => (
            <div
              key={day.toISOString()}
              className="text-center p-1 sm:p-2 border-l cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => onDateClick(day)}
               role="button"
               tabIndex={0}
               aria-label={`Go to date ${format(day, "MMMM d")}`}
            >
              <div className="text-[10px] sm:text-xs font-semibold">{format(day, "EEE")}</div>
              <div className={cn(
                  "text-sm sm:text-lg font-bold mt-0.5",
                  !isSameMonth(day, date) && "text-muted-foreground/50",
                  isSameDay(day, new Date()) && "text-primary"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
         {/* All Day / Todo Row */}
         <div className="grid grid-cols-[30px_repeat(7,1fr)] sm:grid-cols-[48px_repeat(7,1fr)] border-b min-h-[4rem] sm:min-h-[5rem]">
            <div className="text-[9px] sm:text-xs text-muted-foreground w-full pr-1 sm:pr-2 flex items-center justify-end text-right break-words">All-day</div>
            {days.map((day, dayIndex) => (
              <div key={`allday-${day.toISOString()}`} className="border-l p-0.5 sm:p-1 space-y-0.5 sm:space-y-1 overflow-y-auto max-h-[5rem] sm:max-h-[7rem]">
                  {/* All-Day Events */}
                  {allDayEventsByDay[dayIndex].map(event => (
                      <div
                          key={event.id}
                          className="p-1 px-1.5 rounded bg-accent/20 text-accent-foreground text-[9px] sm:text-xs cursor-pointer hover:bg-accent/30 truncate transition-colors"
                          onClick={() => onEventClick(event)}
                          role="button"
                          tabIndex={0}
                          aria-label={`All-day event on ${format(day, "MMMM d")}: ${event.title}`}
                          title={event.title}
                      >
                          {event.title}
                      </div>
                  ))}
                   {/* Todo Items */}
                   {todosByDay[dayIndex].map(todo => (
                        <div
                          key={todo.id}
                          className={cn(
                             "p-1 px-1.5 rounded bg-secondary/50 text-secondary-foreground text-[9px] sm:text-xs cursor-pointer hover:bg-secondary/70 truncate transition-colors flex items-center",
                             todo.completed && "line-through opacity-70"
                           )}
                          onClick={() => onTodoClick(todo)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Todo on ${format(day, "MMMM d")}: ${todo.title}${todo.completed ? ' (Completed)' : ''}`}
                          title={todo.title}
                        >
                           <CheckSquare className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0", todo.completed ? "text-green-600" : "text-muted-foreground")} />
                           {todo.title}
                        </div>
                   ))}
                   {/* Show placeholder if no items */}
                    {allDayEventsByDay[dayIndex].length === 0 && todosByDay[dayIndex].length === 0 && (
                       <div className="text-[9px] sm:text-xs text-muted-foreground italic p-1"></div>
                   )}
              </div>
            ))}
          </div>
      </CardHeader>
      {/* Main Content Area (Hourly Grid) */}
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          {/* Relative container for positioning events */}
          <div className="relative grid grid-cols-[30px_repeat(7,1fr)] sm:grid-cols-[48px_repeat(7,1fr)]">
            {/* Time Gutter and Grid Lines */}
            {hours.map((hour, hourIndex) => (
                <React.Fragment key={`timegrid-${format(hour, 'HH:mm')}`}>
                  {/* Time Label */}
                  <div
                      className="row-start-${hourIndex + 1} text-right pr-1 sm:pr-2 text-[9px] sm:text-xs text-muted-foreground pt-[-2px] w-full"
                      style={{ height: `${hourHeight}px` }}
                      aria-hidden="true"
                  >
                    {hourIndex > 0 ? format(hour, 'ha').toLowerCase() : ''}
                  </div>
                  {/* Grid Cells for the Hour */}
                   {days.map((_, dayIndex) => (
                     <div
                        key={`cell-${hourIndex}-${dayIndex}`}
                        className="row-start-${hourIndex + 1} border-t border-l border-border col-start-${dayIndex + 2}"
                        style={{ height: `${hourHeight}px` }}
                        aria-hidden="true"
                     ></div>
                   ))}
                </React.Fragment>
            ))}

            {/* Timed Events Layer - Overlay on the grid */}
             {days.map((day, dayIndex) => (
                 <div key={`events-${day.toISOString()}`} className={`col-start-${dayIndex + 2} row-start-1 row-end-[26] relative`} style={{ gridRowEnd: hours.length + 2 }}> {/* Ensure events can span the full grid height */}
                    {timedEventsByDay[dayIndex].map(event => {
                       const position = getEventPosition(event);
                       if (!position) return null;

                       return (
                          <div
                            key={event.id}
                            className="absolute left-0.5 right-0.5 sm:left-1 sm:right-1 p-1 rounded bg-primary text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90 overflow-hidden z-10 transition-colors"
                            style={{ top: `${position.top}px`, height: `${position.height}px` }}
                            onClick={() => onEventClick(event)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Event on ${format(day, "MMMM d")} from ${event.startTime}${event.endTime ? ` to ${event.endTime}`: ''}: ${event.title}`}
                            title={`${event.title} (${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''})`}
                          >
                            {/* Adjust text size and visibility based on height */}
                             {position.height > 18 && <p className="font-semibold text-[9px] sm:text-[10px] leading-tight truncate">{event.title}</p>}
                             {position.height > 28 && <p className="text-[8px] sm:text-[9px] leading-tight truncate">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</p>}
                             {position.height > 40 && event.description && <p className="text-[8px] sm:text-[9px] mt-0.5 opacity-80 truncate">{event.description}</p>}
                          </div>
                       );
                    })}
                 </div>
             ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CalendarWeekView;

    