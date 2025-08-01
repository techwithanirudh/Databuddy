import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const toUtcIso = (d: Date | string | number) =>
	dayjs.utc(d).toISOString(); // always trailing Z

export const fmtLocal = (iso: string, fmt = 'DD MMM YYYY HH:mm') =>
	dayjs.utc(iso).local().format(fmt); // display in user TZ
