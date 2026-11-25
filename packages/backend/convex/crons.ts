import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// The daily ingestion (`ingestion.scheduleDailyIngestion`, 09:00 UTC) is paused until the free
// plan's Database I/O period resets: its ~2,200 daily writes keep the deployment over the cap.
// Run it by hand meanwhile (`packages/backend/AGENTS.md`).

// Daily: a call may have closed and a paper of the profile may have expired.
crons.daily(
  'match every call for creators again',
  { hourUTC: 10, minuteUTC: 0 },
  internal.matching.recomputeMatches,
  { cursor: null },
);

export default crons;
