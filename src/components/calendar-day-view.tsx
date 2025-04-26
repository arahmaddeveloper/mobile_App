"use client";

import type { FC } from "react";
import { format, startOfDay, addHours } from "date-fns";

import type { CalendarEvent } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

const CalendarDayView: FC<CalendarDayViewProps> = ({ date, events, onEventClick }) => {
  const dayStart = startOfDay(date);
  const hours = Array.from({ length: 24 }, (_, i) => addHours(dayStart, i));

  const getEventPosition = (event: CalendarEvent): { top: number; height: number } | null => {
    if (event.allDay || !event.startTime) {
      return null; // All-day events are handled separately or not positioned by time
    }

    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;

    let endTimeInMinutes: number;
    if (event.endTime) {
      const [endHour, endMinute] = event.endTime.split(':').map(Number);
      endTimeInMinutes = endHour * 60 + endMinute;
    } else {
      // Default to 1 hour duration if no end time
      endTimeInMinutes = startTimeInMinutes + 60;
    }

    // Ensure end time is after start time
    if (endTimeInMinutes <= startTimeInMinutes) {
        endTimeInMinutes = startTimeInMinutes + 60; // Default to 1 hour if invalid
    }


    const totalMinutesInDay = 24 * 60;
    const hourHeight = 60; // pixels per hour

    const top = (startTimeInMinutes / 60) * hourHeight;
    const height = ((endTimeInMinutes - startTimeInMinutes) / 60) * hourHeight;

    return { top, height: Math.max(height, 15) }; // Minimum height for visibility
  };


  const timedEvents = events.filter(e => !e.allDay && e.startTime && e.date === format(date, 'yyyy-MM-dd'));
  const allDayEvents = events.filter(e => e.allDay && e.date === format(date, 'yyyy-MM-dd'));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>{format(date, "EEEE, MMMM d, yyyy")}</CardTitle>
        {allDayEvents.length > 0 && (
           <div className="pt-2 border-t mt-2">
             <CardDescription className="font-semibold mb-1">All-day Events:</CardDescription>
             <div className="space-y-1">
               {allDayEvents.map((event) => (
                 <div
                   key={event.id}
                   className="p-1 px-2 rounded bg-accent/20 text-accent-foreground text-xs cursor-pointer hover:bg-accent/30"
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
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="relative grid grid-cols-[auto_1fr] p-4">
            {/* Time Grid */}
            {hours.map((hour, index) => (
              <React.Fragment key={format(hour, 'HH:mm')}>
                <div className="row-start-${index + 1} text-right pr-2 text-xs text-muted-foreground pt-[-2px]" style={{ height: '60px' }}>
                   {index > 0 ? format(hour, 'ha') : ''}
                </div>
                <div
                  className="row-start-${index + 1} border-t border-border col-start-2"
                   style={{ height: '60px' }}
                   aria-hidden="true"
                ></div>
              </React.Fragment>
            ))}

            {/* Timed Events */}
            <div className="col-start-2 row-start-1 row-end-[26] relative">
              {timedEvents.map((event) => {
                const position = getEventPosition(event);
                 if (!position) return null;

                return (
                  <div
                    key={event.id}
                    className="absolute left-1 right-1 p-2 rounded bg-primary text-primary-foreground shadow-md cursor-pointer hover:bg-primary/90 overflow-hidden z-10"
                    style={{ top: `${position.top}px`, height: `${position.height}px` }}
                    onClick={() => onEventClick(event)}
                    role="button"
                    tabIndex={0}
                     aria-label={`Event from ${event.startTime}${event.endTime ? ` to ${event.endTime}`: ''}: ${event.title}`}
                  >
                    <p className="font-semibold text-sm truncate">{event.title}</p>
                    <p className="text-xs truncate">{event.startTime} {event.endTime ? `- ${event.endTime}` : ''}</p>
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
