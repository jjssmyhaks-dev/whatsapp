import * as React from 'react';
import { cn } from '@/lib/utils';

// Simplified dialog implementation
// In a real implementation, use @radix-ui/react-dialog

const Dialog = ({ open, onOpenChange, children }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50', !open && 'hidden')}>
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      {children}
    </div>
  );
};

const DialogTrigger = ({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) => {
  return <>{children}</>;
};

const DialogContent = ({ className, children, ...props }: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <div
      className={cn(
        'relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border rounded-lg shadow-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogHeader = ({ className, children, ...props }: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogTitle = ({ className, children, ...props }: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <h2
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h2>
  );
};

const DialogDescription = ({ className, children, ...props }: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
};

const DialogFooter = ({ className, children, ...props }: {
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
