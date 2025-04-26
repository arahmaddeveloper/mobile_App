
"use client";

import React, { type FC } from "react"; // Import React
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

import type { CalendarEvent, TodoItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";

interface CalendarMonthViewProps {
  date: Date;
  events: CalendarEvent[];
  todos: TodoItem[];
  onDateChange: (newDate: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onTodoClick: (todo: TodoItem) => void;
}

const CalendarMonthView: FC<CalendarMonthViewProps> = ({
  date,
  events,
  todos,
  onDateChange,
  onEventClick,
  onDateClick,
  onTodoClick,
}) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Filter events and todos only once per render cycle for the current month
  const monthEvents = React.useMemo(() => events.filter(event => isSameMonth(new Date(event.date + 'T00:00:00'), date)), [events, date]);
  const monthTodos = React.useMemo(() => todos.filter(todo => isSameMonth(new Date(todo.date + 'T00:00:00'), date)), [todos, date]);


  const getEventsForDay = (day: Date): CalendarEvent[] => {
    const dayFormatted = format(day, 'yyyy-MM-dd');
    return monthEvents // Use pre-filtered month events
      .filter((event) => event.date === dayFormatted)
      .sort((a, b) => {
         if (a.allDay && !b.allDay) return -1;
         if (!a.allDay && b.allDay) return 1;
         return (a.startTime || '').localeCompare(b.startTime || '');
      });
  };

  const getTodosForDay = (day: Date): TodoItem[] => {
    const dayFormatted = format(day, 'yyyy-MM-dd');
    return monthTodos.filter((todo) => todo.date === dayFormatted); // Use pre-filtered month todos
  };

  const handlePrevMonth = () => {
    onDateChange(subMonths(date, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(date, 1));
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <CardTitle className="text-base sm:text-xl font-semibold">{format(date, "MMMM yyyy")}</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        {/* Sticky Weekday Header */}
        <div className="grid grid-cols-7 border-b sticky top-0 bg-card z-10">
          {weekDays.map((day) => (
            <div key={day} className="text-center p-1 sm:p-2 text-[10px] sm:text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Grid - Allow scrolling within the content area */}
        <div className="grid grid-cols-7 h-[calc(100%-2rem)] sm:h-[calc(100%-2.5rem)] overflow-y-auto">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const dayTodos = getTodosForDay(day);
            const isCurrentMonth = isSameMonth(day, date);
            const isCurrentDay = isToday(day);
            const totalItems = dayEvents.length + dayTodos.length;
            // Determine max items to show based on screen size (example)
            const maxItemsToShow = 2; // Simple approach, could be more dynamic

            return (
              <div
                key={day.toString()}
                className={cn(
                  "border-b p-1 flex flex-col relative min-h-[4rem] sm:min-h-[6rem] cursor-pointer hover:bg-accent/5 transition-colors",
                   // Add right border to all but the last column in a row
                   (index + 1) % 7 !== 0 && "border-r",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground/50", // Dim non-month days
                  isCurrentMonth && "text-foreground",
                  "hover:z-10 hover:shadow-md" // Elevate on hover slightly
                )}
                 onClick={() => onDateClick(day)}
                 role="button"
                 tabIndex={0}
                 aria-label={`Date ${format(day, "MMMM d")}, ${dayEvents.length} events, ${dayTodos.length} todos`}
              >
                {/* Date Number */}
                <span
                  className={cn(
                    "self-start text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full",
                    isCurrentDay && "bg-primary text-primary-foreground",
                    !isCurrentMonth && "opacity-50" // Further dim non-month date numbers
                  )}
                >
                  {format(day, "d")}
                </span>
                {/* Events and Todos Area */}
                <div className="flex-grow overflow-y-auto space-y-0.5 text-[9px] sm:text-[10px] leading-tight">
                  {/* Display Events */}
                  {dayEvents.slice(0, maxItemsToShow).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-0.5 rounded truncate cursor-pointer",
                         event.allDay ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary-foreground",
                         "hover:opacity-80",
                         !isCurrentMonth && "opacity-60" // Dim items in non-month days
                      )}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      title={event.title}
                      role="button"
                      tabIndex={0}
                      aria-label={`Event: ${event.title}`}
                    >
                       {!event.allDay && event.startTime && <span className="font-semibold mr-0.5">{event.startTime}</span>}
                      {event.title}
                    </div>
                  ))}
                   {/* Display Todos - Show if space allows */}
                   {dayEvents.length < maxItemsToShow && dayTodos.slice(0, maxItemsToShow - dayEvents.length).map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          "p-0.5 rounded truncate cursor-pointer flex items-center",
                          "bg-secondary/50 text-secondary-foreground",
                          "hover:opacity-80",
                          !isCurrentMonth && "opacity-60" // Dim items in non-month days
                        )}
                        onClick={(e) => { e.stopPropagation(); onTodoClick(todo); }}
                        title={todo.title}
                        role="button"
                        tabIndex={0}
                        aria-label={`Todo: ${todo.title}`}
                      >
                         <CheckSquare className={cn("h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5 sm:mr-1 flex-shrink-0", todo.completed ? "text-green-600" : "text-muted-foreground")} />
                        <span className={cn(todo.completed && "line-through text-muted-foreground")}>
                          {todo.title}
                        </span>
                      </div>
                   ))}

                  {/* Show "+X more" indicator */}
                  {totalItems > maxItemsToShow && (
                     <div className={cn(
                         "text-[9px] sm:text-[10px] text-muted-foreground mt-0.5",
                          !isCurrentMonth && "opacity-60" // Dim indicator too
                         )}
                     >
                         +{totalItems - maxItemsToShow} more
                     </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarMonthView;

    