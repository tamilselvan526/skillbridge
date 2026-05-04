# SkillBridge: Project Specification & Documentation

SkillBridge is a decentralized learning platform where "Knowledge is the Currency." It enables a peer-to-peer exchange of skills, allowing users to teach what they know in return for learning something new.

## 1. Project Objectives
- **Collaborative Learning**: Facilitate knowledge sharing without financial barriers.
- **Community Building**: Create a network of experts and learners across various domains (Tech, Music, Fitness, etc.).
- **User Trust**: Implement a transparent rating and connection system to ensure quality exchanges.

## 2. Core Modules & Functionality

### A. Authentication & User Management
- **Providers**: Supports Google OAuth and Email/Password authentication via Firebase.
- **User Data**: Stores profiles including name, email, bio, skills offered, and learning goals in the `users` collection.
- **Onboarding**: Integrated signup flow that captures initial skill interests.

### B. Skill Discovery (Browse)
- **Search & Filter**: Real-time filtering by category (Tech, Art, Business, etc.) and search by keyword.
- **User Cards**: Visual representations of members showing their expertise and what they are looking for in return.
- **Connection Logic**: Prevents duplicate requests and ensures users can only message after a connection is established.

### C. Connection & Messaging System
- **Handshake Protocol**: A "Request -> Accept" workflow stored in the `requests` collection.
- **Real-time Chat**: Dedicated chat rooms (`chats` collection) with instant message delivery using Firestore's `onSnapshot`.
- **Message History**: Persistent chat logs with timestamps and sender identifiers.

### D. Community Engagement
- **Public Feed**: Users can post updates, ask for help, or share achievements.
- **Interactions**: Social features including Likes and Comments on community posts.

### E. Notifications
- **Real-time Alerts**: A bell icon in the navbar displays unread counts for connection requests and system updates.
- **Contextual Redirection**: Clicking a notification takes the user directly to the relevant request or message.

## 3. Technical Stack
- **Frontend**: Built with **Semantic HTML5**, **Modern Vanilla CSS3** (using custom tokens, glassmorphism, and responsive layouts), and **Modular JavaScript**.
- **Backend (BaaS)**: Powered by **Firebase**, utilizing:
    - **Firestore**: Real-time NoSQL database for users, skills, chats, and notifications.
    - **Firebase Authentication**: Secure login via Email/Password and Google Sign-In.
    - **Firebase Rules**: Robust security rules to protect user data and private communications.

## 4. Database Schema (Firestore Collections)

| Collection | Description | Key Fields |
| :--- | :--- | :--- |
| `users` | User profile data | `name`, `email`, `skills`, `photoURL`, `rating` |
| `skills` | Individual skill listings | `title`, `level`, `ownerId`, `category`, `featured` |
| `requests` | Connection requests | `fromUid`, `toUid`, `status` (pending/accepted/completed) |
| `chats` | Chat room metadata | `participants` (UID array), `lastMessage`, `lastUpdated` |
| `messages` | Sub-collection of chats | `senderId`, `text`, `createdAt` |
| `notifications`| User-specific alerts | `uid`, `type`, `message`, `read` (boolean) |
| `ratings` | Peer reviews | `fromUid`, `toUid`, `stars`, `comment` |

## 5. File Structure
```text
SEPM/
├── index.html          # Landing Page & Hero Section
├── browse.html         # User/Skill Directory
├── offer.html          # Skill Listing Creation
├── community.html      # Community Feed & Social
├── messages.html       # Chat Interface
├── requests.html       # Connection Management
├── profile.html        # User Profile & Settings
├── login.html          # Auth (Login/Signup)
├── style.css           # Global Styles & Design System
├── js/
│   ├── firebase-config.js # API Keys & Firebase Initialization
│   ├── firebase.js        # Firebase SDK Wrapper & Helpers
│   └── main.js            # Core App Logic & Page Routing
└── firestore.rules     # Security & Access Control
```

## 6. Security Architecture
The project implements strict **Firestore Security Rules**:
- **Private Data**: Users can only read their own notifications and specific connection requests.
- **Chat Privacy**: Messages are only accessible to the two participants listed in the parent `chat` document.
- **Integrity**: Rules prevent users from modifying others' skills or profiles.

## 7. How to Run Locally
1. Clone the repository.
2. Open `index.html` in a web browser (or use a local server like Live Server).
3. Ensure Firebase is configured in `js/firebase-config.js` for full functionality.
