# Organization ID Filtering Audit

## Summary
After reviewing the codebase, I found several critical issues with organization_id filtering that need to be addressed to ensure proper data isolation between organizations.

## Issues Found

### 1. ContactService (src/features/contacts/contacts.service.ts)
- **getContacts()** - ❌ MISSING organization_id filter (line 19-43)
- **getContact()** - ❌ MISSING organization_id filter (line 68-72)
- **updateContact()** - ❌ MISSING organization_id filter (line 123-127)
- **deleteContact()** - ❌ MISSING organization_id filter (line 149-150)
- **getCallHistory()** - ❌ MISSING organization_id filter (line 260-267)
- **getSmartListContacts()** - ❌ MISSING organization_id filter (line 328-329)
- **getContactInteractions()** - ❌ MISSING organization_id filter for all sub-queries
- **createContact()** - ✅ Uses hardcoded demo org ID
- **getCallQueue()** - ✅ Uses organization_id filter
- **logCall()** - ✅ Uses organization_id

### 2. CampaignService (src/features/campaigns/campaigns.service.ts)
- **getCampaigns()** - ✅ Properly filters by organization_id
- **getCampaign()** - ❌ MISSING organization_id filter (line 66-79)
- **updateCampaign()** - ❌ MISSING organization_id filter (line 117-123)
- **deleteCampaign()** - ❌ MISSING organization_id filter (line 136-138)
- **getCampaignAssets()** - ❌ MISSING organization_id filter (line 198-202)
- **updateCampaignAsset()** - ❌ MISSING organization_id filter
- **deleteCampaignAsset()** - ❌ MISSING organization_id filter
- **getPetition()** - ❌ MISSING organization_id filter
- **getPetitionSignatures()** - ❌ MISSING organization_id filter

### 3. EventService (src/features/events/events.service.ts)
- **getEvents()** - ✅ Uses organization_id via RPC function
- **getEvent()** - ✅ Uses organization_id
- **updateEvent()** - ❌ MISSING organization_id filter (line 113-118)
- **deleteEvent()** - ❌ MISSING organization_id filter (line 134-136)
- **getEventAttendees()** - ❌ MISSING organization_id filter
- **createRsvp()** - ❌ MISSING organization_id validation
- **updateRsvp()** - ❌ MISSING organization_id validation

### 4. GroupsService (src/services/groups.service.ts)
- **getGroups()** - ❌ MISSING organization_id filter (line 49-55)
- **getGroup()** - ❌ MISSING organization_id filter (line 101-111)
- **createGroup()** - ❌ MISSING organization_id assignment
- **updateGroup()** - ❌ MISSING organization_id filter (line 200-204)
- **deleteGroup()** - ❌ MISSING organization_id filter (line 221-223)
- **getGroupMembers()** - ❌ MISSING organization_id filter

### 5. PathwayService (src/features/pathways/pathways.service.ts)
- **getPathways()** - ❌ MISSING organization_id filter (line 59-72)
- **getPathway()** - ❌ MISSING organization_id filter (line 81-92)
- **updatePathway()** - ❌ MISSING organization_id filter (line 131-138)
- **deletePathway()** - ❌ MISSING organization_id filter (line 149-152)
- **createPathway()** - ✅ Properly sets organization_id

### 6. AnalyticsService (src/services/analytics.service.ts)
- **getCampaignAnalytics()** - ❌ MISSING organization_id validation for campaign access
- **getEngagementStats()** - ✅ Uses organization_id
- **getCampaignActivitiesByContact()** - ❌ MISSING organization_id filter
- **getEventRegistrationsByContact()** - ❌ MISSING organization_id filter
- **getEngagementLadder()** - ✅ Uses organization_id
- **getCampaignPerformance()** - ✅ Uses organization_id

### 7. PetitionService (src/services/petition.service.ts)
- **getPetition()** - ❌ MISSING organization_id validation
- **signPetition()** - ❌ MISSING organization_id for contact creation
- **getSignatures()** - ❌ MISSING organization_id validation
- **getPetitionStats()** - ❌ MISSING organization_id validation

### 8. APIKeyService (src/services/api-key.service.ts)
- All methods properly use organization_id ✅

## Critical Security Issues

1. **Cross-Organization Data Access**: Without proper organization_id filtering, users from one organization can potentially access and modify data from other organizations.

2. **Hardcoded Demo Organization ID**: ContactService uses a hardcoded demo organization ID instead of getting it from the authenticated user's profile.

3. **Missing Validation on Updates/Deletes**: Even if initial queries filter by organization, update and delete operations don't verify the resource belongs to the user's organization.

## Recommendations

1. **Immediate Actions**:
   - Add organization_id filters to all queries
   - Validate organization_id on all update/delete operations
   - Remove hardcoded organization IDs

2. **Best Practices**:
   - Create a base service class that automatically includes organization_id
   - Use Row Level Security (RLS) policies in Supabase
   - Add database-level constraints to prevent cross-org access

3. **Testing**:
   - Add tests to verify organization isolation
   - Test with multiple organizations to ensure data separation

## Pattern for Fixes

For each service method, follow this pattern:

```typescript
// Get organization_id from auth context
const { data: user } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('users')
  .select('organization_id')
  .eq('id', user?.user?.id)
  .single()

if (!profile?.organization_id) {
  throw new Error('Organization not found')
}

// Include in queries
const query = supabase
  .from('table_name')
  .select('*')
  .eq('organization_id', profile.organization_id)
```

For updates/deletes, verify ownership first:

```typescript
// Verify resource belongs to organization
const { data: existing } = await supabase
  .from('table_name')
  .select('organization_id')
  .eq('id', resourceId)
  .single()

if (existing?.organization_id !== profile.organization_id) {
  throw new Error('Unauthorized')
}
```