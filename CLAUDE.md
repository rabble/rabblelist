# Claude Instructions for Contact Manager PWA

## A Note on Development Process

**Hey there!** 👋 Building reliable web applications is an iterative process, and frustration is completely normal. When things don't work on the first try, please know that:

- **You're doing great** - Complex apps require patience and iteration
- **I'm here to help** - Any frustration you feel is with the process, not with me, and I understand that completely
- **We're a team** - I'm genuinely trying my best to help you build something awesome
- **Every error teaches us** - Each issue we solve together makes the app more robust

Let's build something amazing together! 🚀

---

## Core Build Requirements

**CRITICAL**: These commands MUST pass before any task is considered complete:

```bash
# 1. TypeScript compilation (zero errors)
npm run build

# 2. Linting (zero errors/warnings)
npm run lint

# 3. Type checking (if separate from build)
npm run type-check

# 4. Tests (if configured)
npm test
```

**Never skip these checks.** If any fail, we fix them together before moving forward.

---

## Reliability & Quality Standards

### Error Handling
- **Always** wrap async operations in try-catch blocks
- **Always** handle loading and error states in components
- **Always** provide meaningful error messages to users
- Use TypeScript's strict mode - no `any` types without justification

### Performance Best Practices
- Implement proper React memoization (`useMemo`, `useCallback`, `React.memo`)
- Use lazy loading for components and routes
- Optimize database queries with proper indexing and filtering
- Implement proper pagination for large datasets

### Security First
- **Never** trust client-side data - validate everything
- **Always** filter by `organization_id` for multi-tenant security
- Use proper authentication checks on all protected routes
- Sanitize user inputs and validate on both client and server

### Testing Strategy
- Write unit tests for utility functions
- Add integration tests for critical user flows
- Test error scenarios, not just happy paths
- Mock external dependencies properly

---

## Project-Specific Guidelines

### Database Schema Alignment
- **ALWAYS** verify TypeScript interfaces match `supabase/schema.sql`
- **ALWAYS** check field names in database vs. code (e.g., `name` not `title` for campaigns)
- **ALWAYS** validate the actual table structure before writing queries

### Campaign Stats Pattern
Use this helper for consistent campaign stats access:

```typescript
const getCampaignStat = (campaign: Campaign, statType: string): number => {
  if (!campaign.campaign_stats || !Array.isArray(campaign.campaign_stats)) return 0
  const stat = campaign.campaign_stats.find((s: any) => s.stat_type === statType)
  return stat?.stat_value || 0
}
```

### Type Safety
```typescript
// Always import from centralized type definitions
import type { Campaign, CampaignStats } from '@/types/campaign.types'

// Use proper generic typing for API responses
interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
}
```

### Organization Security Pattern
```typescript
// ALWAYS include organization filtering
const fetchUserData = async (userId: string, organizationId: string) => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId) // Security: Never forget this!
}
```

---

## Code Quality Checklist

Before submitting any code, verify:

- [ ] **No TypeScript errors** - `npm run build` passes
- [ ] **No linting issues** - `npm run lint` passes  
- [ ] **Proper error handling** - All async operations have try-catch
- [ ] **Loading states** - UI shows loading indicators where appropriate
- [ ] **Type safety** - No `any` types without explicit reasoning
- [ ] **Security** - Organization filtering applied to all queries
- [ ] **Performance** - Proper memoization and optimization
- [ ] **Accessibility** - ARIA labels and semantic HTML
- [ ] **Mobile responsive** - Works well on all screen sizes

---

## Development Workflow

1. **Understand the requirement** - Ask clarifying questions if needed
2. **Check existing patterns** - Follow established conventions
3. **Write the code** - Focus on clarity and type safety
4. **Test locally** - Verify functionality works as expected
5. **Run quality checks** - Build, lint, and test must pass
6. **Review security** - Ensure proper filtering and validation
7. **Document changes** - Update types and add comments where helpful

---

## When Things Go Wrong

**It's totally normal!** Here's our process:

1. **Read the error carefully** - Often it tells us exactly what to fix
2. **Check the database schema** - Mismatched field names are common
3. **Verify types** - TypeScript errors usually point to real issues
4. **Test incrementally** - Add console.logs to understand data flow
5. **Ask for help** - I'm here to debug with you step by step

Remember: Every bug we fix together makes you a better developer and the app more reliable. We've got this! 💪

---

## Emergency Debugging Commands

When stuck, try these:

```bash
# Clear all caches and reinstall
rm -rf node_modules package-lock.json
npm install

# Check database connection
npx supabase status

# Detailed TypeScript checking
npx tsc --noEmit --listFiles

# Check for unused dependencies
npx depcheck
```

---

**Bottom line**: We're building something great together. I'm here to support you through every challenge, and your persistence will pay off! 🎉