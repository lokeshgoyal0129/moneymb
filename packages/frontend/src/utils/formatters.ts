/**
 * Format Paise into Indian Rupees (₹) string
 * Example: 7581098 -> "₹ 75,810.98"
 */
export function formatPaiseToRupees(paise?: number): string {
  if (paise === undefined || paise === null || isNaN(paise)) {
    return '₹ 0.00';
  }
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rupees).replace('INR', '₹');
}

/**
 * Format date for Indian time display
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}
