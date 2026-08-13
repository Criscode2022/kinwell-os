# Kinwell

**The care book your family actually keeps.**

**Repository:** [https://github.com/Criscode2022/kinwell-os](https://github.com/Criscode2022/kinwell-os)

Kinwell is a production family caregiver OS. It replaces the WhatsApp thread, the kitchen notepad, and the blister-pack guesswork with one shared book: medications and adherence, clinic days, household tasks, a daily journal, and a printable emergency card.

Stack: **Angular 19** · **NestJS 11** · **Neon Postgres** · **Tailwind CSS**

## Demo

```
email:    demo@kinwell.app
password: demo1234
```

The demo household is Elena Vargas coordinating care for her mother Carmen (Valencia) and father-in-law Tomas (Madrid).

## What it does

| Area | Capability |
| --- | --- |
| Today | Morning dose list, mark taken/skipped, 7-day adherence |
| People | Conditions, allergies, physician, pharmacy, emergency contacts |
| Medications | Frequency, times, with-food, stock and refill tracking |
| Appointments | GP / specialist / lab with prep notes |
| Tasks | Pharmacy, transport, paperwork, home - assigned to siblings |
| Journal | Mood, sleep, appetite, and the day's story |
| Emergency card | Printable one-pager for a bag or fridge |

## Quick start

```bash
npm --prefix apps/api install
npm --prefix apps/web install
npm run build
npm start
```

The API listens on port 8080 and serves the Angular build.

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

- Swagger UI: `/api/docs`
- Health: `GET /api/health`
- Auth is JWT bearer. Domain routes require a token.

## Tests

```bash
npm start &
npm run test:api
```

CI installs, builds both apps, boots the server on PGLite, and runs the smoke suite on every push.

## Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Criscode2022/kinwell-os)

1. Create a Neon project and copy the pooled connection string.
2. Set `DATABASE_URL` and `JWT_SECRET` on the host.
3. One-click **Render** via `render.yaml`, or Docker:

```bash
docker build -t kinwell-os .
docker run -p 8080:8080 -e JWT_SECRET=change-me kinwell-os
```

Any Node 20+ host works (Railway, Render, Fly, a VPS). Nest should run as a long-lived Node process against Neon.

## License

MIT (c) Cristian Damil Garcia
