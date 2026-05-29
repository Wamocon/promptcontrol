import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "pro";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-white/6 text-white/55 border border-white/8",
  success: "bg-emerald-400/12 text-emerald-400 border border-emerald-400/20",
  warning: "bg-amber-400/12 text-amber-400 border border-amber-400/20",
  danger: "bg-rose-500/12 text-rose-400 border border-rose-500/20",
  info: "bg-indigo-400/12 text-indigo-400 border border-indigo-400/20",
  pro: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
