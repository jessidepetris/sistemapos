import { Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSafeLocation } from "./router-provider";
import { ComponentType, useEffect } from "react";

interface ProtectedRouteProps {
  path: string;
  component: ComponentType<any>;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useSafeLocation();

  useEffect(() => {
    console.log("[ProtectedRoute] Mounted with path:", path);
    console.log("[ProtectedRoute] User state:", user ? "Authenticated" : "Not authenticated");
    console.log("[ProtectedRoute] Current location:", location);
  }, [path, user, location]);

  if (!user) {
    console.log("[ProtectedRoute] Redirecting to auth page");
    const redirectUrl = `/auth?redirect=${encodeURIComponent(location)}`;
    console.log("[ProtectedRoute] Redirect URL:", redirectUrl);
    window.location.href = redirectUrl;
    return null;
  }

  console.log("[ProtectedRoute] Rendering protected route for path:", path);
  return <Route path={path} component={Component} />;
}
