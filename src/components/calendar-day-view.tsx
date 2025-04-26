
"use client";

import React, { FC } from "react";
import { format, startOfDay, addHours } from "date-fns";
import { CheckSquare, Edit } from 'lucide-react'; // Removed unused icons

import type { CalendarEvent, TodoItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  todos: TodoItem[];
  onEventClick: (event: CalendarEvent) => void;
  onTodoClick: (todo: TodoItem) => void;
  onTodoToggle: (todoId: string) => void;
}

const CalendarDayView: FC<CalendarDayViewProps> = ({
  date,
  events,
  todos,
  onEventClick,
  onTodoClick,
  onTodoToggle,
}) => {
  const dayStart = startOfDay(date);
  const hours = Array.from({ length: 24 }, (_, i) => addHours(dayStart, i));
  const hourHeight = 50; // Consistent hour height with week view

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
      endTimeInMinutes = startTimeInMinutes + 60; // Default 1 hour
    }

    if (endTimeInMinutes <= startTimeInMinutes) {
        endTimeInMinutes = startTimeInMinutes + 60; // Ensure minimum 1 hour
    }

    const top = (startTimeInMinutes / 60) * hourHeight;
    const height = ((endTimeInMinutes - startTimeInMinutes) / 60) * hourHeight;

    return { top, height: Math.max(height, 15) }; // Minimum height
  };

  const timedEvents = events.filter(e => !e.allDay && e.startTime && e.date === format(date, 'yyyy-MM-dd'));
  const allDayEvents = events.filter(e => e.allDay && e.date === format(date, 'yyyy-MM-dd'));
  const dayTodos = todos.filter(t => t.date === format(date, 'yyyy-MM-dd')); // Todos are already filtered by parent

  return (
    <Card className="h-full flex flex-col">
      {/* Header: Date, All-day events, Todos */}
      <CardHeader className="pb-2 px-3 sm:px-6 flex-shrink-0">
        <CardTitle className="text-lg sm:text-xl">{format(date, "EEEE, MMMM d, yyyy")}</CardTitle>

        {/* All-day Events Section */}
        {allDayEvents.length > 0 && (
           <div className="pt-1.5 sm:pt-2 border-t mt-1.5 sm:mt-2">
             <CardDescription className="font-semibold mb-1 text-[10px] sm:text-xs uppercase tracking-wider">All-day Events</CardDescription>
             <div className="space-y-1">
               {allDayEvents.map((event) => (
                 <div
                   key={event.id}
                   className="p-1 px-1.5 sm:px-2 rounded bg-accent/20 text-accent-foreground text-[10px] sm:text-xs cursor-pointer hover:bg-accent/30 transition-colors truncate"
                   onClick={() => onEventClick(event)}
                   role="button"
                   tabIndex={0}
                   aria-label={`All-day event: ${event.title}`}
                   title={event.title}
                 >
                   {event.title}
                 </div>
               ))}
             </div>
           </div>
         )}

         {/* Todo List Section */}
         {dayTodos.length > 0 && (
            <div className="pt-1.5 sm:pt-2 border-t mt-1.5 sm:mt-2">
              <CardDescription className="font-semibold mb-1 sm:mb-2 text-[10px] sm:text-xs uppercase tracking-wider">Todo Items</CardDescription>
              {/* ScrollArea for Todos if they might overflow */}
              <ScrollArea className="max-h-32 sm:max-h-40 pr-2 sm:pr-4">
                <div className="space-y-1 sm:space-y-2">
                  {dayTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between group">
                       <div className="flex items-center flex-1 min-w-0 mr-1">
                           <Checkbox
                               id={`todo-${todo.id}`}
                               checked={todo.completed}
                               onCheckedChange={() => onTodoToggle(todo.id)}
                               className="mr-1.5 sm:mr-2 flex-shrink-0 h-3.5 w-3.5 sm:h-4 sm:w-4"
                               aria-labelledby={`todo-label-${todo.id}`}
                           />
                           <label
                               htmlFor={`todo-${todo.id}`}
                               id={`todo-label-${todo.id}`}
                               className={cn(
                                   "text-xs sm:text-sm cursor-pointer truncate flex-1",
                                   todo.completed && "line-through text-muted-foreground"
                               )}
                               onClick={(e) => { e.preventDefault(); onTodoClick(todo); }}
                               title={todo.description || todo.title}
                           >
                               {todo.title}
                           </label>
                       </div>
                       {/* Edit Button - shows on hover */}
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 sm:ml-2 flex-shrink-0"
                          onClick={() => onTodoClick(todo)}
                          aria-label={`Edit todo: ${todo.title}`}
                       >
                           <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                       </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
         )}
         {/* Separator only if there are header items */}
         {(allDayEvents.length > 0 || dayTodos.length > 0) && <Separator className="my-1.5 sm:my-2"/>}
      </CardHeader>

      {/* Main Content: Hourly Grid */}
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          {/* Relative container for positioning events */}
          <div className="relative grid grid-cols-[30px_1fr] sm:grid-cols-[48px_1fr] px-2 py-3 sm:p-4">
            {/* Time Grid & Time Labels */}
            {hours.map((hour, index) => (
              <React.Fragment key={format(hour, 'HH:mm')}>
                {/* Time Label */}
                <div
                  className="row-start-${index + 1} text-right pr-1 sm:pr-2 text-[9px] sm:text-xs text-muted-foreground pt-[-2px]" // Adjusted padding and font size
                  style={{ height: `${hourHeight}px` }}
                  aria-hidden="true"
                >
                   {index > 0 ? format(hour, 'ha').toLowerCase() : ''}
                </div>
                {/* Grid Line */}
                <div
                  className="row-start-${index + 1} border-t border-border col-start-2"
                   style={{ height: `${hourHeight}px` }}
                   aria-hidden="true"
                ></div>
              </React.Fragment>
            ))}

            {/* Timed Events Layer */}
            <div className="col-start-2 row-start-1 row-end-[26] relative" style={{ gridRowEnd: hours.length + 2 }}> {/* Events overlay */}
              {timedEvents.map((event) => {
                const position = getEventPosition(event);
                 if (!position) return null;

                return (
                  <div
                    key={event.id}
                    className="absolute left-0.5 right-0.5 sm:left-1 sm:right-1 p-1 sm:p-2 rounded bg-primary text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90 overflow-hidden z-10 transition-colors" // Adjusted padding
                    style={{ top: `${position.top}px`, height: `${position.height}px` }}
                    onClick={() => onEventClick(event)}
                    role="button"
                    tabIndex={0}
                     aria-label={`Event from ${event.startTime}${event.endTime ? ` to ${event.endTime}`: ''}: ${event.title}`}
                    title={`${event.title} (${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''})`}
                  >
                    {/* Adjust text sizes and visibility based on event block height */}
                    {position.height > 18 && <p className="font-semibold text-[10px] sm:text-sm leading-tight truncate">{event.title}</p>}
                    {position.height > 25 && <p className="text-[9px] sm:text-xs leading-tight truncate">{event.startTime} {event.endTime ? `- ${event.endTime}` : ''}</p>}
                    {position.height > 40 && event.description && <p className="text-[9px] sm:text-xs mt-0.5 sm:mt-1 opacity-80 truncate">{event.description}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CalendarDayView;

     