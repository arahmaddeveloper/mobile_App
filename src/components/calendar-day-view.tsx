
"use client";

import React, { FC } from "react";
import { format, startOfDay, addHours } from "date-fns";
import { CheckSquare, Square, Edit, Trash2 } from 'lucide-react'; // Added icons

import type { CalendarEvent, TodoItem } from "@/lib/types"; // Added TodoItem
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { cn } from "@/lib/utils";

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  todos: TodoItem[]; // Added todos prop
  onEventClick: (event: CalendarEvent) => void;
  onTodoClick: (todo: TodoItem) => void; // Added handler for clicking todo text/edit
  onTodoToggle: (todoId: string) => void; // Added handler for toggling todo completion
}

const CalendarDayView: FC<CalendarDayViewProps> = ({
  date,
  events,
  todos, // Destructure todos
  onEventClick,
  onTodoClick, // Destructure todo handlers
  onTodoToggle,
}) => {
  const dayStart = startOfDay(date);
  const hours = Array.from({ length: 24 }, (_, i) => addHours(dayStart, i));

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
      endTimeInMinutes = startTimeInMinutes + 60;
    }

    if (endTimeInMinutes <= startTimeInMinutes) {
        endTimeInMinutes = startTimeInMinutes + 60;
    }

    const hourHeight = 60;
    const top = (startTimeInMinutes / 60) * hourHeight;
    const height = ((endTimeInMinutes - startTimeInMinutes) / 60) * hourHeight;

    return { top, height: Math.max(height, 15) };
  };

  const timedEvents = events.filter(e => !e.allDay && e.startTime && e.date === format(date, 'yyyy-MM-dd'));
  const allDayEvents = events.filter(e => e.allDay && e.date === format(date, 'yyyy-MM-dd'));

  // Filter todos for the current date (already done in parent, but good practice)
  const dayTodos = todos.filter(t => t.date === format(date, 'yyyy-MM-dd'));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>{format(date, "EEEE, MMMM d, yyyy")}</CardTitle>
        {/* All-day Events Section */}
        {allDayEvents.length > 0 && (
           <div className="pt-2 border-t mt-2">
             <CardDescription className="font-semibold mb-1 text-xs uppercase tracking-wider">All-day Events</CardDescription>
             <div className="space-y-1">
               {allDayEvents.map((event) => (
                 <div
                   key={event.id}
                   className="p-1 px-2 rounded bg-accent/20 text-accent-foreground text-xs cursor-pointer hover:bg-accent/30 transition-colors"
                   onClick={() => onEventClick(event)}
                   role="button"
                   tabIndex={0}
                   aria-label={`All-day event: ${event.title}`}
                 >
                   {event.title}
                 </div>
               ))}
             </div>
           </div>
         )}
         {/* Todo List Section */}
         {dayTodos.length > 0 && (
            <div className="pt-2 border-t mt-2">
              <CardDescription className="font-semibold mb-2 text-xs uppercase tracking-wider">Todo Items</CardDescription>
              <ScrollArea className="max-h-40 pr-4"> {/* Limit height and add scroll */}
                <div className="space-y-2">
                  {dayTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between group">
                       <div className="flex items-center flex-1 min-w-0">
                           <Checkbox
                               id={`todo-${todo.id}`}
                               checked={todo.completed}
                               onCheckedChange={() => onTodoToggle(todo.id)}
                               className="mr-2 flex-shrink-0"
                               aria-labelledby={`todo-label-${todo.id}`}
                           />
                           <label
                               htmlFor={`todo-${todo.id}`}
                               id={`todo-label-${todo.id}`}
                               className={cn(
                                   "text-sm cursor-pointer truncate flex-1",
                                   todo.completed && "line-through text-muted-foreground"
                               )}
                               onClick={(e) => { e.preventDefault(); onTodoClick(todo); }} // Allow clicking label to edit
                               title={todo.description || todo.title} // Show description on hover
                           >
                               {todo.title}
                           </label>
                       </div>
                       {/* Edit Button - shows on hover */}
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                          onClick={() => onTodoClick(todo)}
                          aria-label={`Edit todo: ${todo.title}`}
                       >
                           <Edit className="h-4 w-4" />
                       </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
         )}
         {(allDayEvents.length > 0 || dayTodos.length > 0) && <Separator className="my-2"/>} {/* Separator if header items exist */}
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="relative grid grid-cols-[auto_1fr] p-4">
            {/* Time Grid */}
            {hours.map((hour, index) => (
              <React.Fragment key={format(hour, 'HH:mm')}>
                <div className="row-start-${index + 1} text-right pr-2 text-xs text-muted-foreground pt-[-2px]" style={{ height: '60px' }}>
                   {/* Display time label every hour, starting from 1 AM */}
                   {index > 0 ? format(hour, 'ha').toLowerCase() : ''}
                </div>
                <div
                  className="row-start-${index + 1} border-t border-border col-start-2"
                   style={{ height: '60px' }}
                   aria-hidden="true"
                ></div>
              </React.Fragment>
            ))}

            {/* Timed Events */}
            <div className="col-start-2 row-start-1 row-span-[25] relative"> {/* Extend row-span slightly */}
              {timedEvents.map((event) => {
                const position = getEventPosition(event);
                 if (!position) return null;

                return (
                  <div
                    key={event.id}
                    className="absolute left-1 right-1 p-2 rounded bg-primary text-primary-foreground shadow-md cursor-pointer hover:bg-primary/90 overflow-hidden z-10 transition-colors"
                    style={{ top: `${position.top}px`, height: `${position.height}px` }}
                    onClick={() => onEventClick(event)}
                    role="button"
                    tabIndex={0}
                     aria-label={`Event from ${event.startTime}${event.endTime ? ` to ${event.endTime}`: ''}: ${event.title}`}
                  >
                    <p className="font-semibold text-sm truncate">{event.title}</p>
                    {position.height > 25 && <p className="text-xs truncate">{event.startTime} {event.endTime ? `- ${event.endTime}` : ''}</p>}
                    {position.height > 40 && event.description && <p className="text-xs mt-1 opacity-80 truncate">{event.description}</p>}
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

