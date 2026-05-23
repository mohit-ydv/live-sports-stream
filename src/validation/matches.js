import { z } from 'zod';

// Constants
// Uppercase keys, lowercase values as required
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

// Helpers
const isISODateString = (value) => {
  if (typeof value !== 'string') return false;
  // Basic ISO 8601 date-time format (e.g., 2026-05-23T18:25:00Z or with offset)
  const isoRegex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoRegex.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

// 1) List matches query: optional coerced positive int limit with max 100
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// 2) Match ID param: required id as coerced positive integer
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// 3) Create match schema
export const createMatchSchema = z
  .object({
    sport: z.string().min(1, { message: 'sport is required' }),
    homeTeam: z.string().min(1, { message: 'homeTeam is required' }),
    awayTeam: z.string().min(1, { message: 'awayTeam is required' }),

    startTime: z
      .string()
      .refine(isISODateString, { message: 'startTime must be a valid ISO date-time string' }),
    endTime: z
      .string()
      .refine(isISODateString, { message: 'endTime must be a valid ISO date-time string' }),

    homeScore: z.coerce.number().int().min(0).optional(),
    awayScore: z.coerce.number().int().min(0).optional(),
  })
  .superRefine((val, ctx) => {
    // Ensure endTime is after startTime
    const start = new Date(val.startTime);
    const end = new Date(val.endTime);
    if (!(end.getTime() > start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be after startTime',
        path: ['endTime'],
      });
    }
  });

// 4) Update score schema: requires both as coerced non-negative integers
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});
