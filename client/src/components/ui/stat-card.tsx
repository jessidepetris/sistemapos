import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: "blue" | "indigo" | "green" | "yellow" | "red" | "purple" | "orange";
  alert?: boolean;
}

export default function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  color,
  alert = false
}: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    indigo: "bg-indigo-100 text-indigo-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600"
  };
  
  const trendClasses = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-slate-500"
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-semibold font-mono">{value}</p>
          {change && (
            <p className={cn("text-xs flex items-center mt-1", trendClasses[trend])}>
              {trend === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
              <span>{change}</span>
            </p>
          )}
          {alert && !change && (
            <p className="text-xs text-yellow-600 flex items-center mt-1">
              Requiere atención
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-full", colorClasses[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
