import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleToggle = async () => {
    // Prevent rapid clicking during transition
    if (isTransitioning) {
      return;
    }

    setIsTransitioning(true);

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      switchTheme();
      setTimeout(() => setIsTransitioning(false), 100);
      return;
    }

    try {
      // Start the view transition
      const transition = document.startViewTransition(() => {
        switchTheme();
      });

      // Use ready instead of finished to avoid pausing
      await transition.ready;
      
      // Set a timeout to reset the transitioning state
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1000); // Match the animation duration
      
    } catch (error) {
      // Transition was skipped or interrupted
      console.log('Theme transition was interrupted:', error);
      setIsTransitioning(false);
    }
  };

  if (!mounted) return null;

  return (
    <Button 
      ref={buttonRef}
      variant="ghost" 
      size="icon" 
      className="hidden md:flex h-8 w-8 relative overflow-hidden transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95"
      onClick={handleToggle}
      disabled={isTransitioning}
      data-theme-toggle
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4 transition-transform duration-300" />
      ) : (
        <Sun className="h-4 w-4 transition-transform duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 