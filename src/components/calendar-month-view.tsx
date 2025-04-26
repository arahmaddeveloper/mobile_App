
"use client";

import type { FC } from "react";
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

import type { CalendarEvent, TodoItem } from "@/lib/types"; // Added TodoItem
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckSquare } from "lucide-react"; // Added CheckSquare

interface CalendarMonthViewProps {
  date: Date;
  events: CalendarEvent[];
  todos: TodoItem[]; // Added todos prop
  onDateChange: (newDate: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onTodoClick: (todo: TodoItem) => void; // Added handler
}

const CalendarMonthView: FC<CalendarMonthViewProps> = ({
  date,
  events,
  todos, // Destructure todos
  onDateChange,
  onEventClick,
  onDateClick,
  onTodoClick, // Destructure handler
}) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date): CalendarEvent[] => {
    const dayFormatted = format(day, 'yyyy-MM-dd');
    return events
      .filter((event) => event.date === dayFormatted)
      .sort((a, b) => {
         if (a.allDay && !b.allDay) return -1;
         if (!a.allDay && b.allDay) return 1;
         return (a.startTime || '').localeCompare(b.startTime || '');
      });
  };

  const getTodosForDay = (day: Date): TodoItem[] => {
    const dayFormatted = format(day, 'yyyy-MM-dd');
    return todos.filter((todo) => todo.date === dayFormatted);
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
        <CardTitle className="text-xl font-semibold">{format(date, "MMMM yyyy")}</CardTitle>
        <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b sticky top-0 bg-card z-10">
          {weekDays.map((day) => (
            <div key={day} className="text-center p-2 text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-rows-auto grid-cols-7 h-[calc(100%-2.5rem)]">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const dayTodos = getTodosForDay(day); // Get todos for the day
            const isCurrentMonth = isSameMonth(day, date);
            const isCurrentDay = isToday(day);
            const totalItems = dayEvents.length + dayTodos.length; // Combined count

            return (
              <div
                key={day.toString()}
                className={cn(
                  "border-r border-b p-1.5 flex flex-col relative min-h-[6rem] cursor-pointer hover:bg-accent/5 transition-colors",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  "last:border-r-0"
                )}
                 onClick={() => onDateClick(day)}
                 role="button"
                 tabIndex={0}
                 aria-label={`Date ${format(day, "MMMM d")}, ${dayEvents.length} events, ${dayTodos.length} todos`}
              >
                <span
                  className={cn(
                    "self-start text-xs font-medium mb-1",
                    isCurrentDay && "bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center"
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="flex-grow overflow-y-auto space-y-0.5 max-h-[calc(100%-1.25rem)]">
                  {/* Display Events */}
                  {dayEvents.slice(0, 2).map((event) => ( // Show max 2 events initially
                    <div
                      key={event.id}
                      className={cn(
                        "text-[10px] leading-tight p-0.5 rounded truncate cursor-pointer",
                         event.allDay ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary-foreground",
                         "hover:opacity-80"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      title={event.title}
                      role="button"
                      tabIndex={0}
                      aria-label={`Event: ${event.title}`}
                    >
                       {!event.allDay && event.startTime && <span className="font-semibold mr-1">{event.startTime}</span>}
                      {event.title}
                    </div>
                  ))}
                   {/* Display Todos - Show max 1 todo initially if space allows */}
                   {dayEvents.length < 2 && dayTodos.slice(0, 1).map((todo) => (
                      <div
                        key={todo.id}
                        className={cn(
                          "text-[10px] leading-tight p-0.5 rounded truncate cursor-pointer flex items-center",
                          "bg-secondary/50 text-secondary-foreground", // Different style for todos
                          "hover:opacity-80"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTodoClick(todo); // Use onTodoClick
                        }}
                        title={todo.title}
                        role="button"
                        tabIndex={0}
                        aria-label={`Todo: ${todo.title}`}
                      >
                         <CheckSquare className={cn("h-2.5 w-2.5 mr-1 flex-shrink-0", todo.completed ? "text-green-600" : "text-muted-foreground")} />
                        <span className={cn(todo.completed && "line-through text-muted-foreground")}>
                          {todo.title}
                        </span>
                      </div>
                   ))}

                  {/* Show "+X more" indicator */}
                  {totalItems > (dayEvents.length < 2 ? 3 : 2) && ( // Adjust limit based on displayed items
                     <div className="text-[10px] text-muted-foreground mt-0.5">
                         +{totalItems - (dayEvents.length < 2 ? (dayEvents.length + dayTodos.slice(0,1).length) : dayEvents.length) } more
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
