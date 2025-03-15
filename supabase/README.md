# OneWord Supabase Directory

This directory contains the Supabase configuration and structure for the OneWord application.

## Directory Structure

```
supabase/
├── .branches/            # Supabase branches configuration
├── .temp/                # Temporary files for Supabase operations
├── .vscode/              # VS Code settings for Supabase development
├── config/               # Supabase configuration
├── functions/            # Edge Functions directory
│   └── _shared/          # Shared code between functions
├── migrations/           # Database migrations
└── config.toml           # Supabase configuration file
```

## Usage

### Edge Functions

To create a new Edge Function:

```bash
# Generate a new Edge Function
npx supabase functions new my-function-name

# Deploy an Edge Function
npx supabase functions deploy my-function-name
```

### Migrations

To create and apply migrations:

```bash
# Create a new migration
npx supabase migration new my_migration_name

# Apply migrations
npx supabase db push
```

## Notes

- This directory has been cleaned up on March 15, 2025, removing all outdated functions and migrations
- The project is now treated as new, without historical baggage
- All removed components were backed up in `oneword-backup-20250315` directory
- New functions and migrations should be created as needed during development 