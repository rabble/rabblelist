# Contact Manager PWA

A Progressive Web App for managing contacts and tracking phone calls, built with React, TypeScript, and Supabase.

## 🚀 Features

- **Mobile-First Design**: Optimized for phone-based calling workflows
- **Offline Support**: Works without internet, syncs when connected
- **PWA Installable**: Install as a native app on any device
- **Role-Based Access**: Admin and Ringer user roles
- **Contact Management**: Import, organize, and track contact interactions
- **Call Logging**: Track call outcomes with notes
- **Multi-Organization**: Support for multiple isolated organizations
- **Real-time Sync**: Automatic data synchronization

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **PWA**: Vite PWA Plugin, Workbox
- **Offline**: IndexedDB, Service Workers

## 🏃‍♂️ Quick Start

### Demo Mode (No Setup Required)

1. Clone and install:
```bash
git clone <repo>
cd contact-manager-pwa
npm install
```

2. Run in demo mode:
```bash
./toggle-demo-mode.sh  # Switch to demo mode
npm run dev
```

3. Open http://localhost:5173 and login with any email/password

### Production Mode (With Supabase)

1. Set up the database:
```bash
# Copy the SQL from supabase/migrations/000_complete_setup.sql
# Run it in your Supabase SQL Editor
```

2. Create a user in Supabase Dashboard → Authentication → Users

3. Switch to production mode:
```bash
./toggle-demo-mode.sh  # Switch to Supabase mode
npm run dev
```

## 📱 User Guide

### For Ringers

1. **Login**: Use your email and password
2. **Contact Queue**: See your assigned contacts
3. **Make Calls**: Tap the phone number to call
4. **Log Outcomes**: Select Answered/Voicemail/No Answer
5. **Add Notes**: Optional notes for each call
6. **Navigate**: Use Previous/Next or swipe between contacts
7. **Offline Mode**: Continue working without internet

### For Admins

1. **Dashboard**: View organization statistics
2. **Manage Contacts**: Import CSV files, add/edit contacts
3. **Manage Ringers**: Create user accounts, assign contacts
4. **Events**: Create and manage events
5. **Reports**: View calling statistics and performance

## 🔧 Configuration

### Environment Variables

Create `.env.local`:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Schema

The app uses these main tables:
- `organizations`: Multi-tenant support
- `users`: User accounts with roles
- `contacts`: Contact information
- `call_logs`: Call history
- `events`: Event management
- `call_assignments`: Contact-to-ringer assignments

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
vercel --prod
```

### Deploy to Netlify

```bash
netlify deploy --prod --dir dist
```

## 🔒 Security

- Row Level Security (RLS) on all tables
- Organization-based data isolation
- Role-based access control
- Secure authentication with Supabase Auth

## 🧪 Testing

### Manual Testing
- PWA installation on mobile devices
- Offline functionality
- Cross-browser compatibility
- Performance on 3G networks

### Lighthouse Scores
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 95
- SEO: > 90
- PWA: ✓

## 📄 License

MIT License - feel free to use for your organization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🐛 Troubleshooting

### "Invalid login credentials"
- In demo mode: Any email/password works
- In Supabase mode: User must exist in Supabase Auth

### No contacts showing
- Check that test data was inserted
- Verify user's organization_id matches contacts
- Check browser console for errors

### PWA not installing
- Must be served over HTTPS (or localhost)
- Check that manifest.json is loading
- Verify service worker registration

## 📞 Support

For issues or questions:
- Check the [setup guide](SETUP_USER.md)
- Review the [Supabase setup](README_SUPABASE.md)
- Open an issue on GitHub