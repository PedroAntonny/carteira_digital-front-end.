import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
}

export function CardHeader({ title, subtitle }: CardHeaderProps) {
  return (
    <div className="mb-3 sm:mb-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">
          {subtitle}
        </p>
      )}
    </div>
  );
}
