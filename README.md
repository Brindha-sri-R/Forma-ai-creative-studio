<<<<<<< HEAD
# Forma — Commercial AI Creative Studio

> **Transform prompts into high-resolution stills, cinematic motion, and brand assets in a unified full-stack creative suite.**

Forma is an AI-powered creative platform engineered for commercial creative directors, designers, and studios. It features text-to-image synthesis, text-to-video kinetic rendering, image-to-video motion studies, collection management, asset frame inspection, plan billing tiers, and complete credit accounting.

---

## Table of Contents
1. [Overview & Key Features](#overview--key-features)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Folder Structure](#folder-structure)
5. [Getting Started & Installation](#getting-started--installation)
6. [Environment Variables](#environment-variables)
7. [Database Architecture & Persistence](#database-architecture--persistence)
8. [REST API Documentation](#rest-api-documentation)
9. [AI Engine & Demo Mode](#ai-engine--demo-mode)
10. [Authentication & Security](#authentication--security)
11. [Testing & Verification](#testing--verification)
12. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 1. Overview & Key Features

- **Text-to-Image Studio**: High-resolution image synthesis with style selection (`Editorial`, `Minimal`, `Architectural`, `Monochrome`), aspect ratios (`1:1`, `4:5`, `16:9`, `9:16`), resolutions (`1K`, `2K`, `4K`), negative prompt exclusion, and multi-variation output.
- **Cinematic Video Studio**: Motion generation supporting both **Text-to-Video** and **Image-to-Video**, with camera movements (`Orbit`, `Slow Dolly`, `Lateral Pan`, `Static`), durations (`4s`, `8s`, `12s`), and frame rates (`24 fps`, `30 fps`).
- **Personal Creative Gallery**: Filter by asset type, search by prompt keywords or titles, bookmark favorites, rename, duplicate, and assign creations into custom project collections.
- **Credit & Plan Management**: Built-in transactional credit accounting (1 credit per image variation, 4 credits per video sequence). Multi-tier plan support (`Free` with 25 credits, `Pro` with 500 credits, `Studio` with 2,000 credits).
- **Asset Uploads & Reference Media**: Multipart file upload pipeline for reference imagery and videos with disk storage and cloud storage abstraction.
- **Responsive Commercial UI/UX**: Polished dark/light editorial theme, custom typography (`Inter` & `JetBrains Mono`), progressive image loading, skeleton loaders, and graceful empty states.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18, TypeScript
- **Bundler & Dev Server**: Vite 6
- **Styling**: Vanilla CSS Design Tokens (`tokens.css` & `global.css`) with CSS custom properties
- **Icons**: Lucide React
- **HTTP Client**: Native Fetch API with typed centralized client (`src/services/apiClient.ts`)

### Backend
- **Runtime**: Node.js v20+ (tested on Node v24)
- **Framework**: Express.js, TypeScript via `tsx`
- **Database**: MongoDB with Mongoose ODM + Resilient Zero-Config Persistence Engine
- **Authentication**: JWT (`jsonwebtoken`) with HMAC-SHA256 & `bcryptjs` password hashing
- **File Uploads**: Multer with memory & disk storage adapters
- **Process Orchestration**: `concurrently` for unified single-command development

---

## 3. Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Vite Frontend Client                 │
│              (React + TypeScript on :5173)             │
└───────────────────────────┬────────────────────────────┘
                            │
               Vite Reverse Proxy (/api, /uploads)
                            │
┌───────────────────────────▼────────────────────────────┐
│                 Express.js REST API                    │
│             (TypeScript via tsx on :5000)              │
├───────────────────────────┬────────────────────────────┤
│  • Auth Controller        │  • Generation Controller   │
│  • Gallery Controller     │  • Dashboard Controller    │
│  • Upload Controller      │  • Credits Controller      │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼──────────────┐ ┌──────────▼──────────────┐
│     AI Generation Service  │ │  Storage Service Engine │
│  • OpenAI / Stability plug │ │  • Local Disk Storage   │
│  • Forma Demo Synthesis    │ │  • S3 / Cloudinary ready│
└─────────────┬──────────────┘ └─────────────────────────┘
              │
┌─────────────▼──────────────────────────────────────────┐
│                 Database Layer                         │
│  • MongoDB via Mongoose (when MONGODB_URI configured)  │
│  • Zero-Config Resilient Engine (Automatic Fallback)   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Folder Structure

```
Dream/
├── data/                       # Local database storage directory
├── public/                     # Static assets (sample hero & gallery assets)
│   └── assets/
├── scripts/                    # Test suites & deployment scripts
│   └── verify-fullstack.ts     # Automated 14-point test suite
├── server/                     # Backend TypeScript REST API
│   ├── .env.example            # Backend environment template
│   ├── tsconfig.json           # Server TypeScript configuration
│   └── src/
│       ├── app.ts              # Express application configuration
│       ├── server.ts           # Server entry point & DB bootstrap
│       ├── config/
│       │   ├── env.ts          # Environment variables configuration
│       │   └── db.ts           # Mongoose & persistent DB connection
│       ├── controllers/        # REST API route controllers
│       │   ├── authController.ts
│       │   ├── collectionsController.ts
│       │   ├── creditsController.ts
│       │   ├── dashboardController.ts
│       │   ├── galleryController.ts
│       │   ├── generationController.ts
│       │   └── uploadController.ts
│       ├── middleware/         # Auth, Upload, and Error handling
│       │   ├── auth.ts
│       │   ├── errorHandler.ts
│       │   └── upload.ts
│       ├── models/             # Mongoose schemas & data models
│       │   ├── Collection.ts
│       │   ├── Favorite.ts
│       │   ├── Generation.ts
│       │   ├── MediaAsset.ts
│       │   ├── UsageQuota.ts
│       │   └── User.ts
│       ├── routes/             # Express API routers
│       │   ├── authRoutes.ts
│       │   ├── collectionsRoutes.ts
│       │   ├── creditsRoutes.ts
│       │   ├── dashboardRoutes.ts
│       │   ├── galleryRoutes.ts
│       │   ├── generationRoutes.ts
│       │   ├── index.ts
│       │   └── uploadRoutes.ts
│       ├── services/           # Business logic & integrations
│       │   ├── ai/             # AI generation engine & adapters
│       │   │   ├── IImageGenerationService.ts
│       │   │   ├── IVideoGenerationService.ts
│       │   │   ├── ImageGenerationService.ts
│       │   │   ├── VideoGenerationService.ts
│       │   │   └── index.ts
│       │   ├── storage/        # Pluggable storage abstraction
│       │   │   ├── CloudStorageService.ts
│       │   │   ├── IStorageService.ts
│       │   │   ├── LocalStorageService.ts
│       │   │   └── index.ts
│       │   └── dbRepository.ts # Dual-engine DB repository
│       ├── utils/              # Helper utilities
│       │   ├── jwt.ts
│       │   ├── password.ts
│       │   └── response.ts
│       └── validators/         # Request validation middleware
│           ├── authValidator.ts
│           └── generationValidator.ts
├── src/                        # React Frontend Application
│   ├── components/             # Reusable UI components & modals
│   │   ├── studio/             # Studio workspace views
│   │   │   ├── CreateWorkspace.tsx
│   │   │   ├── CreditsAndSettingsView.tsx
│   │   │   ├── MyCreationsView.tsx
│   │   │   ├── StudioDashboard.tsx
│   │   │   └── StudioShell.tsx
│   │   ├── AuthModal.tsx
│   │   ├── BrandLogo.tsx
│   │   ├── CreationPreviewModal.tsx
│   │   ├── CuratedGallery.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroShowcase.tsx
│   │   ├── MediaFrame.tsx
│   │   ├── MinimalLoaders.tsx
│   │   ├── Navbar.tsx
│   │   └── PossibilitiesSection.tsx
│   ├── config/brand.ts
│   ├── data/                   # Presets, slots, and palettes
│   ├── services/
│   │   ├── apiClient.ts        # Centralized typed HTTP API client
│   │   └── generationService.ts# Fullstack generation adapter
│   ├── styles/                 # Global design system
│   ├── types/                  # Shared TypeScript interfaces
│   ├── App.tsx                 # Root application state & navigation
│   └── main.tsx                # Client entry point
├── uploads/                    # Local storage for creations & reference uploads
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 5. Getting Started & Installation

### Prerequisites
- Node.js version 18.0.0 or higher
- npm version 9.0.0 or higher

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd Dream
   ```

2. Install all dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables (optional for local development):
   ```bash
   cp .env.example .env
   ```

4. Run the full-stack development environment:
   ```bash
   npm run dev
   ```
   This concurrently starts:
   - **Backend API**: `http://localhost:5000`
   - **Frontend UI**: `http://localhost:5173`

5. Open your browser at [http://localhost:5173/](http://localhost:5173/)

---

## 6. Environment Variables

Create a `.env` file at the root of the project using `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/forma

# Authentication
JWT_SECRET=your-random-64-character-secret-key-here
JWT_EXPIRES_IN=7d

# File Storage Provider ('local' | 'cloudinary' | 's3')
STORAGE_PROVIDER=local

# Cloud Storage (Optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# External AI Providers (Optional: when empty, Forma operates in Demo Synthesis Mode)
OPENAI_API_KEY=
STABILITY_API_KEY=
RUNWAY_API_KEY=
LUMA_API_KEY=
FAL_KEY=
```

---

## 7. Database Architecture & Persistence

Forma supports a **dual-engine architecture**:
1. **Production Mode (MongoDB / Mongoose)**: When `MONGODB_URI` is provided and reachable (e.g., MongoDB Atlas or local MongoDB), all data is persisted directly using Mongoose schemas:
   - `User`: Account details, bcrypt password hashes, plan tier, credit balance.
   - `Generation`: Prompts, negative prompts, aspect ratio, resolution, motion, seed, dimensions, credits used, media URLs.
   - `MediaAsset`: Reference files and uploaded creative media.
   - `UsageQuota`: Transactional ledger recording all credit deductions and plan top-ups.
   - `Collection`: User-specific folders/collections.
2. **Resilient Local Mode (Zero-Config Persistence)**: If a MongoDB server is not currently running or reachable on your development machine, Forma automatically activates its embedded local persistent engine. All records, users, creations, and credit histories are safely stored in `data/studio.db` without crashing or requiring any manual setup.

---

## 8. REST API Documentation

### Authentication & User Profiles
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new account with email, name, and password | No |
| `POST` | `/api/auth/login` | Authenticate with email and password | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile, plan, and credit balance | Yes |
| `PATCH` | `/api/auth/profile` | Update user display name or email address | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset verification code | No |
| `POST` | `/api/auth/reset-password` | Verify code and update password | No |
| `POST` | `/api/auth/oauth-mock` | Instant OAuth authentication for Google / Apple | No |
| `POST` | `/api/auth/logout` | Client logout acknowledgment | No |

### AI Generation
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/generate` | Dispatch text-to-image, text-to-video, or image-to-video request | Yes |
| `GET` | `/api/generate/:id` | Fetch status and metadata of a specific generation | Yes |

### Gallery & Creations Management
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/creations` | List generations with optional `filter`, `collection`, `search` | Yes |
| `PATCH` | `/api/creations/:id` | Update title, toggle favorite bookmark, or assign collection | Yes |
| `DELETE` | `/api/creations/:id` | Delete a creation | Yes |
| `POST` | `/api/creations/:id/duplicate`| Clone an existing creation | Yes |

### Collections & Folders
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/collections` | List custom collection folders | Yes |
| `POST` | `/api/collections` | Create a new collection folder | Yes |
| `DELETE` | `/api/collections/:name`| Delete a collection folder | Yes |

### Dashboard & Analytics
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Aggregated stats: total creations, images, videos, saved, credits spent | Yes |

### Credits & Plans
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/credits/history` | Retrieve complete credit transaction ledger | Yes |
| `POST` | `/api/credits/plan` | Upgrade/switch plan (`free`, `pro`, `studio`) | Yes |
| `POST` | `/api/credits/topup` | Adjust credit balance (for studio testing) | Yes |

### File Uploads
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/upload` | Multipart file upload for reference images/videos (max 50MB) | Yes |

---

## 9. AI Engine & Demo Mode

Forma utilizes a **Provider-Independent AI Service Architecture**:
- When external provider credentials (`OPENAI_API_KEY`, `STABILITY_API_KEY`, `RUNWAY_API_KEY`, etc.) are configured in `.env`, requests are routed to the corresponding cloud model endpoints.
- When external API keys are not supplied, Forma runs in **Clearly Labeled Demo Mode**:
  - Provider tag: `Forma Studio Demo Engine (Procedural Synthesis)`
  - Generates high-resolution vector and animated SVG canvas compositions tailored to prompt keywords, styles (`Editorial`, `Minimal`, `Architectural`, `Monochrome`), aspect ratios, and seed numbers.
  - Video mode produces kinetic camera motion animations (`Orbit`, `Slow Dolly`, `Lateral Pan`).
  - Generated files are saved to `uploads/creations/` with permanent public URLs.
  - This guarantees the application is fully demonstrable out-of-the-box without fabricating fake responses.

---

## 10. Authentication & Security

- **Password Security**: Passwords are encrypted using `bcryptjs` with salt rounds.
- **JWT Authentication**: Tokens are signed using `jsonwebtoken` (HMAC-SHA256) and verified on every protected API route via `requireAuth` middleware.
- **Data Isolation**: All queries enforce `{ userId: req.user.id }` ensuring users can strictly view and mutate only their own private assets and generations.
- **File Validation**: Multer verifies mime-types (`image/*`, `video/*`) and limits payload sizes to 50MB.

---

## 11. Testing & Verification

Forma includes an automated 14-point full-stack test suite verifying end-to-end functionality:

```bash
npx tsx scripts/verify-fullstack.ts
```

### Verified Test Suite Output:
```
=============================================
  🧪 FORMA FULL-STACK AUTOMATED TEST SUITE
=============================================

  ✓ PASS: Health check returns 200 OK
  ✓ PASS: User registration returns 201 & JWT token
  ✓ PASS: User login succeeds with correct credentials
  ✓ PASS: Protected /api/auth/me returns user profile
  ✓ PASS: Image generation succeeds, deducts 1 credit and creates media file
  ✓ PASS: Video generation succeeds, deducts 4 credits and produces video sequence
  ✓ PASS: Gallery lists user generations correctly
  ✓ PASS: Creation successfully renamed and bookmarked/saved
  ✓ PASS: Collection created successfully
  ✓ PASS: Collection listed in user collections
  ✓ PASS: Dashboard stats aggregates creations and credit transactions
  ✓ PASS: Duplicate creation creates cloned record
  ✓ PASS: Creation deleted successfully
  ✓ PASS: Plan upgrade to Pro allocates 500 credits

=============================================
  🎉 TEST RESULTS: 14 / 14 TESTS PASSED
=============================================
```

To run TypeScript verification:
```bash
# Verify backend types
npx tsc -p server --noEmit

# Verify frontend types & build
npm run build
```

---

## 12. Troubleshooting & FAQ

**Q: Where are generated files stored?**  
A: Generated images and videos are written to `uploads/creations/` and served publicly at `http://localhost:5000/uploads/creations/`.

**Q: Is MongoDB required to run the project?**  
A: No. If MongoDB is not running locally, Forma automatically activates its built-in persistent storage engine in `data/studio.db` so the app is 100% turnkey. If you provide a MongoDB connection string in `.env`, Forma connects seamlessly via Mongoose.

**Q: What credentials can I use to test immediately?**  
A: Forma pre-seeds a demo lead account on startup:
- **Email:** `creator@studio.in`
- **Password:** `password123`
Alternatively, you can sign up with any new email or use the one-click Google/Apple buttons.

---

## License
Proprietary commercial software. Designed & developed for Forma Creative Studio.

=======
# Forma
Forma is an AI-powered creative studio for generating, managing, and organizing visual content. Built with React, TypeScript, Vite, Node.js, Express, and MongoDB, it features AI image generation, prompt enhancement, user authentication, and a personalized creative gallery. 
>>>>>>> 31bc5cd7ccbfb8b064c244d28b0fa50ad5ee1a79
