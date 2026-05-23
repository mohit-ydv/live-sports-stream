import { Router } from 'express';
import {createMatchSchema, listMatchesQuerySchema} from '../validation/matches.js';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/match-status.js';
import {desc} from "drizzle-orm";

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    if(!parsed.success){
        res.status(400).json({error: "Invalid query.", details: JSON.Stringify(parsed.error)});
    }
    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
    try{
        const data = await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit);
        res.json({data})
    } catch(e){
        res.status(500).json({error: "Failed to list matches."})
    }
});

matchRouter.post('/', async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload.',
      details: parsed.error.flatten ? parsed.error.flatten() : String(parsed.error),
    });
  }

  const { startTime, endTime, homeScore, awayScore, sport, homeTeam, awayTeam } = parsed.data;

  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const [event] = await db
      .insert(matches)
      .values({
        sport,
        homeTeam,
        awayTeam,
        startTime: start,
        endTime: end,
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(start, end),
      })
      .returning();

    if(res.app.locals.broadcastMatchCreated) {
        res.app.locals.broadcastMatchCreated(event);
    }

    return res.status(201).json({ data: event });
  } catch (e) {
      return res.status(500).json({ error: 'Failed to create match.' });
  }
});