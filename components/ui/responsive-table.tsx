import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveTableWrapperProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTableWrapper({
  children,
  className
}: ResponsiveTableWrapperProps) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-md border", className)}>
      {children}
    </div>
  )
}
