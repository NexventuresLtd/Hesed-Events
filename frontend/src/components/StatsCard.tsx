import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-muted/20 p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon size={20} className={color} />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="text-2xl font-bold text-text">{value}</p>
        </div>
      </div>
    </div>
  );
}
