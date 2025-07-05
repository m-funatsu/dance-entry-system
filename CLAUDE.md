# Claude Code Project Configuration

This file contains important information for Claude Code when working on this dance entry management system.

## Project Overview

This is a Next.js 15 application for managing dance competition entries, built with:
- **Framework**: Next.js 15.3.5 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## Development Commands

### Essential Commands
```bash
# Start development server
npm run dev

# Build for production (ALWAYS run before committing major changes)
npm run build

# Run linting (ALWAYS run before committing)
npm run lint

# Start production server
npm run start
```

### Git Workflow
```bash
# Check status
git status

# Add all changes
git add -A

# Commit with descriptive message
git commit -m "Description of changes"

# Push to remote
git push
```

## Important Build Requirements

### CRITICAL: Always run before committing
1. **`npm run build`** - Ensures TypeScript compilation and lint checks pass
2. **`npm run lint`** - Catches ESLint violations that will fail Vercel builds

### Common Build Errors and Fixes

1. **Unused Variables**: Remove or prefix with underscore (`_variable`)
2. **HTML Links**: Use `<Link>` from `next/link` instead of `<a>` tags for internal navigation
3. **TypeScript `any`**: Replace with proper types or `Record<string, unknown>`
4. **Images**: Use `<Image>` from `next/image` instead of `<img>` tags
5. **React Hooks**: Wrap functions in `useCallback` when used in dependency arrays

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   ├── register/      # Registration page
│   │   └── logout/        # Logout route
│   ├── dashboard/         # User dashboard
│   │   ├── entry/         # Entry form
│   │   ├── status/        # Entry status
│   │   └── upload/        # File upload
│   ├── admin/             # Admin panel
│   │   ├── dashboard/     # Admin dashboard
│   │   └── entries/       # Entry management
│   └── page.tsx           # Home page
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client configurations
│   ├── types.ts          # TypeScript type definitions
│   ├── utils.ts          # Utility functions
│   └── storage.ts        # File storage functions
└── middleware.ts          # Next.js middleware for auth
```

## Key URLs

- **Home**: `/`
- **Login**: `/auth/login`
- **Register**: `/auth/register`
- **Admin Register** (dev only): `/auth/admin-register`
- **User Dashboard**: `/dashboard`
- **Admin Dashboard**: `/admin/dashboard`
- **File Upload**: `/dashboard/upload`
- **Entry Management**: `/admin/entries`

## Environment Variables

Required for deployment:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Code Standards

### TypeScript
- Use proper types instead of `any`
- Define interfaces for component props
- Use `Record<string, unknown>` for generic objects

### React Components
- Use `useCallback` for functions in useEffect dependencies
- Import `Link` from `next/link` for navigation
- Import `Image` from `next/image` for images

### Error Handling
- Remove unused error parameters in catch blocks: `catch { ... }` instead of `catch (error) { ... }`
- Handle async operations properly with try/catch

### Next.js 15 Specific
- `cookies()` function is async - use `await cookies()`
- `createClient()` from server.ts is async - use `await createClient()`

## Database Schema

### Users Table
- `id` (UUID, primary key)
- `email` (text, unique)
- `name` (text)
- `role` (text: 'participant' | 'admin')

### Entries Table
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `dance_style` (text)
- `team_name` (text, optional)
- `participant_names` (text)
- `status` (text: 'pending' | 'submitted' | 'selected' | 'rejected')

### Entry Files Table
- `id` (UUID, primary key)
- `entry_id` (UUID, foreign key)
- `file_type` (text: 'music' | 'audio' | 'photo' | 'video')
- `file_path` (text)
- `file_name` (text)

## Common Issues and Solutions

### Vercel Build Failures
1. **ESLint errors**: Run `npm run lint` locally first
2. **TypeScript errors**: Run `npm run build` locally first
3. **Environment variables**: Ensure all required env vars are set in Vercel

### Authentication Issues
- Check Supabase configuration
- Verify environment variables
- Ensure middleware is working correctly

### File Upload Issues
- Check Supabase storage bucket configuration
- Verify file permissions and policies

### Null Reference Errors
- Always use optional chaining (`?.`) when accessing nested properties
- Provide fallback values: `entry.users?.name || 'Unknown User'`
- Check for null/undefined before mapping arrays

### Database Relationship Issues
- Ensure foreign key relationships are properly set up
- Use LEFT JOIN in Supabase queries when related data might not exist
- Handle cases where related records might be deleted
- If Supabase joins fail, manually fetch and map related data:
  ```typescript
  const users = await supabase.from('users').select('*')
  const entriesWithUsers = entries.map(entry => ({
    ...entry,
    users: users.find(u => u.id === entry.user_id)
  }))
  ```

## Testing

Before any major changes:
1. Test authentication flow
2. Test file upload functionality
3. Test admin panel access
4. Verify responsive design

## Deployment Notes

- **Platform**: Vercel
- **Auto-deployment**: Enabled on main branch
- **Build command**: `npm run build`
- **Environment**: Production environment variables must be set in Vercel dashboard

## Development Best Practices

1. **Always test locally** before committing
2. **Run build and lint** before pushing
3. **Use proper TypeScript types**
4. **Follow Next.js conventions**
5. **Handle errors gracefully**
6. **Keep components focused and reusable**
7. **Use semantic commit messages**

## Troubleshooting Commands

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules && npm install

# Check for outdated packages
npm outdated

# Update packages
npm update
```

Remember: This is a production application handling user data and file uploads. Always prioritize security, proper error handling, and user experience.