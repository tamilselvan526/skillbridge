## SkillBridge (HTML/CSS/JS + Firebase)

### Run
- Open `index.html` in a browser (or use a simple static server).

### Firebase setup
1. Create a Firebase project.
2. Enable **Authentication** providers you want (Email/Password and/or Google).
3. Create **Firestore** in production or test mode.
4. Paste your Firebase web config into `js/firebase-config.js`.

### Firestore collections used
- **`users`**: basic user profile (`name`, `email`, `skills`, timestamps)
- **`skills`**: skill listings (`title`, `level`, `mode`, `tags`, `want`, `about`, `featured`, `ownerId`, `ownerName`, `createdAt`)

### Notes
- If Firebase isn’t configured, Explore/Browse/Featured will show a friendly “Firebase not configured” panel.
- To test “Featured”, set `featured: true` on any document in `skills`.

