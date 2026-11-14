import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// 06:00 in Brasília: the day's calls are read before creators open the site.
crons.daily(
  'ingest every active source',
  { hourUTC: 9, minuteUTC: 0 },
  internal.ingestion.scheduleDailyIngestion,
  {},
);

export default crons;
