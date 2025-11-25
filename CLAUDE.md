# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CIVENI USA Celebration Site is a multilingual event management platform for international conferences. Built with React + TypeScript + Vite, it features a public-facing website and comprehensive admin dashboard with Stripe payment integration, certificate generation, and live streaming capabilities.

**Tech Stack**: React 18, TypeScript, Vite, Supabase (PostgreSQL + Edge Functions + Storage), Tailwind CSS, shadcn/ui, Stripe, i18next

**Live Environment**: Production deployment on cPanel with Apache

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Development server (runs on port 8080)
npm run dev

# Production build
npm run build

# Production build (development mode)
npm run build:dev

# Linting
npm run lint

# Preview production build locally
npm preview
```

### Supabase Local Development
```bash
# Start local Supabase (requires Docker)
supabase start

# Stop local Supabase
supabase stop

# Deploy Edge Functions
supabase functions deploy <function-name>

# View function logs
supabase functions logs <function-name>
```

### Build for cPanel Deployment
```bash
# Create production build with security headers
./build-cpanel.sh

# Alternative Python-based ZIP creation
python3 create-cpanel-zip.py
```

This generates `civeni-saas-cpanel.zip` ready for cPanel upload.

## Architecture Overview

### Frontend Architecture

**Provider Hierarchy** (from outer to inner):
1. `QueryClientProvider` - TanStack Query for data fetching
2. `I18nextProvider` - Internationalization (pt, en, es, tr)
3. `TooltipProvider` - UI tooltips
4. `SecurityProvider` - CSRF tokens, rate limiting, input sanitization
5. `CMSProvider` - Content Management System context (speakers, banners, events, videos)

**Key Context**: `CMSContext` (`src/contexts/CMSContext.tsx`)
- Central source of truth for all CMS content (speakers, banners, event config, partners, videos, schedules)
- Loads data from Supabase on mount and provides CRUD operations
- Uses admin mode detection (`/admin` path) to show active-only vs all content
- Methods: `updateSpeakers`, `updateBannerSlides`, `updateEventConfig`, `updateVideos`, etc.
- Auto-handles image uploads to Supabase Storage when base64 data URLs are provided

### Backend Architecture (Supabase)

**Database**: PostgreSQL with Row Level Security (RLS) policies
- Admin operations use secure RPCs with email + session_token validation
- Public operations have restricted RLS policies
- Most admin functions require `user_email` and `session_token` parameters

**Edge Functions** (TypeScript/Deno in `supabase/functions/`):
- Payment processing: `create-registration-payment`, `verify-payment`, `stripe-webhook`
- Certificate management: `issue-certificate`, `verify-certificate`, `send-certificate-email`
- Financial analytics: `finance-kpis`, `finance-series`, `finance-breakdown`, `finance-charges`, etc.
- Submissions: `submit-work`, `submit-video`, `submit-partner-application`
- Admin tools: `admin-list-users`, `delete-customer-registrations`, `sync-category-stripe`
- Document generation: `generate-programacao-pdf`, `download-submissao`, `download-submissao-docx`

**Storage Buckets**:
- `site-civeni`: Public bucket for speakers, banners, video thumbnails, uploads
- Auto-versioning for images using `photo_version` and `image_version` columns

### Admin System

**Authentication**: Custom admin auth via `useAdminAuth` hook
- Session stored in localStorage with expiration
- Server-side role validation via `check_user_role_secure` RPC
- User types: `admin_root`, `admin`, `editor`, `viewer`, `design`
- All admin mutations require email + session_token

**Admin Dashboard** (`src/pages/AdminDashboard.tsx`):
- Comprehensive management interface for all site content
- Managers for: Speakers, Banners, Events, Schedules, Registrations, Certificates, Videos, Partners, Submissions, Financial Analytics
- Stripe integration for payment tracking and revenue analytics
- Real-time financial dashboard with charts (Recharts library)

**Permission System**: Role-based via `hasPermission(resource)` method in admin auth context

### Security Implementation

**Critical**: This application has extensive security features (see `SECURITY.md`)

**Frontend Protections**:
- `SecurityProvider` component manages CSRF tokens and rate limiting
- `SecureForm` wrapper for all forms with automatic sanitization
- `securityValidator` class for input validation (email, phone, URLs, text)
- Anti-tampering detection (`src/utils/antiTampering.ts`)
- DOMPurify for HTML sanitization (`src/utils/sanitizeHtml.ts`)

**Backend Protections**:
- Database triggers for input sanitization
- SQL injection detection
- RLS policies on all tables
- Session token validation for admin operations

**HTTP Headers** (configured in `.htaccess` and `public/_headers`):
- CSP, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy
- HTTPS redirect enforced
- Cache control for static assets vs. dynamic pages

### Internationalization (i18n)

**Supported Languages**: Portuguese (default), English, Spanish, Turkish

**Implementation**:
- i18next with browser language detection
- Translation files in `src/i18n/locales/` (pt.ts, en.ts, es.ts, tr.ts)
- Database fields have language suffixes: `title`, `title_en`, `title_es`, `title_tr`
- `LanguageSelector` component in admin for switching languages
- Locale persisted in localStorage

### Stripe Integration

**Payment Flow**:
1. User selects registration category/type
2. Frontend calls `create-registration-payment` Edge Function
3. Stripe Checkout Session created
4. User redirected to Stripe
5. Webhook (`stripe-webhook`) handles payment events
6. Registration record created/updated in database
7. Confirmation email sent via `send-registration-confirmation`

**Financial Dashboard** (`src/components/admin/FinancialDashboard.tsx`):
- Real-time revenue tracking
- Payment breakdown by category, brand, time series
- Participant analytics
- Funnel conversion tracking
- Uses finance-* Edge Functions for data aggregation

### Certificate System

**Generation Flow**:
1. User requests certificate via `/certificado-emissao` or event-specific page
2. `issue-certificate` Edge Function generates PDF
3. Certificate stored in database with unique verification code
4. Email sent with certificate attachment and verification link
5. Public verification via `/certificados/verify/:code`

**Templates**: Configurable via `CertificateManager` in admin dashboard
**Translations**: Multi-language support via `translate-certificate` function

### Image Handling

**Upload Pattern**:
1. User selects image in admin (file input or drag-drop)
2. File converted to base64 data URL in frontend
3. On save, CMSContext detects data URLs
4. Uploads to Supabase Storage (`site-civeni` bucket)
5. Replaces data URL with public URL
6. Saves public URL to database

**Versioning**: Images use `photo_version` or `image_version` for cache busting

**Hooks**:
- `useSpeakerImage`, `useFixedSpeakerImage`, `useVersionedImage` - Handle image loading with fallbacks

### Live Streaming

**Transmission System** (`src/pages/TransmissaoAoVivo.tsx`):
- YouTube Live integration
- Multiple stream support
- Schedule management
- FAQ section
- Real-time countdown timers

**Components**:
- `LivePlayer` - YouTube embed with controls
- `SessionCard` - Displays session info with timezone conversion
- `TransmissionAgenda` - Shows schedule with filtering

### Schedule/Programming System

**Two Formats**:
1. **In-Person** (`civeni_program_days` + `civeni_program_sessions`) - Managed via `CiveniProgramManager`
2. **Online** (`civeni_online_program_days` + `civeni_online_program_sessions`) - Managed via `CiveniOnlineProgramManager`

**Features**:
- Day-based organization
- Time slots with timezone support (date-fns-tz)
- Speaker associations
- Room assignments
- Session types (keynote, panel, workshop, etc.)

### Registration System

**Types**:
- In-Person (`/inscricao-presencial`)
- Online (`/inscricao-online`)

**Configuration**:
- Categories (student, professional, partner) - managed via `EventCategoriesManager`
- Batches (early bird, regular, late) - managed via `BatchManager`
- Lotes (pricing tiers within batches) - managed via `LotesManager`
- Coupons - managed via `CouponManager`

**Form Fields**: Dynamic based on category (VCCU students have additional fields)

## Important File Patterns

### Supabase Integration
- Client initialization: `src/integrations/supabase/client.ts`
- Type definitions: `src/integrations/supabase/types.ts` (auto-generated)
- Never modify types.ts manually - regenerate from Supabase schema

### Component Structure
- Pages: `src/pages/` - Route components
- Admin components: `src/components/admin/` - Dashboard managers
- UI components: `src/components/ui/` - shadcn/ui primitives
- Feature components: `src/components/` - Reusable feature components

### Hooks Pattern
- Custom hooks in `src/hooks/`
- Naming: `use[Feature].ts` or `use[Feature]Data.ts`
- Many hooks use TanStack Query (`useQuery`, `useMutation`)
- Example: `useEvents`, `useSpeakers`, `useScheduleData`, `useStripeDashboard`

### Utils
- `src/utils/` - Utility functions
- Security: `securityValidation.ts`, `sanitizeHtml.ts`, `antiTampering.ts`
- Images: `imageUtils.ts`, `imageOptimization.ts`, `imageCacheUtils.ts`
- Misc: `scheduleUtils.ts`, `registrationUtils.ts`, `countryFlags.ts`

### Admin RPC Calls
When calling admin functions, always include:
```typescript
const sessionRaw = localStorage.getItem('adminSession');
const parsed = JSON.parse(sessionRaw);
const sessionEmail = parsed?.user?.email;
const sessionToken = parsed?.session_token;

await supabase.rpc('admin_function_name', {
  // ... other params
  user_email: sessionEmail,
  session_token: sessionToken
});
```

### Image Upload Pattern
```typescript
// Convert file to data URL
const reader = new FileReader();
reader.onload = (e) => {
  const dataUrl = e.target?.result as string;
  // Set to state - CMSContext will handle upload on save
  setSpeaker({ ...speaker, image: dataUrl });
};
reader.readAsDataURL(file);
```

## Common Development Tasks

### Adding a New Admin Manager
1. Create component in `src/components/admin/[Feature]Manager.tsx`
2. Add to admin sidebar in `src/components/admin/sidebar/menuItems.ts`
3. Add to `AdminTabs.tsx` if tab-based
4. Implement CRUD operations using Supabase client
5. Add RPC functions in Supabase if admin-only operations needed

### Adding a New Edge Function
1. Create in `supabase/functions/[function-name]/index.ts`
2. Add configuration in `supabase/config.toml`
3. Deploy: `supabase functions deploy [function-name]`
4. Set environment variables in Supabase dashboard if needed

### Adding Translations
1. Add keys to all locale files in `src/i18n/locales/`
2. Use `t()` function from `react-i18next`
3. For database content, add `_en`, `_es`, `_tr` columns
4. Update CMSContext interfaces if needed

### Modifying Security Headers
1. Update `.htaccess` for Apache (production)
2. Update `public/_headers` for Netlify/Vercel-like platforms
3. Update CSP in both files when adding new domains
4. Test thoroughly - overly restrictive CSP breaks functionality

## Deployment

### Production Deployment to cPanel
1. Run `./build-cpanel.sh` to create production build with security headers
2. Upload `civeni-saas-cpanel.zip` to cPanel File Manager
3. Extract to `public_html/` (or domain root)
4. Verify `.htaccess` is present and not overwritten
5. Test HTTPS redirect and all routes
6. Monitor Supabase Edge Function logs for errors

**Critical Files in Production**:
- `.htaccess` - Must be present for routing and security headers
- `service-worker.js` - PWA functionality
- `manifest.webmanifest` - PWA manifest
- `robots.txt` - SEO and security

### Environment Variables
Set in `.env` (local) or Supabase Edge Function secrets (production):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY` (Edge Functions only)
- `STRIPE_WEBHOOK_SECRET` (Edge Functions only)

## Testing Checklist

### Before Deployment
- [ ] All admin CRUD operations work
- [ ] Stripe payment flow completes
- [ ] Certificate generation and email delivery
- [ ] Image uploads save correctly
- [ ] Multi-language switching works
- [ ] Security headers present in build
- [ ] Service Worker registers correctly
- [ ] Forms validate and sanitize input
- [ ] All Edge Functions respond correctly

### After Deployment
- [ ] HTTPS redirect active
- [ ] All routes resolve (no 404s)
- [ ] Admin login works
- [ ] Public pages load correctly
- [ ] Assets (CSS/JS/images) load
- [ ] No CSP violations in console
- [ ] PWA installable on mobile

## Known Issues & Gotchas

1. **Image Caching**: Browser aggressively caches images. Use versioning (`photo_version`) or append timestamps to URLs for cache busting.

2. **CMSContext Loading**: Components using `useCMS()` may receive stale data. Listen for `forceContentReload` event or check `loading` state.

3. **Admin Session**: Sessions expire after set time. Check `localStorage.getItem('adminSession')` expiry before admin operations.

4. **Stripe Webhooks**: Must be configured in Stripe Dashboard to point to your Edge Function URL. Use webhook signing secret for validation.

5. **RLS Policies**: If queries fail with permission errors, check RLS policies in Supabase. Admin functions should use RPC functions that bypass RLS with validation.

6. **TypeScript Errors**: If `types.ts` is out of sync, regenerate from Supabase schema. Don't manually edit auto-generated files.

7. **Service Worker**: Changes to service worker require cache clearing. Users may see old version until SW updates.

## Project-Specific Conventions

- **Dates**: Use ISO format `YYYY-MM-DD` for dates. Convert for display using `date-fns`.
- **Timezones**: Schedule system uses America/New_York. Convert for display using `date-fns-tz`.
- **IDs**: UUIDs for all database records. Frontend may use temporary IDs (`temp-[timestamp]`) before save.
- **Image Paths**: Never store relative paths in database. Use full public URLs or Supabase Storage URLs.
- **Admin Functions**: Prefix RPC functions with `admin_` if they require elevated permissions.
- **Error Handling**: Use `toast` (sonner) for user-facing errors. Log to console for debugging.

## References

- **Supabase Project**: https://supabase.com/dashboard/project/wdkeqxfglmritghmakma
- **Deployment Guide**: `deploy-instructions.md`
- **Security Guide**: `SECURITY.md`
- **Build Script**: `build-cpanel.sh`
