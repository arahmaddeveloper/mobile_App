"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, Trash2, BellRing } from "lucide-react";

import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button"; // Import buttonVariants
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const reminderOptions = [
  { value: "0", label: "None" },
  { value: "5", label: "5 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" }, // 60 * 24
];

const eventFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  date: z.date({ required_error: "Date is required" }),
  startTime: z.string().regex(timeRegex, { message: "Invalid time format (HH:mm)" }).optional().or(z.literal("")),
  endTime: z.string().regex(timeRegex, { message: "Invalid time format (HH:mm)" }).optional().or(z.literal("")),
  allDay: z.boolean().default(false),
  reminderMinutes: z.string().optional(), // Store as string initially from select
}).refine(data => {
  // If not allDay, startTime must be present
  if (!data.allDay && !data.startTime) return false;
  // If endTime is present, startTime must also be present and endTime must be after startTime
  if (data.endTime && data.startTime && data.endTime <= data.startTime) return false;
  return true;
}, {
  message: "End time must be after start time. Start time is required if not all day.",
  path: ["endTime"], // Attach error to endTime field
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  event?: CalendarEvent | null; // Pass event for editing, null/undefined for creating
  selectedDate: Date;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

export const EventForm: FC<EventFormProps> = ({
  isOpen,
  onOpenChange,
  event,
  selectedDate,
  onSave,
  onDelete,
}) => {
  const isEditing = !!event;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: selectedDate,
      startTime: "",
      endTime: "",
      allDay: false,
      reminderMinutes: "0", // Default to "None"
    },
  });

  const { watch, setValue, reset } = form; // Added reset
  const isAllDay = watch("allDay");

  useEffect(() => {
    if (isOpen) { // Reset form when dialog opens
      if (event) {
        reset({
          title: event.title,
          description: event.description || "",
          date: new Date(event.date + 'T00:00:00'), // Ensure date is parsed correctly
          startTime: event.startTime || "",
          endTime: event.endTime || "",
          allDay: event.allDay,
          reminderMinutes: event.reminderMinutes !== undefined ? String(event.reminderMinutes) : "0", // Convert number back to string for select
        });
      } else {
        // Reset to default values for creation, using selectedDate
        reset({
          title: "",
          description: "",
          date: selectedDate,
          startTime: "",
          endTime: "",
          allDay: false,
          reminderMinutes: "0",
        });
      }
    }
  }, [event, selectedDate, reset, isOpen]); // Use reset here, depend on isOpen

   useEffect(() => {
     // Clear times if allDay is checked
     if (isAllDay) {
       setValue("startTime", "");
       setValue("endTime", "");
     }
   }, [isAllDay, setValue]);

  const onSubmit = (values: EventFormValues) => {
    const reminderValue = parseInt(values.reminderMinutes || "0", 10);
    const reminderMinutes = reminderValue > 0 ? reminderValue : undefined; // Set to undefined if "None" (0)

    const eventData: Omit<CalendarEvent, 'id'> = {
      title: values.title,
      description: values.description,
      date: format(values.date, "yyyy-MM-dd"),
      startTime: values.allDay ? undefined : values.startTime,
      endTime: values.allDay ? undefined : values.endTime,
      allDay: values.allDay,
      reminderMinutes: reminderMinutes,
    };

    const finalEvent: CalendarEvent = {
      ...eventData,
      id: isEditing ? event.id : crypto.randomUUID(), // Use existing ID if editing
    };

    // TODO: Implement notification scheduling logic here
    // This would typically involve:
    // 1. Requesting Notification permissions if not already granted.
    // 2. Calculating the notification trigger time (event time - reminderMinutes).
    // 3. Using the Notifications API (potentially with a Service Worker for persistence)
    //    to schedule the notification.
    // Example placeholder:
    // if (finalEvent.reminderMinutes && finalEvent.startTime && 'Notification' in window && Notification.permission === 'granted') {
    //   console.log(`Scheduling notification for "${finalEvent.title}" ${finalEvent.reminderMinutes} minutes before ${finalEvent.startTime}`);
    //   // scheduleNotification(finalEvent); // Call actual scheduling function
    // } else if (finalEvent.reminderMinutes && 'Notification' in window && Notification.permission !== 'denied') {
    //    // Request permission
    //    Notification.requestPermission().then(permission => {
    //       if (permission === 'granted') {
    //          // scheduleNotification(finalEvent);
    //          console.log(`Notification permission granted. Scheduling notification for "${finalEvent.title}"`);
    //       }
    //    });
    // }

    onSave(finalEvent);
    onOpenChange(false); // Close dialog after save
  };

  const handleDelete = () => {
      if (event && onDelete) {
          // TODO: Cancel any scheduled notifications for this event
          // cancelNotification(event.id);
          onDelete(event.id);
          onOpenChange(false); // Close main dialog
          setShowDeleteConfirm(false); // Close confirmation dialog
      }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Event description (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

           <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP") // More readable format
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        // disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} // Example: disable past dates
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="allDay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      All Day Event
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

           {!isAllDay && (
               <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time (HH:mm)</FormLabel>
                       <FormControl>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input type="time" placeholder="HH:mm" className="pl-9" {...field} />
                         </div>
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time (HH:mm)</FormLabel>
                       <FormControl>
                        <div className="relative">
                           <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                           <Input type="time" placeholder="HH:mm" className="pl-9" {...field} />
                         </div>
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Reminder Select Dropdown (only show if not all-day) */}
            {!isAllDay && (
              <FormField
                control={form.control}
                name="reminderMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <BellRing className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Set a reminder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reminderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}


            <DialogFooter className="sm:justify-between pt-4 flex-wrap gap-2"> {/* Added flex-wrap and gap */}
                 {isEditing && onDelete && (
                     <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                         <AlertDialogTrigger asChild>
                             {/* Ensure delete button doesn't cause overflow */}
                             <Button type="button" variant="destructive" className="flex-shrink-0 mr-auto sm:mr-0 sm:order-1">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                             </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader>
                                 <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                 <AlertDialogDescription>
                                     This action cannot be undone. This will permanently delete the event.
                                 </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({ variant: "destructive" }))}>
                                     Delete
                                 </AlertDialogAction>
                             </AlertDialogFooter>
                         </AlertDialogContent>
                     </AlertDialog>
                 )}
                 {/* Ensure the save/cancel buttons are pushed to the right and wrap nicely */}
                  <div className="flex gap-2 ml-auto sm:order-2 flex-shrink-0"> {/* Added flex-shrink-0 */}
                     <DialogClose asChild>
                         <Button type="button" variant="outline">
                             Cancel
                         </Button>
                     </DialogClose>
                     <Button type="submit">{isEditing ? "Save Changes" : "Create Event"}</Button>
                 </div>
             </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
