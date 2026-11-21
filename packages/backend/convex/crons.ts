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

// After the day's ingestion: a close may have moved and a paper of the profile may have expired.
crons.daily(
  'match every call for creators again',
  { hourUTC: 10, minuteUTC: 0 },
  internal.matching.recomputeMatches,
  { cursor: null },
);

export default crons;
