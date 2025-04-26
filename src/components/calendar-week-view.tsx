
 "use client";

import React, { FC } from "react"; // Ensured React is imported
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, isSameMonth, getDay, addHours, startOfDay } from "date-fns";
import { CheckSquare } from 'lucide-react'; // Added CheckSquare

import type { CalendarEvent, TodoItem } from "@/lib/types"; // Added TodoItem
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";


interface CalendarWeekViewProps {
  date: Date;
  events: CalendarEvent[];
  todos: TodoItem[]; // Added todos prop
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onTodoClick: (todo: TodoItem) => void; // Added handler
}

const CalendarWeekView: FC<CalendarWeekViewProps> = ({
    date,
    events,
    todos, // Destructure todos
    onEventClick,
    onDateClick,
    onTodoClick, // Destructure handler
}) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const currentMonth = date.getMonth();

  const dayStartHour = startOfDay(new Date());
  const hours = Array.from({ length: 24 }, (_, i) => addHours(dayStartHour, i));
  const hourHeight = 60;

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

     const top = (startTimeInMinutes / 60) * hourHeight;
     const height = ((endTimeInMinutes - startTimeInMinutes) / 60) * hourHeight;

     return { top, height: Math.max(height, 15) };
   };


  const eventsByDay = days.map(day =>
    events.filter(event => isSameDay(new Date(event.date + 'T00:00:00'), day))
  );
  const todosByDay = days.map(day => // Filter todos by day
     todos.filter(todo => isSameDay(new Date(todo.date + 'T00:00:00'), day))
   );

  const allDayEventsByDay = eventsByDay.map(dayEvents => dayEvents.filter(e => e.allDay));
  const timedEventsByDay = eventsByDay.map(dayEvents => dayEvents.filter(e => !e.allDay && e.startTime));


  return (
    <Card className="h-full flex flex-col">
       <CardHeader className="pb-2 flex-shrink-0"> {/* Prevent header shrinking */}
        <CardTitle>Week of {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}</CardTitle>
        {/* Header Row */}
        <div className="grid grid-cols-[auto_repeat(7,1fr)] border-b mt-2 sticky top-0 bg-card z-10">
          <div className="text-xs text-muted-foreground w-12 pr-2"></div>
           {days.map((day) => (
            <div
              key={day.toISOString()}
              className="text-center p-2 border-l cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => onDateClick(day)}
               role="button"
               tabIndex={0}
               aria-label={`Go to date ${format(day, "MMMM d")}`}
            >
              <div className="text-xs font-semibold">{format(day, "EEE")}</div>
              <div className={cn(
                  "text-lg font-bold",
                  !isSameMonth(day, date) && "text-muted-foreground",
                  isSameDay(day, new Date()) && "text-primary"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
         {/* All Day / Todo Row */}
         <div className="grid grid-cols-[auto_repeat(7,1fr)] border-b min-h-[5rem]"> {/* Increased min-height */}
            <div className="text-xs text-muted-foreground w-12 pr-2 flex items-center justify-end">All-day</div>
            {days.map((day, dayIndex) => (
              <div key={`allday-${day.toISOString()}`} className="border-l p-1 space-y-1 overflow-y-auto max-h-[7rem]"> {/* Added scroll and max-height */}
                  {/* All-Day Events */}
                  {allDayEventsByDay[dayIndex].map(event => (
                      <div
                          key={event.id}
                          className="p-1 px-2 rounded bg-accent/20 text-accent-foreground text-xs cursor-pointer hover:bg-accent/30 truncate transition-colors"
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
                             "p-1 px-2 rounded bg-secondary/50 text-secondary-foreground text-xs cursor-pointer hover:bg-secondary/70 truncate transition-colors flex items-center",
                             todo.completed && "line-through opacity-70"
                           )}
                          onClick={() => onTodoClick(todo)} // Use onTodoClick
                          role="button"
                          tabIndex={0}
                          aria-label={`Todo on ${format(day, "MMMM d")}: ${todo.title}${todo.completed ? ' (Completed)' : ''}`}
                          title={todo.title}
                        >
                           <CheckSquare className={cn("h-3 w-3 mr-1 flex-shrink-0", todo.completed ? "text-green-600" : "text-muted-foreground")} />
                           {todo.title}
                        </div>
                   ))}
                   {/* Show placeholder if no items */}
                    {allDayEventsByDay[dayIndex].length === 0 && todosByDay[dayIndex].length === 0 && (
                       <div className="text-xs text-muted-foreground italic p-1">No all-day items</div>
                   )}
              </div>
            ))}
          </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="relative grid grid-cols-[auto_repeat(7,1fr)]">
            {/* Time Grid Background */}
            <div className="col-start-1 col-end-[-1] row-start-1 row-end-[-1] grid grid-cols-[auto_repeat(7,1fr)]">
              {hours.map((hour, hourIndex) => (
                <React.Fragment key={`timegrid-${format(hour, 'HH:mm')}`}>
                  <div className="row-start-${hourIndex + 1} text-right pr-2 text-xs text-muted-foreground pt-[-2px] w-12" style={{ height: `${hourHeight}px` }}>
                    {hourIndex > 0 ? format(hour, 'ha').toLowerCase() : ''}
                  </div>
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
             </div>


             {/* Timed Events Layer */}
             {days.map((day, dayIndex) => (
                 <div key={`events-${day.toISOString()}`} className="col-start-${dayIndex + 2} row-start-1 row-span-[25] relative"> {/* Extend row-span */}
                    {timedEventsByDay[dayIndex].map(event => {
                       const position = getEventPosition(event); // Removed dayIndex as it's not used in getEventPosition
                       if (!position) return null;

                       return (
                          <div
                            key={event.id}
                            className="absolute left-1 right-1 p-1 rounded bg-primary text-primary-foreground shadow-md cursor-pointer hover:bg-primary/90 overflow-hidden z-10 transition-colors"
                            style={{ top: `${position.top}px`, height: `${position.height}px` }}
                            onClick={() => onEventClick(event)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Event on ${format(day, "MMMM d")} from ${event.startTime}${event.endTime ? ` to ${event.endTime}`: ''}: ${event.title}`}
                            title={`${event.title} (${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''})`}
                          >
                             {position.height > 18 && <p className="font-semibold text-[10px] leading-tight truncate">{event.title}</p>}
                             {position.height > 28 && <p className="text-[9px] leading-tight truncate">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</p>}
                              {position.height > 40 && event.description && <p className="text-[9px] mt-0.5 opacity-80 truncate">{event.description}</p>}
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
