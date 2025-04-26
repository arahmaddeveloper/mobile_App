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

import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarMonthViewProps {
  date: Date;
  events: CalendarEvent[];
  onDateChange: (newDate: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void; // For navigating to day/week view
}

const CalendarMonthView: FC<CalendarMonthViewProps> = ({
  date,
  events,
  onDateChange,
  onEventClick,
  onDateClick,
}) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start week on Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day, index) => {
    currentWeek.push(day);
    if ((index + 1) % 7 === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events
      .filter((event) => isSameDay(new Date(event.date + 'T00:00:00'), day))
      .sort((a, b) => {
         // Sort all-day events first, then by start time
         if (a.allDay && !b.allDay) return -1;
         if (!a.allDay && b.allDay) return 1;
         return (a.startTime || '').localeCompare(b.startTime || '');
      });
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
        <div className="grid grid-rows-auto grid-cols-7 h-[calc(100%-2.5rem)]"> {/* Adjust height calculation */}
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, date);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={cn(
                  "border-r border-b p-1.5 flex flex-col relative min-h-[6rem] cursor-pointer hover:bg-accent/5", // Ensure min height
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  "last:border-r-0" // Remove right border for last cell in row
                )}
                 onClick={() => onDateClick(day)}
                 role="button"
                 tabIndex={0}
                 aria-label={`Date ${format(day, "MMMM d")}, ${dayEvents.length} events`}
              >
                <span
                  className={cn(
                    "self-start text-xs font-medium mb-1",
                    isCurrentDay && "bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center"
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="flex-grow overflow-y-auto space-y-0.5 max-h-[calc(100%-1.25rem)]"> {/* Limit event height */}
                  {dayEvents.slice(0, 3).map((event) => ( // Limit visible events
                    <div
                      key={event.id}
                      className={cn(
                        "text-[10px] leading-tight p-0.5 rounded truncate cursor-pointer",
                         event.allDay ? "bg-accent/20 text-accent-foreground" : "bg-primary/20 text-primary-foreground",
                         "hover:opacity-80"
                      )}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering date click
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
                  {dayEvents.length > 3 && (
                     <div className="text-[10px] text-muted-foreground mt-0.5">
                         +{dayEvents.length - 3} more
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
