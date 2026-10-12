# AuraMail — AI-Powered Mail Client

AuraMail is an intelligent, light-themed email application built with **React, TypeScript, TailwindCSS, Express.js, and Google Gemini AI**. It integrates with the Gmail API for real email retrieval and provides an action-taking AI assistant capable of searching, filtering, reading, and drafting emails using natural-language commands.

---

## 🌟 Key Accomplishments & Feature Overview

### 1. AI Assistant Foundation & Tool Action Execution (Phase 4)
* **Backend AI Processing Endpoint (`POST /api/ai/process`)**:
  * Connected to Google Gemini REST API (`GEMINI_API_KEY`) for structured tool calls.
  * Built a deterministic intent parser fallback (`parsePromptWithRules`) that guarantees 100% reliable execution offline or when an API key is not present.
* **Natural-Language Tool Actions**:
  * `apply_filter`: Programmatically filters emails by unread status, sender, or date range presets (*"Show unread emails from Sarah"*).
  * `search_emails`: Searches subject and body text for keywords (*"Find emails about interview"*).
  * `open_email`: Locates and opens specific messages in the reading pane (*"Open latest email from David"*).
  * `navigate`: Switches application view (`Inbox` ↔ `Sent`).
  * `clear_filters`: Resets active search parameters and filters.
* **AI-Assisted Email Drafting**:
  * Natural-language compose prompts (*"Draft an email to john@example.com about meeting"*) automatically populate the visible Compose modal fields.

---

### 2. Complete UI Redesign

#### A. Left Navigation Sidebar
* **User Profile & OAuth Status**: Displays user avatar initials, user name, connected Gmail address, and authentication mode (`Gmail OAuth` vs `Mock Mode`).
* **Navigation Links**:
  * **Inbox** with coral red unread count pill badge (`#FF5252`).
  * **Sent** mailbox view.
  * Category folder tags (`Office`, `Personal`, `Freelance`).
* **Compose Action**: Prominent coral red Compose button (`.coral-btn`).

#### B. Middle Column (Search & Email List)
* **Search Header**: Light-themed search input with clear button.
* **Interactive Filter Controls**:
  * **Date Range Dropdown**: Options for *All Time*, *Today*, *Last 7 Days*, *Last 10 Days*, *This Week*, and *This Month*.
  * **Unread Toggle & Sender Filter**: Quick filter toggle buttons and active badge pills.
* **Email Cards**: White rounded cards featuring sender avatars, timestamps (*"Today 08:45 PM"*), subject lines, 2-line snippet previews, attachment indicators, and active card selection highlights.

#### C. Dynamic Right Reading Workspace
* **Conditional Workspace Visibility**:
  * **No Email Selected**: Reading workspace unmounts completely, allowing the email list to expand to 100% full width without leaving blank empty columns.
  * **Email Selected**: Opens the reading pane displaying the subject line, sender/recipient metadata, formatted body text, toolbar actions (Reply, Forward, Delete), and a quick reply dock.

#### D. Floating Circular AI Assistant Launcher
* **Floating Launcher Button**: Positioned at the bottom-right corner (`fixed bottom-6 right-6 z-50`).
* **Robot Avatar Styling**: Circular button (`w-14 h-14`) featuring a friendly white robot avatar with black face screen and cyan facial details.
* **Collapsible Slide-Over Drawer**: Toggling the button slides out the AI Assistant panel with a scrollable chat log, tracked context inspector, quick suggestion pills, and a keyboard `Escape` key listener.

---

### 3. Responsive Layout & Accessibility
* **Viewport Adaptability**:
  * **Mobile (< 768px)**: Displays single view at a time (`Inbox/Sent` vs `Email Detail`); includes mobile hamburger header menu for opening the left navigation drawer overlay.
  * **Tablet (768px - 1024px)**: 2-to-3 column structure with overlay drawer behavior.
  * **Desktop (> 1024px)**: Full 3-column productivity dashboard.
* **Accessibility**:
  * Keyboard `Escape` key handling for all modals and drawers.
  * Visible sky-blue focus rings (`focus-visible:ring-4 focus-visible:ring-sky-400`).
  * Semantic `aria-label` and `role="dialog"` attributes across interactive controls.

---

## 🏗️ Project Architecture

```
Email_hiring/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Express controllers (mail, auth, ai)
│   │   ├── routes/           # API router endpoints
│   │   ├── services/         # Gmail API, Mock mail, Auth & AI service
│   │   └── types/            # Backend TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # App components (Sidebar, Header, InboxView, SentView, EmailDetailView, ComposeModal, AssistantSidebar, FloatingRobotButton)
│   │   ├── context/          # Central AppContext state management
│   │   ├── services/         # API HTTP callers
│   │   ├── types/            # Frontend TypeScript definitions
│   │   ├── App.tsx           # 3-column shell layout & view routing
│   │   └── index.css         # Tailwind & light theme CSS design tokens
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
├── .env.example
├── Phase4.md
└── package.json              # Root package scripts
```

---

## ⚙️ Quick Start Guide

### 1. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` in the root directory:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional: Google OAuth & Gemini Credentials
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Development Server
```bash
# Start backend server (Port 5000)
cd backend
npm run dev

# In a separate terminal, start frontend dev server (Port 5173)
cd frontend
npm run dev
```

Open `http://localhost:5173` in your web browser.

---

## 🛠️ Built With
* **Frontend**: React 18, TypeScript, TailwindCSS, Lucide Icons, Vite
* **Backend**: Node.js, Express.js, Google APIs Client Library (`googleapis`), dotenv, CORS
* **AI Engine**: Google Gemini API + Deterministic Natural Language Rule Engine
