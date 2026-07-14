import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// This is a simplified version. In a real implementation, you'd use @radix-ui/react-select
export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

const Select = ({ value, onValueChange, placeholder, className, children, ...props }: SelectProps) => {
  return (
    <div className={cn('relative', className)} {...props}>
      {children}
    </div>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { placeholder?: string }
>(({ className, children, placeholder, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <span>{children || placeholder || 'Select...'}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <span>{placeholder || 'Select...'}</span>;
};

const SelectContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'absolute z-50 min-w-[8rem] bg-popover text-popover-foreground shadow-md border rounded-md p-1',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      data-value={value}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
