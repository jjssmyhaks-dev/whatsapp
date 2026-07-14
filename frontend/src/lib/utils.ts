import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function getClassificationColor(classification: string | null): string {
  switch (classification) {
    case 'urgent':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'important':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'routine':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'spam':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'ambiguous':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'archived':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'waiting_human':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'normal':
      return 'bg-blue-500';
    case 'low':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}
