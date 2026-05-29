import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn("card-hover rounded-2xl border border-white/7 p-6", className)}
      style={{ background: "rgba(12,17,32,0.60)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn("text-lg font-semibold text-white/90", className)}>{children}</h3>;
}

export function CardDescription({ className, children }: CardProps) {
  return <p className={cn("text-sm text-white/40", className)}>{children}</p>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CardFooter({ className, children }: CardProps) {
  return <div className={cn("mt-4 flex items-center gap-2", className)}>{children}</div>;
}
