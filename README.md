# Kinwell

**The care book your family actually keeps.**

Kinwell is a production-ready family caregiver OS. It replaces the WhatsApp thread, the kitchen notepad, and the blister-pack guesswork with one shared book: medications and adherence, clinic days, household tasks, a daily journal, and a printable emergency card.

Stack: **Angular 19** · **NestJS 11** · **Neon Postgres** · **Tailwind CSS**

## Demo

```
email:    demo@kinwell.app
password: demo1234
```

The demo household is Elena Vargas coordinating care for her mother Carmen (Valencia) and father-in-law Tomás (Madrid) — real regimens, labs, refills, and journal notes.

## What it does

| Area | Capability |
| --- | --- |
| Today | Morning dose list, mark taken/skipped, 7-day adherence |
| People | Conditions, allergies, physician, pharmacy, emergency contacts |
| Medications | Frequency, times, with-food, stock and refill tracking |
| Appointments | GP / specialist / lab with prep notes |
| Tasks | Pharmacy, transport, paperwork, home — assigned to siblings |
| Journal | Mood, sleep, appetite, and the day's story |
| Emergency card | Printable one-pager for a bag or fridge |

## Quick start

```bash
npm --prefix apps/api install
npm --prefix apps/web install
npm run build
npm start
```

The API listens on `0.0.0.0:8080` and serves the Angular build. Open [http://localhost:8080](http://localhost:8080).

Dev mode (Angular HMR + Nest watch):

```bash
npm run dev
```

Without `DATABASE_URL`, the API uses **embedded PGLite** (Postgres-compatible) and seeds the demo account on first boot. Point `DATABASE_URL` at a [Neon](https://neon.tech) project for production.

## Environment

Copy `.env.example`:

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=use-a-long-random-string
PORT=8080
HOST=0.0.0.0
```

## API

Swagger UI: `/api/docs`

Health: `GET /api/health`

Auth is JWT bearer. All domain routes (`/api/people`, `/api/medications`, `/api/doses`, `/api/appointments`, `/api/tasks`, `/api/journal`, `/api/dashboard`) require a token.

## Tests

```bash
npm start &          # after npm run build
npm run test:api     # end-to-end smoke against the running server
```

CI (GitHub Actions) installs, builds both apps, boots the server on PGLite, and runs the same smoke suite on every push.

## Deploy

1. Create a Neon project and copy the pooled connection string.
2. Set `DATABASE_URL` and `JWT_SECRET` on the host.
3. `npm --prefix apps/api install && npm --prefix apps/web install && npm run build && npm start`

Any Node 20+ host works (Railway, Render, Fly, a VPS). `vercel.json` is included so the Angular shell can be hosted on Vercel; the Nest API should run as a long-lived Node process against Neon (serverless PGLite is ephemeral).

## License

MIT © Cristian Damil García
