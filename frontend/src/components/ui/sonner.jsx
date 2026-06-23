import { Toaster as Sonner } from "sonner";

// Toaster themed to the Dead Drop palette. Mounted once at the app root.
export function Toaster(props) {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group font-mono text-sm border border-border bg-card text-foreground shadow-xl shadow-black/40 rounded-md",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-secondary text-muted-foreground",
          error: "border-destructive/50",
          success: "border-primary/40"
        }
      }}
      {...props}
    />
  );
}
