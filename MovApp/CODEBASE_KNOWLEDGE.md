# MovApp — Codebase Knowledge

**Project**: Campus Parking ("Tu Espacio Tu Parqueo")
**Type**: Expo Go (React Native + TypeScript)
**SDK**: Expo 54, React 19, React Native 0.81.5
**Purpose**: Client-side valet parking app — users request valet drivers, track trips, manage their profile.

---

## Project Structure

```
MovApp/
├── App.tsx                  # Entry point — wraps app in DataProvider → AppNavigation
├── app.json                 # Expo config (name, colors, bundle IDs, EAS project)
├── package.json
├── tsconfig.json            # strict mode, expo/tsconfig.base
├── babel.config.js          # babel-preset-expo + reanimated plugin
├── src/
│   ├── screens/             # Full-screen views
│   ├── components/          # Reusable UI components
│   ├── hooks/               # React Context providers + hooks
│   ├── navigation/          # Navigator definitions
│   ├── constants/           # Theme, types, mock data, regex, translations
│   └── assets/              # Fonts, icons, images
└── assets/                  # Expo-level assets (splash, icon, adaptive-icon)
```

---

## Navigation

Three navigation files compose the navigation tree:

| File | Role |
|------|------|
| `src/navigation/App.tsx` | Root — loads fonts, applies theme/translation providers, controls splash |
| `src/navigation/Screens.tsx` | Stack navigator — Home, Articles, Profile, Register, Login |
| `src/navigation/Menu.tsx` | Drawer navigator — wraps Screens.tsx; menu items: Home, History, Profile, Settings |

**Drawer details**: slide type, 60% width, scale-down animation (0.88 scale on open), custom `DrawerContent` component.

**Header**: hamburger (left) + notification bell + user avatar (right). Auth screens (Login/Register) show a back button instead.

**Route names** (from stack):
- `Home`, `Articles` ("Ultimos Servicios"), `Profile`, `Login`, `Register`

---

## State Management

No Redux/Zustand. Uses **React Context API** via three providers, all composed in `DataProvider`:

### `useData` — `src/hooks/useData.tsx`
Primary app state. Provides:
- `user`, `users` — current user object and full user list
- `article`, `articles` — selected article and list
- `categories` — category list for filtering
- `isDark` — dark mode boolean (persisted to AsyncStorage)
- `handleIsDark()`, `handleUser()`, `handleUsers()`, `handleArticle()` — state setters with equality checks to avoid re-renders

### `useTheme` — `src/hooks/useTheme.tsx`
Provides the `theme` object (colors, sizes, fonts, gradients, assets/icons). Currently locked to light theme; dark mode toggle exists in `useData` but does not yet swap the theme.

### `useTranslation` — `src/hooks/useTranslation.tsx`
i18n via `i18n-js` + `expo-localization`. Supports `en` / `es`. Persists locale to AsyncStorage. Provides `t(key)` and `setLocale(locale)`.

---

## Theme & Styling

Defined in `src/constants/light.ts` and `src/constants/theme.ts`.

**Brand colors**:
- Primary: `#000066` (dark navy)
- Secondary: `#627594` (slate)
- Tertiary / Accent: `#E8AE4C` (gold)
- Background: `#E9ECEF`
- Text: `#252F40`

**Gradients** (arrays passed to LinearGradient):
- `primary`: `["#000066", "#155fe7"]`
- `danger`: `["#FF667C", "#EA0606"]`
- `success`: `["#98EC2D", "#17AD37"]`

**Spacing scale**: xs(8) → s(10) → sm(12) → m(16) → md(20) → l(24) → xl(32) → xxl(40) — all in px.

**Typography**: OpenSans family, loaded at startup via `expo-font`. Heading sizes h1(44)–h5(18), body 14px.

**Fonts loaded**: `OpenSans-Light`, `OpenSans-Regular`, `OpenSans-SemiBold`, `OpenSans-Bold`, `OpenSans-ExtraBold`.

---

## Component Library (`src/components/`)

All exported from `src/components/index.tsx`.

| Component | Purpose |
|-----------|---------|
| `Block` | Primary layout primitive — wraps View/ScrollView/SafeAreaView/KeyboardAwareScrollView/LinearGradient/BlurView based on props |
| `Button` | Touchable with gradient, outlined, social variants; haptic feedback via `expo-haptics` |
| `Text` | Typography with h1–h5, paragraph presets, gradient text support via MaskedView |
| `Input` | Labeled text field with icon, success/danger state |
| `Checkbox` | Animated pressable with gradient fill and haptic feedback |
| `Switch` | Animated toggle with haptic; `react-native-reanimated` driven |
| `Image` | RN Image wrapper with avatar, shadow, radius, background-image modes |
| `Modal` | Basic modal wrapper |
| `Article` | Card for article list items (category, description, user, location, rating) |
| `Product` | Product card (horizontal/vertical variants) |
| `GreetUser` | Home greeting banner ("Hola! Pablo Perez") |
| `ServiceRequest` | MapView at user's location + "Request Valet" button |
| `LatestTrips` | FlatList of recent trips; "Ver Todos" navigates to PastServicesList |
| `LookingForDriverMap` | MapView with 3 mock driver markers + animated keys icon overlay |
| `SearchingDrivers` | SVG animated visualization of driver search (reanimated rotating circle + car) |
| `PaginatedTrips` | Paginated trip history list |
| `CenteredContainer` | Centered wrapper with shadow and border radius |

---

## Screens (`src/screens/`)

| Screen | Route | Purpose |
|--------|-------|---------|
| `Home.tsx` | `Home` | Dashboard — GreetUser + LatestTrips + ServiceRequest (map) |
| `Articles.tsx` | `Articles` | Service history list with category filter tabs |
| `Profile.tsx` | `Profile` | User profile (avatar, stats, social links, photo grid) |
| `Settings.tsx` | — (drawer) | App settings (same layout as Profile) |
| `History.tsx` | — (drawer) | Past transactions (same layout as Profile) |
| `PastServicesList.tsx` | — | Paginated full trip history |
| `LookingForDriver.tsx` | — | Map view searching for available drivers |
| `Login.tsx` | `Login` | Login form — name, email, password, terms; social login buttons (UI only) |
| `Register.tsx` | `Register` | Register form — email, password, terms; social login buttons (UI only) |

---

## Authentication

**Status**: UI-only — no backend calls are wired yet.

**Login screen** validates: name (3–15 alpha chars), email (regex), password (min 6, requires digit + upper + lower).
On submit: logs values to console only.

**Register screen**: same validation pattern, same no-op submit.

**Backend auth endpoints** (from Flask backend — not yet integrated):
- `POST /autho/login` → returns `access_token` + user dict
- `POST /profile/register` → returns `access_token`
- JWT should be stored (likely AsyncStorage) and sent as `Authorization: Bearer <token>` header.

**Token storage**: Not implemented. Will need `@react-native-async-storage/async-storage` (already installed).

---

## Maps & Location

- Library: `react-native-maps`
- Location: `expo-location` with `requestForegroundPermissionsAsync()`
- Used in: `ServiceRequest` (shows user location) and `LookingForDriverMap` (shows user + 3 mock driver markers)

---

## Localization

- Library: `i18n-js` + `expo-localization`
- Languages: English (`en`), Spanish (`es`)
- Translation strings live in `src/constants/` (translation files per locale)
- Detected from device locale, overrideable, persisted to AsyncStorage
- Access via `const { t } = useTranslation()`

---

## Mock Data (`src/constants/mocks.ts`)

All data is currently mocked — no API calls exist:
- 6 user profiles with stats, social links, photos
- Valet user products and valet driver products
- Categories (for article filtering)
- Articles with locations, ratings, timestamps

---

## API Integration Status

**No HTTP client or API service layer exists yet.** To integrate with the Flask backend:

1. Create `src/services/api.ts` — configure a `fetch`/`axios` wrapper with base URL and JWT header injection
2. Replace mock data calls in `useData.tsx` with real API calls
3. Wire Login/Register form submits to `/autho/login` and `/profile/register`
4. Store JWT in AsyncStorage, attach to all authenticated requests
5. Backend base URL: configure via environment variable (use `expo-constants` or `.env` with `babel-plugin-dotenv`)

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` ~54 | Core Expo SDK |
| `react-navigation` v7 | Stack + Drawer navigation |
| `react-native-maps` | Google Maps integration |
| `expo-location` | Device GPS |
| `expo-linear-gradient` | Gradient UI |
| `expo-blur` | Blur effects |
| `expo-haptics` | Haptic feedback |
| `expo-font` | Custom font loading |
| `expo-localization` | Device locale detection |
| `react-native-reanimated` | Complex animations |
| `react-native-keyboard-aware-scroll-view` | Keyboard-safe forms |
| `@react-native-async-storage/async-storage` | Persistent storage |
| `i18n-js` | Translations |
| `dayjs` | Date formatting |
| `@expo/vector-icons` | Icon set |

---

## EAS / Build Config

- EAS project ID: `056b3869-1d03-4bb1-a4a5-9ebc1f031330`
- Owner: `latincrow81`
- Android package: `com.campusparking.campusparking`
- `eas.json` present for managed workflow builds

---

## Validation Regex (`src/constants/regex.ts`)

```ts
name:     /[a-zA-Z\ ]{3,15}/
email:    standard email pattern
password: requires digit + lowercase + uppercase, min 6 chars
```

---

## Current State Summary

| Area | Status |
|------|--------|
| UI / Screens | Complete (with mock data) |
| Navigation | Complete |
| Theming | Complete (light only) |
| Localization (EN/ES) | Complete |
| Dark mode toggle | UI exists, theme swap not wired |
| Maps / Location | Working (mock driver markers) |
| Authentication forms | UI complete, no API calls |
| Backend integration | Not started |
| Token management | Not implemented |
| Real trip/service data | Not implemented |