# Project Progress & Context: Dosewell ("Aura flux")

> **Note for AI Agents**: Read this document first to get full context on the application, tech stack, architecture, established conventions, and current status without starting from scratch.

---

## 1. Project Overview

- **App Name**: Dosewell (Health routine & prescription organizer)
- **Repo Directory**: `c:\Users\KGR\Desktop\Aura flux`
- **Origin**: Figma Make React export (`MedicineReminderApp-main.zip` in root)
- **Primary Goal**: Help users track, organize, and adhere to prescription routines with:
  - Secure user authentication via Supabase Auth (Sign in, Sign up, Email verification, Password reset, Persistent sessions).
  - Daily schedule timelines and dose logging (taken / skipped / pending).
  - Multilingual voice companion supporting English, Telugu, and Hindi.
  - Medicine management (frequency, dosage, timing, food instructions).
  - Reference medicine library with medical links.

---

## 2. Technology Stack & Key Dependencies

| Layer | Technology | Details |
|---|---|---|
| **Runtime** | Node.js v22.14.0 | User directory: `%LOCALAPPDATA%\Programs\nodejs` |
| **Package Manager** | npm 10.9.2 | Dependencies installed in `node_modules` |
| **Framework** | React 19 + React DOM 19 | Functional components with hooks (`useState`, `useRef`, `useEffect`) |
| **Authentication** | Supabase Auth (`@supabase/supabase-js` v2.117+) | Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| **Routing** | React Router v7 (`react-router`) | `createBrowserRouter` + `RouterProvider` with `useLocation`, `useNavigate` |
| **Build Tooling** | Vite 8 + `@vitejs/plugin-react` | Strict port 8443 by default |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Configured via `@import "tailwindcss";` in `src/index.css` |
| **Icons** | Lucide React (`lucide-react`) | Feather-derived icon set |
| **Language** | TypeScript 5.7 | Bundler resolution, strict mode, zero build errors |

---

## 3. Directory & File Sitemap

```
Aura flux/
├── index.html                   # Vite HTML entry shell with Figma placeholder slots
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript bundler compiler options & path aliases
├── tsconfig.node.json           # Isolated TypeScript config for vite.config.ts
├── vite.config.ts               # Vite configuration + Figma Make plugins
├── .env                         # Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
├── .gitignore                   # Git ignore rules (includes .env, node_modules, dist)
├── .mise.toml                   # Toolchain version specifiers (Node 22, pnpm)
├── progress.md                  # Context and architecture documentation (this file)
├── public/                      # Static assets
│   └── fonts/                   # Local TrueType fonts for Indic languages
│       ├── noto-hindi-bold.ttf
│       ├── noto-hindi-regular.ttf
│       ├── noto-telugu-bold.ttf
│       └── noto-telugu-regular.ttf
└── src/
    ├── main.tsx                 # React entry point mounting <App /> into #root
    ├── index.css                # Global CSS (imports fonts.css, tailwindcss, theme.css)
    ├── App.tsx                  # Root forwarding export: `export { default } from "./app/App"`
    ├── vite-env.d.ts            # Client-side Vite environment types (including VITE_SUPABASE_*)
    ├── lib/
    │   ├── supabase.ts          # Singleton Supabase client initialized with env vars
    │   └── AuthContext.tsx      # AuthProvider, useAuth hook, auth state change listener, actions
    ├── styles/
    │   ├── fonts.css            # Google Fonts (DM Sans, Manrope) + @font-face rules
    │   └── theme.css            # CSS variables & @theme inline design tokens
    └── app/
        ├── App.tsx              # Main dashboard view, auth guards, router definition, modals & state
        ├── AuthScreen.tsx       # Supabase Auth UI (Sign In, Sign Up, Verify, Forgot Password, Reset Password)
        ├── AppShell.tsx         # Layout wrapper component with responsive sidebar grid
        ├── Sidebar.tsx          # Navigation sidebar with links, counters, user profile & logout
        ├── VoiceCompanion.tsx   # Multilingual speech synthesis & recognition assistant (~40KB)
        └── prescription.ts      # Core TypeScript models, sample data, and date/dose helpers
```

---

## 4. Key Architectural Patterns & Data Models

### A. Authentication & Session Management (`src/lib/AuthContext.tsx` & `src/app/AuthScreen.tsx`)
- **Source of Truth**: Supabase Auth (`@supabase/supabase-js`).
- **Configuration**: Credentials read exclusively from `.env` via `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`.
- **Security Rule**: No service-role / secret key in frontend code under any circumstance.
- **Session Persistence**: Initial session checked via `supabase.auth.getSession()`; dynamic session updates handled via `supabase.auth.onAuthStateChange()`.
- **Supported Auth Flows**:
  1. **Email / Password Sign In**: `signInWithPassword(email, password)` with error handling.
  2. **Email Sign Up**: `signUp(email, password, fullName)` passing `user_metadata`.
  3. **Email Verification**: Dedicated verification notice screen with countdown timer and `resendVerificationEmail(email)` option.
  4. **Password Reset (Forgot Password)**: `resetPasswordForEmail(email)` sends a secure magic link.
  5. **Password Update (Recovery Flow)**: Triggered by `PASSWORD_RECOVERY` auth event or `#type=recovery` URL hash to prompt the user to input and save a new password.
  6. **Logout / Sign Out**: `signOut()` callable from Sidebar, Profile modal, and Settings page.
- **Auth Guard**: Unauthenticated users are presented with `<AuthScreen />`; authenticated users access `<Dashboard />` immediately.

### B. Data Schema (`src/app/prescription.ts`)
- **`Medicine`**:
  - `id`: string (UUID or incremental ID)
  - `name`: string (e.g., "Metformin", "Vitamin D3")
  - `type`: "Tablet" | "Capsule" | "Syrup" | "Injection" | "Drops" | "Cream" | "Other"
  - `dosage`: string (e.g. "1 tablet")
  - `frequency`: "Once a day" | "Twice a day" | "Three times a day" | "Four times a day" | "Every X hours" | "Specific times" | "Certain days of the week" | "Custom schedule"
  - `times`: string[] (24h format HH:mm, e.g., `["08:00", "20:00"]`)
  - `foodInstruction`: "Before food" | "After food" | "With food" | "On an empty stomach" | "Any time"
  - `startDate`, `endDate`, `instructions`, `notes`, `active`, `color`
- **`DoseRecord`**:
  - `status`: `"taken"` | `"skipped"`
  - `timestamp`: ISO timestamp string
- **`ScheduledDose`**: Computed on the fly via `getDosesForDate(medicines, date, doseRecords)`. Dose ID key pattern: `${dateKey}_${medicineId}_${time}`.

### C. Persistence (`localStorage`)
- Storage key: `dosewell-v1`
- Handles automatic migration from legacy structures (e.g., legacy `taken` string array into `doseRecords`).

### D. Multilingual Voice Companion (`src/app/VoiceCompanion.tsx`)
- Supports 3 languages:
  1. `en-IN` (English - India)
  2. `te-IN` (Telugu)
  3. `hi-IN` (Hindi)
- Utilizes browser Web Speech APIs:
  - Synthesis: `window.speechSynthesis` and `SpeechSynthesisUtterance`
  - Recognition: `webkitSpeechRecognition` or `SpeechRecognition`
- Voice actions handled:
  - Reading upcoming unrecorded doses
  - Reading the complete daily prescription schedule
  - Confirming and logging dose intake via voice or button confirmation

### E. Routing (`src/app/App.tsx`)
Uses React Router v7 routes:
- `/` -> Overview dashboard (stats, upcoming dose, timeline)
- `/medicines` -> Medicine inventory list and management
- `/schedule` -> Date-filtered schedule with day navigation
- `/library` -> Medication information reference guide
- `/settings` -> User preferences, reminders, account & profile

---

## 5. Development & Verification Commands

Because Windows PowerShell execution policies may restrict `.ps1` wrapper scripts, **always invoke `.cmd` binaries** or prefix with the node path:

```powershell
# Set Node into environment Path (if in a new shell session):
$env:Path = "$env:LOCALAPPDATA\Programs\nodejs;$env:Path"

# Typecheck code (strict verification)
npx.cmd tsc --noEmit

# Start Vite dev server locally
npm.cmd run dev

# Build production bundle
npm.cmd run build

# Preview production build
npm.cmd run preview
```

---

## 6. Recent Fixes & Completed Work

1. **Supabase Auth Integration**:
   - Installed and integrated `@supabase/supabase-js`.
   - Created `src/lib/supabase.ts` singleton client reading `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`.
   - Created `src/lib/AuthContext.tsx` providing complete Auth Context with persistent session synchronization.
   - Built modern, accessible `src/app/AuthScreen.tsx` with email login, signup, email verification notice, forgot password, and reset password flows.
   - Connected `Sidebar.tsx`, Header avatar, Profile modal, and Settings page to live Supabase session with dynamic user initials and one-click Sign out.
   - Guarded all dashboard views: unauthenticated visitors stay on AuthScreen until authenticated.

2. **TypeScript & Build Health**:
   - `npx.cmd tsc --noEmit` -> **0 errors**.
   - `npm.cmd run build` -> **0 warnings, 0 errors** (built cleanly in ~2.6s).

---

## 7. Guidelines for Future AI Agents

- **Supabase Auth**: Always use `useAuth()` from `src/lib/AuthContext.tsx`. Never hardcode API keys or secret credentials.
- **Tailwind CSS v4**: Do NOT create a `tailwind.config.js`. Tailwind v4 config is handled via `@theme inline` in `src/styles/theme.css` and imported into `src/index.css`.
- **Imports**: All source imports should map cleanly using the `@/` alias mapped to `./src/*` or relative paths. Do NOT append `.ts` or `.tsx` to import paths.
- **Routing**: `react-router` v7 exports `createBrowserRouter`, `RouterProvider`, `NavLink`, `useLocation`, and `useNavigate` directly from `"react-router"`.
- **State Integrity**: When modifying `App.tsx`, preserve the `localStorage` key `dosewell-v1` format so existing user prescriptions and dose logs are not wiped out.
