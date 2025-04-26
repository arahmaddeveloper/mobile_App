 "use client";

import * as React from "react"; // Added missing React import
import type { FC } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameDay, isSameMonth, getDay, addHours, startOfDay } from "date-fns";

import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";


interface CalendarWeekViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void; // For navigating to day view
}

const CalendarWeekView: FC<CalendarWeekViewProps> = ({ date, events, onEventClick, onDateClick }) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday start
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const currentMonth = date.getMonth();

  const dayStartHour = startOfDay(new Date()); // Reference for hours
  const hours = Array.from({ length: 24 }, (_, i) => addHours(dayStartHour, i));
  const hourHeight = 60; // pixels per hour

  const getEventPosition = (event: CalendarEvent, dayIndex: number): { top: number; height: number } | null => {
     if (event.allDay || !event.startTime) {
       return null; // All-day events handled separately
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
        endTimeInMinutes = startTimeInMinutes + 60;
     }

     const top = (startTimeInMinutes / 60) * hourHeight;
     const height = ((endTimeInMinutes - startTimeInMinutes) / 60) * hourHeight;

     return { top, height: Math.max(height, 15) }; // Min height
   };


  const eventsByDay = days.map(day =>
    events.filter(event => isSameDay(new Date(event.date + 'T00:00:00'), day))
  );

  const allDayEventsByDay = eventsByDay.map(dayEvents => dayEvents.filter(e => e.allDay));
  const timedEventsByDay = eventsByDay.map(dayEvents => dayEvents.filter(e => !e.allDay && e.startTime));


  return (
    <Card className="h-full flex flex-col">
       <CardHeader className="pb-2">
        <CardTitle>Week of {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}</CardTitle>
        {/* Header Row */}
        <div className="grid grid-cols-[auto_repeat(7,1fr)] border-b mt-2 sticky top-0 bg-card z-10">
          <div className="text-xs text-muted-foreground w-12 pr-2"></div> {/* Time column spacer */}
           {days.map((day) => (
            <div
              key={day.toISOString()}
              className="text-center p-2 border-l cursor-pointer hover:bg-accent/10"
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
         {/* All Day Events Row */}
         <div className="grid grid-cols-[auto_repeat(7,1fr)] border-b min-h-[4rem]">
            <div className="text-xs text-muted-foreground w-12 pr-2 flex items-center justify-end">All-day</div>
            {days.map((day, dayIndex) => (
              <div key={`allday-${day.toISOString()}`} className="border-l p-1 space-y-1 overflow-hidden">
                  {allDayEventsByDay[dayIndex].map(event => (
                      <div
                          key={event.id}
                          className="p-1 px-2 rounded bg-accent/20 text-accent-foreground text-xs cursor-pointer hover:bg-accent/30 truncate"
                          onClick={() => onEventClick(event)}
                          role="button"
                          tabIndex={0}
                          aria-label={`All-day event on ${format(day, "MMMM d")}: ${event.title}`}
                          title={event.title}
                      >
                          {event.title}
                      </div>
                  ))}
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
                    {hourIndex > 0 ? format(hour, 'ha') : ''}
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
                 <div key={`events-${day.toISOString()}`} className="col-start-${dayIndex + 2} row-start-1 row-span-[24] relative">
                    {timedEventsByDay[dayIndex].map(event => {
                       const position = getEventPosition(event, dayIndex);
                       if (!position) return null;

                       return (
                          <div
                            key={event.id}
                            className="absolute left-1 right-1 p-1 rounded bg-primary text-primary-foreground shadow-md cursor-pointer hover:bg-primary/90 overflow-hidden z-10"
                            style={{ top: `${position.top}px`, height: `${position.height}px` }}
                            onClick={() => onEventClick(event)}
                            role="button"
                            tabIndex={0}
                            aria-label={`Event on ${format(day, "MMMM d")} from ${event.startTime}${event.endTime ? ` to ${event.endTime}`: ''}: ${event.title}`}
                            title={`${event.title} (${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''})`}
                          >
                             <p className="font-semibold text-[10px] leading-tight truncate">{event.title}</p>
                             <p className="text-[9px] leading-tight truncate">{event.startTime}{event.endTime ? ` - ${event.endTime}` : ''}</p>
                              {position.height > 30 && event.description && <p className="text-[9px] mt-0.5 opacity-80 truncate">{event.description}</p>}
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
