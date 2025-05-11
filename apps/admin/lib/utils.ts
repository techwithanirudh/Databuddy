import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string | null | undefined): string => {
  if (!name) return "U"; // Default to 'U' for User if name is not provided
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2); // Return first 1 or 2 initials
};
