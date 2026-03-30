
/**
 * Calculate the number of business days between two dates.
 * Weekends (Saturday and Sunday) are excluded.
 * Holidays are currently NOT excluded (needs a region-specific holiday list).
 */
export function getBusinessDaysDiff(startDate: Date, endDate: Date): number {
    // Clone dates to avoid modifying originals
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Reset hours to ensure full day calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let count = 0;
    const curDate = new Date(start);

    while (curDate < end) {
        const dayOfWeek = curDate.getDay();
        // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (!isWeekend) {
            count++;
        }

        // Move to next day
        curDate.setDate(curDate.getDate() + 1);
    }

    return count;
}
