# Claude Instructions for Contact Manager PWA

## Build and Lint Requirements

**IMPORTANT**: You MUST always run the following commands before finishing any task:

1. `npm run build` - To ensure TypeScript compilation succeeds without errors
2. `npm run lint` - To check for any linting issues (if configured)

If either command fails, you must fix all errors before considering the task complete.

## Project-Specific Guidelines

1. **Database Schema Alignment**: Always verify that TypeScript interfaces match the actual database schema in `supabase/schema.sql`
2. **Field Name Consistency**: The database uses `name` for campaigns, not `title`
3. **Campaign Stats Structure**: The `campaign_stats` table uses a key-value structure with `stat_type` and `stat_value`, not direct columns
4. **No Mock Data**: All features should use real Supabase queries, never mock data
5. **Organization Filtering**: All queries must include proper organization_id filtering for security

## Common Patterns

### Campaign Stats Helper
When accessing campaign statistics, use this pattern:
```typescript
const getCampaignStat = (campaign: Campaign, statType: string): number => {
  if (!campaign.campaign_stats || !Array.isArray(campaign.campaign_stats)) return 0
  const stat = campaign.campaign_stats.find((s: any) => s.stat_type === statType)
  return stat?.stat_value || 0
}
```

### Type Imports
Always import types from the centralized location:
```typescript
import type { Campaign, CampaignStats } from '@/types/campaign.types'
```