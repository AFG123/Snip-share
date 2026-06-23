import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge conditional class names and resolve Tailwind conflicts (shadcn convention).
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
