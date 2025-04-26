
"use client";

import { useState, useEffect, useMemo, useCallback } from "react"; // Added useCallback
import { format, startOfDay, subMinutes, parse } from "date-fns"; // Added subMinutes, parse
import { Calendar as CalendarIcon, PlusCircle, ListTodo } from "lucide-react";

import type { CalendarEvent, TodoItem } from "@/lib/types";
import { getEvents, addEvent, updateEvent, deleteEvent, getEventsForDate, getEventsForWeek, getEventsForMonth } from "@/lib/events";
import { getTodos, addTodo, updateTodo, deleteTodo, getTodosForDate, toggleTodoCompletion } from "@/lib/todos";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { EventForm } from "@/components/event-form";
import CalendarMonthView from "@/components/calendar-month-view";
import CalendarWeekView from "@/components/calendar-week-view";
import CalendarDayView from "@/components/calendar-day-view";
import { TodoForm } from "@/components/todo-form";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";


type View = "month" | "week" | "day";

// Notification related state and functions
// Note: Actual notification scheduling requires a Service Worker for reliability,
// especially for notifications when the app/tab isn't active.
// This basic implementation uses the browser's Notification API directly.

let notificationPermission: NotificationPermission | null = null;
if (typeof window !== 'undefined' && 'Notification' in window) {
    notificationPermission = Notification.permission;
}

const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
        console.warn("Notifications not supported by this browser.");
        return false;
    }
    if (notificationPermission === 'granted') {
        return true;
    }
    if (notificationPermission !== 'denied') {
        try {
            const permission = await Notification.requestPermission();
            notificationPermission = permission; // Update state
            return permission === 'granted';
        } catch (error) {
            console.error("Error requesting notification permission:", error);
            return false;
        }
    }
    return false; // Permission was denied previously
};

// Basic scheduling (in-memory, will be lost on refresh/close without SW)
const scheduledNotifications = new Map<string, number>(); // eventId -> timeoutId

const scheduleNotification = (event: CalendarEvent) => {
    if (!event.reminderMinutes || !event.startTime || event.allDay) return;
    if (notificationPermission !== 'granted') {
        console.warn("Notification permission not granted. Cannot schedule.");
        return;
    }

    try {
         // Combine date and time, parse correctly
        const eventDateTime = parse(`${event.date} ${event.startTime}`, 'yyyy-MM-dd HH:mm', new Date());

        if (isNaN(eventDateTime.getTime())) {
           console.error("Invalid date/time for notification scheduling:", event.date, event.startTime);
           return;
        }

        const notificationTime = subMinutes(eventDateTime, event.reminderMinutes);
        const now = new Date();

        if (notificationTime <= now) {
            console.log("Notification time is in the past for event:", event.title);
            return; // Don't schedule past notifications
        }

        const delay = notificationTime.getTime() - now.getTime();

        // Clear any existing notification for this event
        cancelNotification(event.id);

        const timeoutId = window.setTimeout(() => {
            new Notification(`Upcoming: ${event.title}`, {
                body: `Starts at ${event.startTime}${event.description ? `\n${event.description}` : ''}`,
                tag: event.id, // Use event ID as tag to prevent duplicates if needed
            });
            scheduledNotifications.delete(event.id); // Clean up after showing
        }, delay);

        scheduledNotifications.set(event.id, timeoutId);
        console.log(`Notification scheduled for "${event.title}" at ${notificationTime.toISOString()}`);

    } catch (error) {
        console.error("Error scheduling notification:", error);
    }
};

const cancelNotification = (eventId: string) => {
    const timeoutId = scheduledNotifications.get(eventId);
    if (timeoutId) {
        clearTimeout(timeoutId);
        scheduledNotifications.delete(eventId);
        console.log(`Notification cancelled for event ID: ${eventId}`);
    }
};


export default function ChronoZenCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentView, setCurrentView] = useState<View>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isTodoFormOpen, setIsTodoFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // --- Load Data ---
  useEffect(() => {
    setIsLoading(true);
    try {
       if (typeof window !== 'undefined') {
           setEvents(getEvents());
           setTodos(getTodos());
           // Attempt to schedule notifications for existing events on load
           getEvents().forEach(event => scheduleNotification(event));
       }
    } catch (error) {
        console.error("Failed to load data:", error);
        toast({
            title: "Error Loading Data",
            description: "Could not load events or todos.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  // --- Event & Todo Handlers ---
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(startOfDay(date));
    }
  };

  const handleAddEventClick = () => {
    setSelectedEvent(null);
    setIsEventFormOpen(true);
  };

   const handleAddTodoClick = () => {
     setSelectedTodo(null);
     setIsTodoFormOpen(true);
   };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventFormOpen(true);
  };

   const handleTodoClick = (todo: TodoItem) => {
     setSelectedTodo(todo);
     setIsTodoFormOpen(true);
   };

   const handleTodoToggle = useCallback((todoId: string) => { // Wrap in useCallback
       try {
           const updatedTodo = toggleTodoCompletion(todoId);
            if (updatedTodo) {
               setTodos(prevTodos => prevTodos.map(t => t.id === updatedTodo.id ? updatedTodo : t));
               toast({ title: "Todo Updated", description: `"${updatedTodo.title}" marked as ${updatedTodo.completed ? 'complete' : 'incomplete'}.` });
           } else {
                throw new Error("Todo not found for toggling.")
           }
       } catch (error) {
           console.error("Failed to toggle todo:", error);
           toast({
               title: "Error Updating Todo",
               description: error instanceof Error ? error.message : "Could not update the todo status.",
               variant: "destructive",
           });
       }
   }, [toast]); // Add dependencies


   const handleDateClick = useCallback((date: Date) => { // Wrap in useCallback
     setSelectedDate(startOfDay(date)); // Ensure start of day
     setCurrentView("day");
   }, []); // Empty dependency array


   const handleSaveEvent = useCallback(async (eventData: CalendarEvent) => { // Make async
       try {
           let savedEvent: CalendarEvent | null = null;
           const isNewEvent = !events.some(e => e.id === eventData.id);

           if (isNewEvent) {
               const newEvent = addEvent({
                   ...eventData,
                   date: format(eventData.date ? new Date(eventData.date + 'T00:00:00') : selectedDate, "yyyy-MM-dd")
               });
               setEvents(prevEvents => [...prevEvents, newEvent]);
               toast({ title: "Event Created", description: `"${newEvent.title}" has been added.` });
               savedEvent = newEvent;
           } else {
               const updated = updateEvent(eventData);
               if (updated) {
                   setEvents(prevEvents => prevEvents.map(e => e.id === updated.id ? updated : e));
                   toast({ title: "Event Updated", description: `"${eventData.title}" has been updated.` });
                   savedEvent = updated;
               } else {
                   throw new Error("Failed to update event.");
               }
           }

           // Handle notification scheduling/cancelling
           if (savedEvent) {
               if (savedEvent.reminderMinutes && savedEvent.startTime && !savedEvent.allDay) {
                   const permissionGranted = await requestNotificationPermission();
                   if (permissionGranted) {
                       scheduleNotification(savedEvent);
                   } else if (notificationPermission !== 'denied') {
                       // Optionally inform user permission is needed
                       toast({ title: "Notification Permission", description: "Please allow notifications to get reminders.", variant: "default" });
                   } else {
                       toast({ title: "Notifications Blocked", description: "Please enable notifications in browser settings.", variant: "destructive" });
                   }
               } else {
                   // If reminder was removed or event became all-day, cancel existing notification
                   cancelNotification(savedEvent.id);
               }
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
   }, [events, selectedDate, toast]); // Add dependencies

    const handleSaveTodo = useCallback((todoData: TodoItem) => { // Wrap in useCallback
       try {
          if (todos.some(t => t.id === todoData.id)) {
             const updated = updateTodo(todoData);
             if (updated) {
                setTodos(prevTodos => prevTodos.map(t => t.id === updated.id ? updated : t));
                toast({ title: "Todo Updated", description: `"${todoData.title}" has been updated.` });
             } else {
                 throw new Error("Failed to update todo.");
             }
          } else {
            const newTodo = addTodo({
                title: todoData.title,
                date: format(todoData.date ? new Date(todoData.date + 'T00:00:00') : selectedDate, "yyyy-MM-dd"),
                description: todoData.description
            });
            setTodos(prevTodos => [...prevTodos, newTodo]);
            toast({ title: "Todo Created", description: `"${newTodo.title}" has been added.` });
          }
       } catch (error) {
          console.error("Failed to save todo:", error);
          toast({
              title: "Error Saving Todo",
              description: error instanceof Error ? error.message : "Could not save the todo.",
              variant: "destructive",
          });
       } finally {
         setIsTodoFormOpen(false);
         setSelectedTodo(null);
       }
     }, [todos, selectedDate, toast]); // Add dependencies

   const handleDeleteEvent = useCallback((eventId: string) => { // Wrap in useCallback
       try {
           const deletedEvent = events.find(e => e.id === eventId); // Find before deleting
           const success = deleteEvent(eventId);
            if (success && deletedEvent) {
               setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
               cancelNotification(eventId); // Cancel notification on delete
               toast({ title: "Event Deleted", description: `"${deletedEvent.title}" has been deleted.` });
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
   }, [events, toast]); // Add dependencies

    const handleDeleteTodo = useCallback((todoId: string) => { // Wrap in useCallback
       try {
            const deletedTodo = todos.find(t => t.id === todoId); // Find before deleting
            const success = deleteTodo(todoId);
            if (success && deletedTodo) {
               setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
               toast({ title: "Todo Deleted", description: `"${deletedTodo.title}" has been deleted.` });
           } else {
                throw new Error("Todo not found for deletion.")
           }
       } catch (error) {
           console.error("Failed to delete todo:", error);
           toast({
               title: "Error Deleting Todo",
               description: error instanceof Error ? error.message : "Could not delete the todo.",
               variant: "destructive",
           });
       } finally {
         setIsTodoFormOpen(false);
         setSelectedTodo(null);
       }
   }, [todos, toast]); // Add dependencies


  // --- Memoized Data for Views ---
  const filteredEvents = useMemo(() => {
    if (isLoading || typeof window === 'undefined') return [];
    const currentEvents = getEvents(); // Get fresh data for filtering
    switch (currentView) {
      case "day":
        return getEventsForDate(format(selectedDate, "yyyy-MM-dd"));
      case "week":
        return getEventsForWeek(selectedDate);
      case "month":
        return getEventsForMonth(selectedDate.getFullYear(), selectedDate.getMonth());
      default:
        return currentEvents;
    }
  }, [currentView, selectedDate, events, isLoading]); // Include events in dependency

  const filteredTodos = useMemo(() => {
      if (isLoading || typeof window === 'undefined') return [];
       const currentTodos = getTodos(); // Get fresh data
      if (currentView === "day") {
          return getTodosForDate(format(selectedDate, "yyyy-MM-dd"));
      }
      return currentTodos;
  }, [currentView, selectedDate, todos, isLoading]); // Include todos in dependency


  // --- Render ---
  return (
    <div className="flex h-screen flex-col p-2 sm:p-4 md:p-6 bg-secondary/30">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b gap-2 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">AR Calendar</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {/* Date Picker Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3">
                <CalendarIcon className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
          {/* Action Buttons */}
           <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={handleAddEventClick} aria-label="Add new event" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <PlusCircle className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Event
              </Button>
               <Button onClick={handleAddTodoClick} variant="secondary" size="sm" aria-label="Add new todo item" className="flex-1 sm:flex-none text-xs sm:text-sm">
                 <ListTodo className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Todo
               </Button>
           </div>
        </div>
      </header>

      {/* Main Content Area with Tabs */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as View)} className="flex flex-col flex-grow min-h-0"> {/* Added min-h-0 */}
        {/* Tab Triggers */}
        <TabsList className="mb-2 sm:mb-4 grid w-full grid-cols-3 h-9 sm:h-10 text-xs sm:text-sm">
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>

         {/* Tab Content Area - Takes remaining space and allows internal scrolling */}
         <div className="flex-grow overflow-hidden relative"> {/* Ensure parent takes space and hides overflow */}
             <TabsContent value="month" className="h-full m-0 absolute inset-0 overflow-auto"> {/* Use absolute positioning and overflow-auto */}
               {isLoading ? (
                   <div className="flex items-center justify-center h-full text-muted-foreground">Loading Month...</div>
               ) : (
                 <CalendarMonthView
                     date={selectedDate}
                     events={filteredEvents}
                     todos={filteredTodos}
                     onDateChange={setSelectedDate}
                     onEventClick={handleEventClick}
                     onDateClick={handleDateClick}
                     onTodoClick={handleTodoClick}
                 />
               )}
             </TabsContent>
              <TabsContent value="week" className="h-full m-0 absolute inset-0 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">Loading Week...</div>
                ) : (
                  <CalendarWeekView
                    date={selectedDate}
                    events={filteredEvents}
                    todos={filteredTodos}
                    onEventClick={handleEventClick}
                    onDateClick={handleDateClick}
                    onTodoClick={handleTodoClick}
                  />
                )}
              </TabsContent>
              <TabsContent value="day" className="h-full m-0 absolute inset-0 overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">Loading Day...</div>
                ) : (
                  <CalendarDayView
                    date={selectedDate}
                    events={filteredEvents}
                    todos={filteredTodos}
                    onEventClick={handleEventClick}
                    onTodoClick={handleTodoClick}
                    onTodoToggle={handleTodoToggle}
                  />
                )}
              </TabsContent>
         </div>

      </Tabs>

      {/* Dialogs */}
      <EventForm
        isOpen={isEventFormOpen}
        onOpenChange={setIsEventFormOpen}
        event={selectedEvent}
        selectedDate={selectedDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
       <TodoForm
         isOpen={isTodoFormOpen}
         onOpenChange={setIsTodoFormOpen}
         todo={selectedTodo}
         selectedDate={selectedDate}
         onSave={handleSaveTodo}
         onDelete={handleDeleteTodo}
       />
       <Toaster />
    </div>
  );
}
