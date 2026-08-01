# animal intrusion system

real-time animal intrusion detection system using edge ai, a central backend, supabase database, react web dashboard, and a flutter mobile app.

## project structure

- `ai/` - computer vision and edge detection models, inference scripts, and camera processing utilities.
- `backend/` - node.js / express api handling alert events, notifications, camera telemetry, and database queries.
- `web/` - react dashboard for live camera monitoring, intrusion logs, analytics, and device management.
- `mobile/` - flutter application for real-time intrusion push notifications and on-the-go monitoring.

## architecture overview

```
[ edge camera (ai/) ] ---> [ express api (backend/) ] <---> [ supabase db ]
                                      |
                 +--------------------+--------------------+
                 |                                         |
      [ react dashboard (web/) ]                  [ flutter app (mobile/) ]
```

## tech stack

| component | technology | primary role |
| --- | --- | --- |
| edge / ai | python, opencv / yolo | animal detection & frame inference |
| backend | node.js, express | api endpoints, event triggers, alerts |
| database | supabase (postgresql) | event persistence, camera states, user auth |
| web dashboard | react | monitoring ui, historical logs, settings |
| mobile app | flutter | push notifications, live status checks |

## getting started

1. clone the repository.
2. copy `.env.example` in `ai/`, `backend/`, and `web/` to `.env` in their respective folders.
3. fill in placeholder environment variables for local development.
4. detailed build and run instructions will be added as each service is scaffolded.
