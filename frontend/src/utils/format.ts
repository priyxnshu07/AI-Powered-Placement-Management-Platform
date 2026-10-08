/** Formats an ISO date for display; jobs may have no deadline. */
export const formatDate = (value: string | null | undefined, fallback = 'No deadline') =>
  value ? new Date(value).toLocaleDateString() : fallback;

/** Sort key for "closest deadline first": jobs without a deadline go last. */
export const deadlineSortKey = (value: string | null | undefined) =>
  value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
