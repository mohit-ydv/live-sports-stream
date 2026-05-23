import { pgEnum, pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Enum: match_status
export const matchStatus = pgEnum('match_status', ['scheduled', 'live', 'finished']);

// Table: matches
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  sport: text('sport').notNull(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  status: matchStatus('status').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  homeScore: integer('home_score').notNull().default(0),
  awayScore: integer('away_score').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Table: commentary (per-match realtime events)
export const commentary = pgTable('commentary', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  minute: integer('minute').notNull(),
  sequence: integer('sequence').notNull(),
  period: text('period').notNull(),
  eventType: text('event_type').notNull(),
  actor: text('actor'),
  team: text('team'),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  tags: text('tags').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
