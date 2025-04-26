"use client";

import { useState, useEffect, useMemo } from "react";
import { format, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, PlusCircle, ListTodo } from "lucide-react"; // Added ListTodo

import type { CalendarEvent, TodoItem } from "@/lib/types"; // Added TodoItem
import { getEvents, addEvent, updateEvent, deleteEvent, getEventsForDate, getEventsForWeek, getEventsForMonth } from "@/lib/events";
import { getTodos, addTodo, updateTodo, deleteTodo, getTodosForDate, toggleTodoCompletion } from "@/lib/todos"; // Added todo imports
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { EventForm } from "@/components/event-form";
import CalendarMonthView from "@/components/calendar-month-view";
import CalendarWeekView from "@/components/calendar-week-view";
import CalendarDayView from "@/components/calendar-day-view";
import { TodoForm } from "@/components/todo-form"; // Added TodoForm import
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";


type View = "month" | "week" | "day";

export default function ARCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [currentView, setCurrentView] = useState<View>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]); // Added state for todos
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isTodoFormOpen, setIsTodoFormOpen] = useState(false); // Added state for todo form
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null); // Added state for selected todo
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load events and todos from local storage on mount
  useEffect(() => {
    setIsLoading(true);
    try {
       setEvents(getEvents());
       setTodos(getTodos()); // Load todos
    } catch (error) {
        console.error("Failed to load data:", error);
        toast({
            title: "Error Loading Data",
            description: "Could not load events or todos from local storage.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(startOfDay(date)); // Ensure we always use the start of the day
    }
  };

  const handleAddEventClick = () => {
    setSelectedEvent(null); // Ensure we are creating a new event
    setIsEventFormOpen(true);
  };

   const handleAddTodoClick = () => {
     setSelectedTodo(null); // Ensure creating a new todo
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

   const handleTodoToggle = (todoId: string) => {
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
   };


   const handleDateClick = (date: Date) => {
     setSelectedDate(date);
     setCurrentView("day"); // Switch to day view when a date is clicked in month/week view
   };


  const handleSaveEvent = (eventData: CalendarEvent) => {
     try {
        if (events.some(e => e.id === eventData.id)) {
           const updated = updateEvent(eventData);
           if (updated) {
              setEvents(prevEvents => prevEvents.map(e => e.id === updated.id ? updated : e));
              toast({ title: "Event Updated", description: `"${eventData.title}" has been updated.` });
           } else {
               throw new Error("Failed to update event.");
           }
        } else {
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

    const handleSaveTodo = (todoData: TodoItem) => {
       try {
          if (todos.some(t => t.id === todoData.id)) {
             // Update existing todo
             const updated = updateTodo(todoData);
             if (updated) {
                setTodos(prevTodos => prevTodos.map(t => t.id === updated.id ? updated : t));
                toast({ title: "Todo Updated", description: `"${todoData.title}" has been updated.` });
             } else {
                 throw new Error("Failed to update todo.");
             }
          } else {
            // Add new todo - assuming date is already set
            const newTodo = addTodo({ title: todoData.title, date: todoData.date, description: todoData.description });
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

    const handleDeleteTodo = (todoId: string) => {
       try {
           const success = deleteTodo(todoId);
            if (success) {
               const deletedTodo = todos.find(t => t.id === todoId);
               setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
               toast({ title: "Todo Deleted", description: `"${deletedTodo?.title}" has been deleted.` });
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
   };


  // Memoize filtered events for performance
  const filteredEvents = useMemo(() => {
    if (isLoading) return [];
    switch (currentView) {
      case "day":
        return getEventsForDate(format(selectedDate, "yyyy-MM-dd"));
      case "week":
        return getEventsForWeek(selectedDate);
      case "month":
        return getEventsForMonth(selectedDate.getFullYear(), selectedDate.getMonth());
      default:
        return events;
    }
  }, [currentView, selectedDate, events, isLoading]);

  // Memoize filtered todos for performance (only day view needs specific filtering)
  const filteredTodos = useMemo(() => {
      if (isLoading) return [];
      if (currentView === "day") {
          return getTodosForDate(format(selectedDate, "yyyy-MM-dd"));
      }
      // For month/week view, we don't need date-specific todos in this component's context yet.
      // If needed later, add logic here similar to filteredEvents.
      return []; // Return empty for month/week, as DayView handles its own date filtering
  }, [currentView, selectedDate, todos, isLoading]);


  return (
    <div className="flex h-screen flex-col p-4 md:p-6 bg-secondary/30">
      <header className="flex items-center justify-between pb-4 mb-4 border-b">
        <h1 className="text-2xl font-bold text-primary">AR Calendar</h1>
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
           <Button onClick={handleAddTodoClick} variant="secondary" aria-label="Add new todo item">
             <ListTodo className="mr-2 h-4 w-4" /> Add Todo
           </Button>
        </div>
      </header>

      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as View)} className="flex flex-col flex-grow">
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="day">Day</TabsTrigger>
        </TabsList>

         <div className="flex-grow overflow-hidden">
            <TabsContent value="month" className="h-full m-0">
              {isLoading ? (
                  <div className="flex items-center justify-center h-full">Loading Month...</div>
              ) : (
                <CalendarMonthView
                    date={selectedDate}
                    events={filteredEvents} // Pass all events for month view logic
                    todos={todos} // Pass all todos for month view logic (e.g., count indicators)
                    onDateChange={setSelectedDate}
                    onEventClick={handleEventClick}
                    onDateClick={handleDateClick}
                    onTodoClick={handleTodoClick} // Pass handler
                />
              )}
            </TabsContent>
             <TabsContent value="week" className="h-full m-0">
               {isLoading ? (
                 <div className="flex items-center justify-center h-full">Loading Week...</div>
               ) : (
                 <CalendarWeekView
                   date={selectedDate}
                   events={filteredEvents} // Pass week-filtered events
                   todos={todos} // Pass all todos for week view logic
                   onEventClick={handleEventClick}
                   onDateClick={handleDateClick}
                   onTodoClick={handleTodoClick} // Pass handler
                 />
               )}
             </TabsContent>
             <TabsContent value="day" className="h-full m-0">
               {isLoading ? (
                 <div className="flex items-center justify-center h-full">Loading Day...</div>
               ) : (
                 <CalendarDayView
                   date={selectedDate}
                   events={filteredEvents} // Pass day-filtered events
                   todos={filteredTodos} // Pass day-filtered todos
                   onEventClick={handleEventClick}
                   onTodoClick={handleTodoClick} // Pass handler
                   onTodoToggle={handleTodoToggle} // Pass toggle handler
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
       <TodoForm // Add TodoForm dialog
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
