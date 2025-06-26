import { Router, useLocation } from "wouter";
import { ReactNode, useEffect } from "react";

interface RouterProviderProps {
  children: ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps) {
  useEffect(() => {
    console.log("[RouterProvider] Component mounted");
    return () => {
      console.log("[RouterProvider] Component unmounted");
    };
  }, []);

  return (
    <Router>
      {children}
    </Router>
  );
}

export function useSafeLocation() {
  try {
    const [location] = useLocation();
    console.log("[useSafeLocation] Current location:", location);
    return location || "/";
  } catch (error) {
    console.error("[useSafeLocation] Error getting location:", error);
    return "/";
  }
} 
