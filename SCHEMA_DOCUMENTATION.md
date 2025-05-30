# Contact Manager PWA - Database Schema Documentation

## ⚠️ CRITICAL: Field Naming Conventions

### Contacts Table - USES `full_name` NOT `first_name`/`last_name`

**IMPORTANT**: The contacts table uses a single `full_name` field. There are NO `first_name` or `last_name` fields!

```sql
-- ✅ CORRECT
INSERT INTO contacts (full_name, email, phone) 
VALUES ('John Doe', 'john@example.com', '+1234567890');

-- ❌ WRONG - THESE FIELDS DON'T EXIST
INSERT INTO contacts (first_name, last_name, email) 
VALUES ('John', 'Doe', 'john@example.com');
```

### Events Table - USES `start_time`/`end_time` NOT `event_date`

**IMPORTANT**: The events table uses `start_time` and `end_time` fields. There is NO `event_date` field!

```sql
-- ✅ CORRECT
INSERT INTO events (name, start_time, end_time) 
VALUES ('Meeting', '2025-05-30 14:00:00', '2025-05-30 15:00:00');

-- ❌ WRONG - THIS FIELD DOESN'T EXIST
INSERT INTO events (name, event_date) 
VALUES ('Meeting', '2025-05-30');
```

## Core Tables Reference

### contacts
```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    full_name TEXT NOT NULL,  -- ⚠️ NOT first_name/last_name!
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    source TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    engagement_score INTEGER DEFAULT 0,
    last_contact_date TIMESTAMPTZ,
    total_events_attended INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### events
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,  -- ⚠️ NOT event_date!
    end_time TIMESTAMPTZ,            -- ⚠️ NOT event_date!
    capacity INTEGER,
    event_type TEXT,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    registration_required BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,  -- ⚠️ Consistent with contacts!
    phone TEXT,
    role TEXT DEFAULT 'viewer',
    settings JSONB DEFAULT '{}',
    last_active TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## TypeScript Types

Make sure your TypeScript types match the database schema:

```typescript
// ✅ CORRECT
interface Contact {
  id: string
  organization_id: string
  full_name: string  // NOT first_name/last_name!
  email?: string
  phone?: string
  // ...
}

// ✅ CORRECT
interface Event {
  id: string
  organization_id: string
  name: string
  start_time: string  // NOT event_date!
  end_time?: string   // NOT event_date!
  // ...
}
```

## Common Mistakes to Avoid

1. **DON'T** use `first_name` or `last_name` in contacts - use `full_name`
2. **DON'T** use `event_date` in events - use `start_time` and `end_time`
3. **DON'T** split names in the UI and try to save as separate fields
4. **DON'T** assume PostgreSQL naming conventions - check the actual schema

## Migration from Old Schema

If you have code using the old field names:

```javascript
// Old code (WRONG)
const contact = {
  first_name: 'John',
  last_name: 'Doe'
}

// New code (CORRECT)
const contact = {
  full_name: 'John Doe'
}

// Old code (WRONG)
const event = {
  event_date: '2025-05-30'
}

// New code (CORRECT)
const event = {
  start_time: '2025-05-30T14:00:00Z',
  end_time: '2025-05-30T15:00:00Z'
}
```

## Scripts and Seeds

When creating demo data or setup scripts, always use the correct field names:

```javascript
// ✅ CORRECT setup script
const contacts = [
  { full_name: 'John Doe', email: 'john@example.com' },
  { full_name: 'Jane Smith', email: 'jane@example.com' }
]

const events = [
  { 
    name: 'Meeting', 
    start_time: new Date('2025-05-30T14:00:00').toISOString(),
    end_time: new Date('2025-05-30T15:00:00').toISOString()
  }
]
```

## Quick Reference

| Table | WRONG Fields ❌ | CORRECT Fields ✅ |
|-------|----------------|------------------|
| contacts | first_name, last_name | full_name |
| events | event_date | start_time, end_time |
| users | first_name, last_name | full_name |

## Always Check the Schema!

When in doubt, check the actual schema file: `supabase/schema.sql`

```bash
# Check contact fields
grep -A 10 "CREATE TABLE contacts" supabase/schema.sql

# Check event fields  
grep -A 10 "CREATE TABLE events" supabase/schema.sql
```