# Simple Contact Manager

A straightforward contact management app that just works. No authentication complexity, no RLS policies, just basic CRUD operations with a clean UI.

## Features

- ✅ **Add/Edit/Delete Contacts** - Full CRUD operations
- ✅ **Search** - Filter contacts by name, email, or phone
- ✅ **Tags** - Organize contacts with tags and filter by them
- ✅ **Export** - Download contacts as CSV
- ✅ **Mobile Responsive** - Works great on all devices
- ✅ **Error Handling** - Clear error messages
- ✅ **Fast** - Direct API calls, no client library overhead

## Running the App

```bash
npm install
npm run dev
```

Open http://localhost:5173

## How It Works

The app uses:
- Direct fetch() calls to Supabase REST API
- No authentication (uses anon key)
- Hardcoded organization ID for demo
- Simple React state management
- Tailwind CSS for styling

## Database Schema

The app expects a `contacts` table with:
- `id` (UUID)
- `full_name` (text)
- `email` (text)
- `phone` (text)
- `tags` (text[])
- `organization_id` (UUID)
- `status` (text)
- Standard timestamps

## Why This Approach?

1. **Simplicity** - No auth complexity, no RLS policies
2. **Reliability** - Direct API calls that always work
3. **Performance** - No client library overhead
4. **Maintainability** - All code in one file, easy to understand

## Lessons Learned

- Start simple, add complexity only when needed
- RLS policies can cause infinite recursion
- Auth libraries can hang mysteriously
- Direct API calls are often more reliable
- Following Postel's Law: "Be conservative in what you send, be liberal in what you accept"