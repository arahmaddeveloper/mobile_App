
"use client";

import type { TodoItem } from "@/lib/types";

const TODOS_STORAGE_KEY = "chronozen_todos"; // Changed key to avoid conflicts

// Helper to safely get todos from local storage
const safelyGetTodos = (): TodoItem[] => {
  if (typeof window === "undefined") {
    return []; // Return empty array if not in browser environment
  }
  try {
    const storedTodos = localStorage.getItem(TODOS_STORAGE_KEY);
    return storedTodos ? (JSON.parse(storedTodos) as TodoItem[]) : [];
  } catch (error) {
    console.error("Error reading todos from local storage:", error);
    return [];
  }
};

// Helper to safely set todos to local storage
const safelySetTodos = (todos: TodoItem[]): void => {
  if (typeof window === "undefined") {
    return; // Do nothing if not in browser environment
  }
  try {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error("Error writing todos to local storage:", error);
  }
};

export const getTodos = (): TodoItem[] => {
  return safelyGetTodos();
};

export const addTodo = (newTodo: Omit<TodoItem, 'id' | 'completed'>): TodoItem => {
  const todos = safelyGetTodos();
  const todoWithId: TodoItem = {
    ...newTodo,
    id: crypto.randomUUID(), // Generate a unique ID
    completed: false, // Default to not completed
  };
  const updatedTodos = [...todos, todoWithId];
  safelySetTodos(updatedTodos);
  return todoWithId;
};

export const updateTodo = (updatedTodo: TodoItem): TodoItem | null => {
  const todos = safelyGetTodos();
  const todoIndex = todos.findIndex((todo) => todo.id === updatedTodo.id);
  if (todoIndex === -1) {
    console.error("Todo not found for update:", updatedTodo.id);
    return null; // Todo not found
  }
  const updatedTodos = [...todos];
  updatedTodos[todoIndex] = updatedTodo;
  safelySetTodos(updatedTodos);
  return updatedTodo;
};

export const deleteTodo = (todoId: string): boolean => {
  const todos = safelyGetTodos();
  const initialLength = todos.length;
  const updatedTodos = todos.filter((todo) => todo.id !== todoId);
  if (updatedTodos.length === initialLength) {
     console.warn("Todo not found for deletion:", todoId);
     return false; // Todo not found
  }
  safelySetTodos(updatedTodos);
  return true; // Deletion successful
};

// Get todos specifically for a given date
export const getTodosForDate = (date: string): TodoItem[] => {
  const todos = safelyGetTodos();
  return todos.filter(todo => todo.date === date).sort((a, b) => a.title.localeCompare(b.title)); // Sort alphabetically
};

// Function to toggle the completion status of a todo item
export const toggleTodoCompletion = (todoId: string): TodoItem | null => {
    const todos = safelyGetTodos();
    const todoIndex = todos.findIndex((todo) => todo.id === todoId);
    if (todoIndex === -1) {
      console.error("Todo not found for toggling completion:", todoId);
      return null;
    }
    const updatedTodos = [...todos];
    const updatedTodo = { ...updatedTodos[todoIndex], completed: !updatedTodos[todoIndex].completed };
    updatedTodos[todoIndex] = updatedTodo;
    safelySetTodos(updatedTodos);
    return updatedTodo;
};
