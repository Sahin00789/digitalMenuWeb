/**
 * Returns today's date in 'YYYY-MM-DD' format, specifically in IST (Asia/Kolkata).
 * This ensures that for the 5.5 hour gap (12:00 AM - 5:30 AM IST), the dashboard
 * correctly identifies the NEW day instead of staying on the previous UTC day.
 */
export const getTodayISTDateString = () => {
    const date = new Date();
    const istStr = date.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const [m, d, y] = istStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

/**
 * Formats any date into IST Date String
 */
export const formatToISTDateString = (date: Date | string) => {
    const d = new Date(date);
    const istStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const [m, d1, y] = istStr.split('/');
    return `${y}-${m.padStart(2, '0')}-${d1.padStart(2, '0')}`;
};
