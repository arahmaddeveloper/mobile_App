"use client";

import { useState, useEffect, useMemo } from "react";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, Settings } from "lucide-react";

import type { CalendarEvent } from "@/lib/types";
import { getEvents, addEvent, updateEvent, deleteEvent, getEventsForDate, getEventsForWeek, getEventsForMonth } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { EventForm } from "@/components/event-form";
import CalendarMonthView from "@/components/calendar-month-view";
import CalendarWeekView from "@/components/calendar-week-view";
import CalendarDayView from "@/components/calendar-day-view";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";


type View = "month" | "week" | "day";

export default function ARCalendar() { // Changed component name
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentView, setCurrentView] = useState<View>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load events from local storage on mount
  useEffect(() => {
    try {
       setEvents(getEvents());
    } catch (error) {
        console.error("Failed to load events:", error);
        toast({
            title: "Error Loading Events",
            description: "Could not load events from local storage.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]); // Add toast dependency

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(startOfDay(date)); // Ensure we always use the start of the day
    }
  };

  const handleAddEventClick = () => {
    setSelectedEvent(null); // Ensure we are creating a new event
    setIsEventFormOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventFormOpen(true);
  };

   const handleDateClick = (date: Date) => {
     setSelectedDate(date);
     setCurrentView("day"); // Switch to day view when a date is clicked in month/week view
   };


  const handleSaveEvent = (eventData: CalendarEvent) => {
     try {
        if (events.some(e => e.id === eventData.id)) {
           // Update existing event
           const updated = updateEvent(eventData);
           if (updated) {
              setEvents(prevEvents => prevEvents.map(e => e.id === updated.id ? updated : e));
              toast({ title: "Event Updated", description: `"${eventData.title}" has been updated.` });
           } else {
               throw new Error("Failed to update event.");
           }
        } else {
          // Add new event
          const newEvent = addEvent(eventData);
          setEvents(prevEvents => [...prevEvents, newEvent]);
          toast({ title: "Event Created", description: `"${newEvent.title}" has been added.` });
        }
     } catch (error) {
        console.error("Failed to save event:", error);
        toast({
            title: "Error Saving Event",
            description: error instanceof Error ? error.message : "Could not save the event.",
            variant: "destructive",
        });
     } finally {
       setIsEventFormOpen(false);
       setSelectedEvent(null);
     }
   };

   const handleDeleteEvent = (eventId: string) => {
       try {
           const success = deleteEvent(eventId);
            if (success) {
               const deletedEvent = events.find(e => e.id === eventId);
               setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
               toast({ title: "Event Deleted", description: `"${deletedEvent?.title}" has been deleted.` });
           } else {
                throw new Error("Event not found for deletion.")
           }
       } catch (error) {
           console.error("Failed to delete event:", error);
           toast({
               title: "Error Deleting Event",
               description: error instanceof Error ? error.message : "Could not delete the event.",
               variant: "destructive",
           });
       } finally {
         setIsEventFormOpen(false);
         setSelectedEvent(null);
       }
   };


  // Memoize filtered events for performance
  const filteredEvents = useMemo(() => {
    if (isLoading) return [];
    switch (currentView) {
      case "day":
        return getEventsForDate(format(selectedDate, "yyyy-MM-dd"));
      case "week":
         // Pass the selectedDate which falls within the target week
        return getEventsForWeek(selectedDate);
      case "month":
        return getEventsForMonth(selectedDate.getFullYear(), selectedDate.getMonth());
      default:
        return events;
    }
  }, [currentView, selectedDate, events, isLoading]);


  return (
    <div className="flex h-screen flex-col p-4 md:p-6 bg-secondary/30">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-bold text-primary">AR Calendar</h1> {/* Changed header title */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleAddEventClick} aria-label="Add new event">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Event
          </Button>
          {/* Placeholder for Settings */}
          {/* <Button variant="ghost" size="icon" aria-label="Settings">
             <Settings className="h-5 w-5" />
          </Button> */}
        </div>
      </header>

      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as View)} className="flex flex-col flex-grow">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>

        {/* Ensure TabsContent fills remaining space */}
         <div className="flex-grow overflow-hidden">
            <TabsContent value="month" className="h-full m-0">
              {isLoading ? (
                  <div className="flex items-center justify-center h-full">Loading Month...</div>
              ) : (
                <CalendarMonthView
                    date={selectedDate}
                    events={filteredEvents}
                    onDateChange={setSelectedDate}
                    onEventClick={handleEventClick}
                    onDateClick={handleDateClick}
                />
              )}
            </TabsContent>
             <TabsContent value="week" className="h-full m-0">
               {isLoading ? (
                 <div className="flex items-center justify-center h-full">Loading Week...</div>
               ) : (
                 <CalendarWeekView
                   date={selectedDate}
                   events={filteredEvents}
                   onEventClick={handleEventClick}
                    onDateClick={handleDateClick} // Pass handler
                 />
               )}
             </TabsContent>
             <TabsContent value="day" className="h-full m-0">
               {isLoading ? (
                 <div className="flex items-center justify-center h-full">Loading Day...</div>
               ) : (
                 <CalendarDayView
                   date={selectedDate}
                   events={filteredEvents}
                   onEventClick={handleEventClick}
                 />
               )}
             </TabsContent>
         </div>

      </Tabs>

      <EventForm
        isOpen={isEventFormOpen}
        onOpenChange={setIsEventFormOpen}
        event={selectedEvent}
        selectedDate={selectedDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
       <Toaster />
    </div>
  );
}
