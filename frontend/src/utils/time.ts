/**
 * Utility functions for time formatting
 */

/**
 * Formats a date as relative time in Uzbek (Lotin)
 * Examples: "5 daqiqa oldin", "2 soat oldin", "3 kun oldin"
 * 
 * @param date - The date to format
 * @returns Formatted relative time string in Uzbek
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return "Hozir";
  }

  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} daqiqa oldin`;
  }

  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} soat oldin`;
  }

  // Days
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (diffInDays === 1) {
      return "Kecha";
    }
    return `${diffInDays} kun oldin`;
  }

  // Weeks
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} hafta oldin`;
  }

  // Months
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} oy oldin`;
  }

  // Years
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} yil oldin`;
}
