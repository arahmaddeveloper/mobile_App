
"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";

import type { TodoItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const todoFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  date: z.date({ required_error: "Date is required" }),
  completed: z.boolean().default(false), // Keep completed status
});

type TodoFormValues = z.infer<typeof todoFormSchema>;

interface TodoFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  todo?: TodoItem | null; // Pass todo for editing, null/undefined for creating
  selectedDate: Date; // Always require a date for todos
  onSave: (todo: TodoItem) => void;
  onDelete?: (todoId: string) => void;
}

export const TodoForm: FC<TodoFormProps> = ({
  isOpen,
  onOpenChange,
  todo,
  selectedDate,
  onSave,
  onDelete,
}) => {
  const isEditing = !!todo;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: selectedDate,
      completed: false,
    },
  });

  useEffect(() => {
    if (isOpen) { // Only reset when dialog opens
        if (todo) {
          form.reset({
            title: todo.title,
            description: todo.description || "",
            date: new Date(todo.date + 'T00:00:00'), // Parse date string
            completed: todo.completed,
          });
        } else {
          // Reset to default values for creation, using selectedDate
          form.reset({
            title: "",
            description: "",
            date: selectedDate,
            completed: false,
          });
        }
    }
  }, [isOpen, todo, selectedDate, form]); // Depend on isOpen

  const onSubmit = (values: TodoFormValues) => {
    const todoData: Omit<TodoItem, 'id'> = {
      title: values.title,
      description: values.description,
      date: format(values.date, "yyyy-MM-dd"),
      completed: values.completed,
    };

    const finalTodo: TodoItem = {
      ...todoData,
      id: isEditing ? todo.id : crypto.randomUUID(), // Use existing ID if editing
    };

    onSave(finalTodo);
    onOpenChange(false); // Close dialog after save
  };

  const handleDelete = () => {
      if (todo && onDelete) {
          onDelete(todo.id);
          onOpenChange(false); // Close main dialog
          setShowDeleteConfirm(false); // Close confirmation dialog
      }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Todo" : "Create Todo"}</DialogTitle>
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
                    <Input placeholder="Todo title" {...field} />
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
                    <Textarea placeholder="Todo description (optional)" {...field} />
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
                            format(field.value, "PPP")
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
                        // disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
                control={form.control}
                name="completed"
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
                                Mark as Completed
                            </FormLabel>
                        </div>
                    </FormItem>
                )}
             />


            <DialogFooter className="sm:justify-between pt-4">
                 {isEditing && onDelete && (
                     <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                         <AlertDialogTrigger asChild>
                             <Button type="button" variant="destructive" className="mr-auto">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                             </Button>
                         </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader>
                                 <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                 <AlertDialogDescription>
                                     This action cannot be undone. This will permanently delete the todo item.
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
                  <div className="flex gap-2 ml-auto">
                     <DialogClose asChild>
                         <Button type="button" variant="outline">
                             Cancel
                         </Button>
                     </DialogClose>
                     <Button type="submit">{isEditing ? "Save Changes" : "Create Todo"}</Button>
                 </div>
             </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
