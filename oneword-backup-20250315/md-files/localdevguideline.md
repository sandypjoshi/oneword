# Supabase Local Development Guidelines

## Initial Setup

1. Install Supabase CLI:
```bash
npm install supabase --save-dev
```

2. Initialize Supabase in the project:
```bash
npx supabase init
```

3. Start the local Supabase stack:
```bash
npx supabase start
```

4. Access local Supabase Dashboard at http://localhost:54323

## Database Migration Workflow

1. Create a new migration:
```bash
npx supabase migration new <migration-name>
```

2. Add SQL to the migration file in `supabase/migrations/<timestamp>_<migration-name>.sql`

3. Apply migrations:
```bash
npx supabase db reset
```

## Testing Local Changes

1. Test all database operations against local instance
2. Verify data seeding and migrations work correctly
3. Test all API endpoints using local URLs:
   - REST: http://localhost:54321
   - Dashboard: http://localhost:54323

## Deploying to Production

1. Link to remote project:
```bash
npx supabase login
npx supabase link --project-ref <project-id>
```

2. Push database changes:
```bash
npx supabase db push
```

## Best Practices

1. Always develop and test against local Supabase first
2. Use migrations for all database changes
3. Version control your migrations
4. Test migrations both up and down
5. Keep seed data up to date
6. Document any manual steps needed

## Environment Setup

1. Create a `.env.local` file for local development:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
```

2. Keep production `.env` separate:
```env
NEXT_PUBLIC_SUPABASE_URL=<production-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
```

## Troubleshooting

1. If local stack fails:
```bash
npx supabase stop
docker system prune -a
npx supabase start
```

2. Reset database:
```bash
npx supabase db reset
```

3. View logs:
```bash
npx supabase logs
``` 