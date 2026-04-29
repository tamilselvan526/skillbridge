import { initFirebase } from "./firebase.js";

const fb = initFirebase();

function requireAuth() {
  if (!fb.ready) return;
  const protectedPages = ["profile.html", "requests.html", "messages.html"];
  if (protectedPages.includes(getPageName())) {
    fb.api.onAuthStateChanged(fb.auth, (user) => {
      if (!user) {
        location.href = "login.html";
      }
    });
  }
}

requireAuth();

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function getPageName() {
  const last = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  return last === "" ? "index.html" : last;
}

function getParam(key) {
  return new URLSearchParams(location.search).get(key);
}

function setActiveNavLink() {
  const page = getPageName();
  $all("[data-nav]").forEach((a) => {
    a.classList.toggle("active", (a.getAttribute("href") || "").toLowerCase() === page);
  });
}

function wireHomePageLinks() {
  if (getPageName() !== "index.html") return;

  const browseBtn = $("#btn-browse");
  const startBtn = $("#btn-start");
  if (browseBtn) browseBtn.setAttribute("href", "browse.html");
  if (startBtn) startBtn.setAttribute("href", "offer.html");
}

function renderNavbar() {
  const mount = $("#app-navbar");
  if (!mount) return;

  mount.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="index.html" class="logo-container" aria-label="SkillBridge home">
          <img src="logo.png" alt="Logo" class="logo-mark" style="background: transparent; border: none; padding: 0; width: 34px; height: 34px;">
          <span class="logo-text">SkillBridge</span>
        </a>

        <button class="nav-toggle icon-btn" id="nav-toggle" aria-label="Open menu" type="button">
          <i class="fa-solid fa-bars"></i>
        </button>

        <div class="nav-links" id="nav-links">
          <a data-nav href="index.html">Home</a>
          <a data-nav href="browse.html">Browse</a>
          <a data-nav href="community.html">Community</a>
          <a data-nav href="offer.html">Offer</a>
          <a data-nav href="requests.html">Requests</a>
          <a data-nav href="messages.html">Messages</a>
          <a data-nav href="profile.html">Profile</a>
        </div>

        <div class="nav-right">
          <a class="btn-login" id="nav-auth" href="login.html">Log In</a>

          <div class="notifications" id="notif-wrapper" hidden>
            <button class="notif-btn icon-btn" id="notif-btn" type="button" aria-label="Notifications">
              <i class="fa-regular fa-bell"></i>
              <span class="notif-badge" id="notif-badge" hidden>0</span>
            </button>
            <div class="notif-panel glass-panel" id="notif-panel" hidden>
              <div class="notif-header">
                <h3>Notifications</h3>
              </div>
              <div class="notif-list" id="notif-list">
                <div class="muted center" style="padding: 20px">No new notifications</div>
              </div>
            </div>
          </div>

          <div class="profile" id="profile" hidden>
            <button class="profile-btn" id="profile-btn" type="button" aria-label="Profile menu">
              <span class="avatar" id="avatar">?</span>
              <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="profile-menu glass-panel" id="profile-menu" hidden>
              <div class="profile-meta">
                <div class="profile-name" id="profile-name">Member</div>
                <div class="profile-email muted" id="profile-email">—</div>
              </div>
              <a class="menu-item" href="profile.html">
                <i class="fa-regular fa-user"></i>
                Profile
              </a>
              <button class="menu-item" id="btn-logout" type="button">
                <i class="fa-solid fa-right-from-bracket"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;

  setActiveNavLink();

  const toggle = $("#nav-toggle");
  const links = $("#nav-links");
  toggle?.addEventListener("click", () => {
    links?.classList.toggle("open");
  });
  // Profile dropdown
  const profileBtn = $("#profile-btn");
  const menu = $("#profile-menu");
  const notifBtn = $("#notif-btn");
  const notifPanel = $("#notif-panel");

  profileBtn?.addEventListener("click", () => {
    menu?.toggleAttribute("hidden");
    notifPanel?.setAttribute("hidden", "");
  });

  notifBtn?.addEventListener("click", () => {
    notifPanel?.toggleAttribute("hidden");
    menu?.setAttribute("hidden", "");
  });

  document.addEventListener("click", (e) => {
    if (menu && !menu.hasAttribute("hidden")) {
      const inside = e.target instanceof Node && (menu.contains(e.target) || profileBtn?.contains(e.target));
      if (!inside) menu.setAttribute("hidden", "");
    }
    if (notifPanel && !notifPanel.hasAttribute("hidden")) {
      const insideNotif = e.target instanceof Node && (notifPanel.contains(e.target) || notifBtn?.contains(e.target));
      if (!insideNotif) notifPanel.setAttribute("hidden", "");
    }
  });
}

function setAuthUI(user) {
  const navAuth = $("#nav-auth");
  const profile = $("#profile");
  const avatar = $("#avatar");
  const nameEl = $("#profile-name");
  const emailEl = $("#profile-email");
  const notifWrap = $("#notif-wrapper");

  if (!user) {
    navAuth?.removeAttribute("hidden");
    profile?.setAttribute("hidden", "");
    notifWrap?.setAttribute("hidden", "");
    return;
  }

  navAuth?.setAttribute("hidden", "");
  profile?.removeAttribute("hidden");
  notifWrap?.removeAttribute("hidden");

  const displayName = user.displayName || "Member";
  const email = user.email || "—";
  const initial = (displayName || email || "?").trim().charAt(0).toUpperCase();

  if (avatar) avatar.textContent = initial || "?";
  if (nameEl) nameEl.textContent = displayName;
  if (emailEl) emailEl.textContent = email;
}

async function wireAuth() {
  const loginForm = $("#login-form");
  const btnGoogle = $("#btn-google");
  const hint = $("#form-hint");

  if (fb.ready) {
    const { auth, api } = fb;
    api.onAuthStateChanged(auth, (user) => {
      setAuthUI(user);
      if (user) {
        initNotifications(user);
        if (getPageName() === "login.html") {
          setTimeout(() => (location.href = "index.html"), 300);
        }
      }
    });

    $("#btn-logout")?.addEventListener("click", async () => {
      await api.signOut(auth);
      location.href = "index.html";
    });
  }

  if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
      if (!fb.ready) {
        if (hint) hint.textContent = "Firebase not configured. Google Sign-In is unavailable.";
        return;
      }
      const { auth, googleProvider, api, db } = fb;
      try {
        const res = await api.signInWithPopup(auth, googleProvider);
        const user = res.user;
        if (user) {
          await api.setDoc(api.doc(db, "users", user.uid), {
            name: user.displayName || "Member",
            email: user.email || null,
            updatedAt: api.serverTimestamp(),
            createdAt: api.serverTimestamp(),
          }, { merge: true });
        }
        location.href = "index.html";
      } catch (err) {
        if (hint) hint.textContent = err?.message || "Google sign-in failed.";
      }
    });
  }

  if (loginForm) {
    // Tabs
    const tabLogin = $("#tab-login");
    const tabSignup = $("#tab-signup");
    const headerH2 = $(".auth-header h2");
    const headerP = $(".auth-header p");
    const btnSubmit = $("#btn-login-submit");
    const profileFields = $all(".profile-only");
    let mode = "login";

    const setMode = (next) => {
      mode = next;
      tabLogin?.classList.toggle("active", mode === "login");
      tabSignup?.classList.toggle("active", mode === "signup");

      if (headerH2) headerH2.textContent = mode === "login" ? "Welcome Back" : "Join SkillBridge";
      if (headerP) headerP.textContent = mode === "login"
        ? "Login to continue exchanging skills"
        : "Create your account to start swapping skills";
      if (btnSubmit) btnSubmit.textContent = mode === "login" ? "Login" : "Sign Up";

      profileFields.forEach((el) => {
        el.style.display = mode === "signup" ? "block" : "none";
      });
    };

    tabLogin?.addEventListener("click", () => setMode("login"));
    tabSignup?.addEventListener("click", () => setMode("signup"));
    setMode("login");

    // Password toggle
    const toggle = $("#toggle-password");
    const pwd = $("#password");
    toggle?.addEventListener("click", () => {
      if (!pwd) return;
      pwd.type = pwd.type === "password" ? "text" : "password";
      toggle.classList.toggle("fa-eye");
      toggle.classList.toggle("fa-eye-slash");
    });

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (hint) hint.textContent = "";

      const email = $("#email")?.value?.trim();
      const password = $("#password")?.value;
      const fullName = $("#full-name")?.value?.trim();
      const skills = $("#skills")?.value?.trim();

      if (!email || !password) return;

      if (!fb.ready) {
        if (hint) hint.textContent = "Saved locally (static mode). Sign up is simulated.";
        setTimeout(() => location.href = "index.html", 1000);
        return;
      }

      const { auth, api, db } = fb;
      btnSubmit?.setAttribute("disabled", "");
      btnSubmit?.classList.add("loading");

      try {
        if (mode === "login") {
          await api.signInWithEmailAndPassword(auth, email, password);
          location.href = "index.html";
          return;
        }

        const res = await api.createUserWithEmailAndPassword(auth, email, password);
        if (res.user) {
          if (fullName) await api.updateProfile(res.user, { displayName: fullName });
          await api.setDoc(api.doc(db, "users", res.user.uid), {
            name: fullName || "Member",
            email,
            skills: skills || "",
            createdAt: api.serverTimestamp(),
            updatedAt: api.serverTimestamp(),
          }, { merge: true });
        }
        location.href = "index.html";
      } catch (err) {
        if (hint) hint.textContent = err?.message || "Authentication failed.";
      } finally {
        btnSubmit?.removeAttribute("disabled");
        btnSubmit?.classList.remove("loading");
      }
    });
  }
}

function skillCardHtml(skill) {
  const title = escapeHtml(skill.title || "Untitled");
  const level = escapeHtml(skill.level || "—");
  const mode = escapeHtml(skill.mode || "—");
  const tags = (skill.tags || "").split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6);
  const want = escapeHtml(skill.want || "");
  const about = escapeHtml(skill.about || "");
  const ownerName = escapeHtml(skill.ownerName || "Member");

  return `
    <article class="glass-panel skill-card">
      <div class="skill-top">
        <div>
          <h3 class="skill-title">${title}</h3>
          <div class="skill-meta">
            <span class="pill"><i class="fa-solid fa-signal"></i>${level}</span>
            <span class="pill"><i class="fa-solid fa-wifi"></i>${mode}</span>
          </div>
        </div>
        <div class="skill-owner" title="${ownerName}">
          <span class="avatar small">${(ownerName || "?").charAt(0).toUpperCase()}</span>
        </div>
      </div>
      <p class="skill-about">${about}</p>
      ${want ? `<p class="skill-want"><span class="muted">Exchange for:</span> ${want}</p>` : ""}
      ${tags.length ? `<div class="tag-row">${tags.map((t) => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}</div>` : ""}
    </article>
  `;
}

function userCardHtml(userDoc, connectionStatus = null) {
  const name = escapeHtml(userDoc.name || "Member");
  const location = escapeHtml(userDoc.location || "Remote");
  const offer = escapeHtml(userDoc.skillOffered || userDoc.skillsOffered || userDoc.skills || "—");
  const want = escapeHtml(userDoc.skillWanted || userDoc.skillsWanted || "");
  const exp = escapeHtml(userDoc.experience || "—");
  const avatarUrl = userDoc.photoURL || userDoc.avatarUrl || "";
  const category = escapeHtml(userDoc.category || "All");

  let connectBtnHtml = `
    <button class="btn-primary btn-connect" type="button" data-connect="${escapeHtml(userDoc.id || "")}">
      <i class="fa-solid fa-handshake"></i> Connect &amp; Exchange
    </button>
  `;

  if (connectionStatus === "accepted" || connectionStatus === "completed") {
    connectBtnHtml = `
      <button class="btn-success" type="button" disabled style="width: 100%; justify-content: center; background: #10b981; border-color: #10b981; color: white; cursor: default;">
        <i class="fa-solid fa-check"></i> Connected
      </button>
    `;
  } else if (connectionStatus === "pending") {
    connectBtnHtml = `
      <button class="btn-secondary" type="button" disabled style="width: 100%; justify-content: center; cursor: default; opacity: 0.8;">
        <i class="fa-solid fa-clock"></i> Request Sent
      </button>
    `;
  }

  return `
    <article class="glass-panel user-card">
      <div class="user-top">
        <div class="user-avatar">
          ${avatarUrl
            ? `<img src="${escapeHtml(avatarUrl)}" alt="${name}" loading="lazy" />`
            : `<div class="avatar big">${(name || "?").charAt(0).toUpperCase()}</div>`}
        </div>
        <div class="user-meta">
          <div class="user-name">${name} <span class="rating-display" data-uid="${userDoc.id}"></span></div>
          <div class="user-loc muted"><i class="fa-solid fa-location-dot"></i>${location}</div>
          <div class="user-badges">
            <span class="tag">${category}</span>
            <span class="pill"><i class="fa-solid fa-chart-line"></i>${exp}</span>
          </div>
        </div>
      </div>

      <div class="swap">
        <div class="swap-row">
          <div class="swap-label muted"><i class="fa-solid fa-gift"></i>Offers</div>
          <div class="swap-value">${offer}</div>
        </div>
        ${want ? `
          <div class="swap-row">
            <div class="swap-label muted"><i class="fa-solid fa-graduation-cap"></i>Wants</div>
            <div class="swap-value">${want}</div>
          </div>
        ` : ""}
      </div>

      <div class="user-actions">
        ${connectBtnHtml}
        <button class="btn-secondary" type="button" data-message="${escapeHtml(userDoc.id || "")}" data-message-name="${escapeHtml(userDoc.name || 'Member')}" style="padding: 10px 16px; width: 100%; margin-top: 8px; justify-content: center;">
          <i class="fa-regular fa-comment"></i> Message
        </button>
      </div>
    </article>
  `;
}

async function loadCounts() {
  if (!fb.ready) return;
  const { db, api } = fb;

  const skillCountEl = $("#stat-skillCount");
  const userCountEl = $("#stat-userCount");
  if (!skillCountEl || !userCountEl) return;

  try {
    const skillsSnap = await api.getCountFromServer(api.collection(db, "skills"));
    const usersSnap = await api.getCountFromServer(api.collection(db, "users"));
    skillCountEl.textContent = String(skillsSnap.data().count ?? "0");
    userCountEl.textContent = String(usersSnap.data().count ?? "0");
  } catch {
    // If Firestore rules block counts, keep placeholders
  }
}

async function loadBrowse() {
  // Browse Skills page (users) – see loadBrowseUsers()
  return;
}

function staticUsers() {
  return [
    {
      id: "demo-1",
      name: "Aisha Khan",
      location: "Chennai, IN",
      category: "Tech",
      experience: "3 yrs",
      skillOffered: "Frontend (HTML/CSS/JS)",
      skillWanted: "UI Design feedback",
    },
    {
      id: "demo-2",
      name: "Rohit Mehta",
      location: "Bengaluru, IN",
      category: "Music",
      experience: "5 yrs",
      skillOffered: "Guitar (Beginner → Intermediate)",
      skillWanted: "English speaking practice",
    },
    {
      id: "demo-3",
      name: "Sara Thomas",
      location: "Remote",
      category: "Business",
      experience: "4 yrs",
      skillOffered: "Resume + Interview prep",
      skillWanted: "Python basics",
    },
    {
      id: "demo-4",
      name: "Daniel Lee",
      location: "Singapore",
      category: "Fitness",
      experience: "2 yrs",
      skillOffered: "Strength training plan",
      skillWanted: "Cooking fundamentals",
    },
  ];
}

async function loadBrowseUsers() {
  const grid = $("#users-grid");
  if (!grid) return;

  const empty = $("#users-empty");
  const qInput = $("#search");
  const chips = $all("[data-cat]");

  const state = { all: [], connections: {}, cat: getParam("category") || "All" };

  const setCat = (cat) => {
    state.cat = cat;
    chips.forEach((c) => c.classList.toggle("active", c.getAttribute("data-cat") === cat));
    apply();
  };

  chips.forEach((c) => c.addEventListener("click", () => setCat(c.getAttribute("data-cat") || "All")));

  function apply() {
    const q = qInput?.value?.trim()?.toLowerCase() || "";
    const cat = state.cat;

    const filtered = state.all.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const offer = (u.skillOffered || u.skillsOffered || u.skills || "").toLowerCase();
      const want = (u.skillWanted || u.skillsWanted || "").toLowerCase();
      const loc = (u.location || "").toLowerCase();
      const category = (u.category || "All");

      if (cat && cat !== "All" && category !== cat) return false;
      if (!q) return true;
      return name.includes(q) || offer.includes(q) || want.includes(q) || loc.includes(q);
    });

    grid.innerHTML = filtered.map(u => userCardHtml(u, state.connections[u.id])).join("");
    empty?.toggleAttribute("hidden", filtered.length !== 0);
    renderRatings(filtered);
  }

  qInput?.addEventListener("input", apply);

  async function fetchUsers() {
    if (!fb.ready) {
      state.all = staticUsers();
      setCat(state.cat);
      return;
    }

    const { db, api, auth } = fb;
    
    // Initial fetch of users
    const snap = await api.getDocs(api.collection(db, "users"));
    state.all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Fetch connections whenever auth state is known
    let unsubRequestsIn = null;
    let unsubRequestsOut = null;

    api.onAuthStateChanged(auth, async (user) => {
      if (unsubRequestsIn) unsubRequestsIn();
      if (unsubRequestsOut) unsubRequestsOut();

      if (user) {
        try {
          const qIn = api.query(api.collection(db, "requests"), api.where("toUid", "==", user.uid));
          const qOut = api.query(api.collection(db, "requests"), api.where("fromUid", "==", user.uid));
          
          const process = (snapIn, snapOut) => {
            const connections = {};
            [...snapIn.docs, ...snapOut.docs].forEach(d => {
              const data = d.data();
              const otherUid = data.fromUid === user.uid ? data.toUid : data.fromUid;
              if (!connections[otherUid] || data.status === 'accepted' || data.status === 'completed') {
                connections[otherUid] = data.status;
              }
            });
            state.connections = connections;
            apply();
          };

          // Hold temporary snapshots to sync
          let sIn = { docs: [] }, sOut = { docs: [] };
          unsubRequestsIn = api.onSnapshot(qIn, (snap) => { sIn = snap; process(sIn, sOut); });
          unsubRequestsOut = api.onSnapshot(qOut, (snap) => { sOut = snap; process(sIn, sOut); });

        } catch (err) {
          console.error("Failed to setup connection listeners:", err);
        }
      } else {
        state.connections = {};
        apply();
      }
    });

    setCat(state.cat);
    renderRatings(state.all);
  }

  grid.addEventListener("click", async (e) => {
    // --- Connect & Exchange ---
    const connectBtn = e.target?.closest?.("[data-connect]");
    // --- Message ---
    const msgBtn = e.target?.closest?.("[data-message]");

    if (!connectBtn && !msgBtn) return;

    if (!fb.ready) { location.href = "login.html"; return; }
    const { auth, db, api } = fb;
    const user = auth.currentUser;
    if (!user) { location.href = "login.html"; return; }

    // ---- Message button ----
    if (msgBtn) {
      const targetUid = msgBtn.getAttribute("data-message");
      const targetName = msgBtn.getAttribute("data-message-name") || "Member";
      if (!targetUid || user.uid === targetUid) return;

      if (state.connections[targetUid] !== "accepted") {
        alert("First connect with person then click the message.");
        return;
      }

      msgBtn.setAttribute("disabled", "");
      msgBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Opening...';

      try {
        const ids = [user.uid, targetUid].sort();
        const chatId = ids.join("_");
        const chatRef = api.doc(db, "chats", chatId);
        const chatSnap = await api.getDoc(chatRef);

        if (!chatSnap.exists()) {
          await api.setDoc(chatRef, {
            participants: ids,
            participantNames: {
              [user.uid]: user.displayName || "Member",
              [targetUid]: targetName,
            },
            lastMessage: "",
            lastUpdated: api.serverTimestamp(),
          });
        }

        location.href = `messages.html?chat=${chatId}`;
      } catch (err) {
        console.error("Failed to open chat:", err);
        msgBtn.innerHTML = '<i class="fa-regular fa-comment"></i> Message';
        msgBtn.removeAttribute("disabled");
        alert("Could not open chat: " + err.message);
      }
      return;
    }

    // ---- Connect & Exchange button ----
    const btn = connectBtn;
    const targetUid = btn.getAttribute("data-connect") || "";
    if (!targetUid) return;

    if (user.uid === targetUid) { alert("You cannot connect with yourself."); return; }

    const targetUser = state.all.find((u) => u.id === targetUid);
    if (!targetUser) return;

    btn.setAttribute("disabled", "");
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';

    try {
      // Check both directions for any existing request
      const q1 = api.query(api.collection(db, "requests"), api.where("fromUid", "==", user.uid), api.where("toUid", "==", targetUid));
      const q2 = api.query(api.collection(db, "requests"), api.where("fromUid", "==", targetUid), api.where("toUid", "==", user.uid));
      
      const [snap1, snap2] = await Promise.all([api.getDocs(q1), api.getDocs(q2)]);

      if (!snap1.empty || !snap2.empty) {
        const existing = !snap1.empty ? snap1.docs[0].data() : snap2.docs[0].data();
        if (existing.status === 'accepted') {
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Connected';
        } else {
          btn.innerHTML = '<i class="fa-solid fa-clock"></i> Already Pending';
        }
        btn.classList.replace("btn-primary", "btn-secondary");
        return;
      }

      const reqRef = await api.addDoc(api.collection(db, "requests"), {
        fromUid: user.uid,
        toUid: targetUid,
        fromName: user.displayName || "Member",
        toName: targetUser.name || "Member",
        skillId: targetUser.skillOffered || targetUser.skillsOffered || targetUser.skills || "General",
        status: "pending",
        createdAt: api.serverTimestamp(),
      });

      await api.addDoc(api.collection(db, "notifications"), {
        uid: targetUid,
        type: "request",
        message: `${user.displayName || "Someone"} sent you a connection request!`,
        refId: reqRef.id,
        read: false,
        createdAt: api.serverTimestamp(),
      });

      btn.innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
      btn.style.background = "var(--success, #10b981)";
      btn.style.borderColor = "var(--success, #10b981)";
      
      // Update local state immediately
      state.connections[targetUid] = 'pending';
    } catch (err) {
      console.error("Connection request failed:", err);
      btn.innerHTML = '<i class="fa-solid fa-handshake"></i> Connect &amp; Exchange';
      btn.removeAttribute("disabled");
      alert("Failed to send request: " + (err.message || "Unknown error"));
    }
  });

  await fetchUsers();
  apply();
}

async function renderRatings(users) {
  if (!fb.ready) return;
  const { db, api } = fb;
  for (const u of users) {
    try {
      const q = api.query(api.collection(db, "ratings"), api.where("toUid", "==", u.id));
      const snap = await api.getDocs(q);
      const ratings = snap.docs.map((d) => d.data());
      const avg = ratings.length ? ratings.reduce((a, b) => a + Number(b.stars), 0) / ratings.length : 0;

      const els = document.querySelectorAll(`.rating-display[data-uid="${u.id}"]`);
      els.forEach((el) => {
        if (avg > 0) {
          el.innerHTML =
            Array.from({ length: 5 })
              .map((_, i) => `<i class="fa-solid fa-star ${i < Math.round(avg) ? "" : "off"}"></i>`)
              .join("") + `<span class="rating-avg">(${avg.toFixed(1)})</span>`;
        } else {
          el.innerHTML = '<span class="muted" style="font-size: 0.75rem; font-weight: normal;">No ratings yet</span>';
        }
      });
    } catch (err) {
      console.error("Failed to load ratings for user", u.id, err);
    }
  }
}


function formatTime(ts) {
  try {
    if (!ts) return "Just now";
    // Firestore Timestamp has toDate()
    const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    return d.toLocaleString();
  } catch {
    return "Just now";
  }
}

function postHtml(post) {
  const name = escapeHtml(post.userName || "Member");
  const content = escapeHtml(post.content || "");
  const time = escapeHtml(formatTime(post.createdAt));
  const likes = Number(post.likes || 0);
  const comments = Number(post.comments || 0);
  return `
    <article class="glass-panel post-card">
      <div class="post-head">
        <div class="avatar">${name.charAt(0).toUpperCase()}</div>
        <div class="post-meta">
          <div class="post-name">${name}</div>
          <div class="post-time muted">${time}</div>
        </div>
      </div>
      <div class="post-content">${content}</div>
      <div class="post-actions">
        <button class="post-btn" type="button" data-like="${escapeHtml(post.id || "")}">
          <i class="fa-regular fa-thumbs-up"></i> Like <span class="muted">(${likes})</span>
        </button>
        <button class="post-btn" type="button" data-comment="${escapeHtml(post.id || "")}">
          <i class="fa-regular fa-comment"></i> Comment <span class="muted">(${comments})</span>
        </button>
      </div>
    </article>
  `;
}

async function loadCommunityPage() {
  const feed = $("#posts-feed");
  if (!feed) return;

  const form = $("#post-form");
  const input = $("#post-content");
  const hint = $("#post-hint");

  const state = { posts: [] };

  async function fetchPosts() {
    if (!fb.ready) {
      state.posts = [
        { id: "p1", userName: "Aisha Khan", content: "Anyone up for a weekend JS study swap?", createdAt: Date.now(), likes: 3, comments: 1 },
        { id: "p2", userName: "Rohit Mehta", content: "Looking for feedback on my guitar practice routine.", createdAt: Date.now() - 3600_000, likes: 1, comments: 0 },
      ];
      render();
      return;
    }

    const { db, api } = fb;
    const qy = api.query(api.collection(db, "posts"), api.orderBy("createdAt", "desc"), api.limit(30));
    const snap = await api.getDocs(qy);
    state.posts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render();
  }

  function render() {
    feed.innerHTML = state.posts.map(postHtml).join("");
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (hint) hint.textContent = "";

    const text = input?.value?.trim();
    if (!text) return;

    if (!fb.ready) {
      state.posts.unshift({ id: `local-${Date.now()}`, userName: "You", content: text, createdAt: Date.now(), likes: 0, comments: 0 });
      input.value = "";
      render();
      return;
    }

    const { auth, db, api } = fb;
    const user = auth.currentUser;
    if (!user) {
      if (hint) hint.textContent = "Please log in to post.";
      return;
    }

    try {
      await api.addDoc(api.collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName || "Member",
        content: text,
        likes: 0,
        comments: 0,
        createdAt: api.serverTimestamp(),
      });
      input.value = "";
      await fetchPosts();
    } catch (err) {
      if (hint) hint.textContent = err?.message || "Failed to post. Check Firestore rules.";
    }
  });

  feed.addEventListener("click", async (e) => {
    const likeBtn = e.target?.closest?.("[data-like]");
    if (!likeBtn) return;
    const id = likeBtn.getAttribute("data-like");
    if (!id) return;

    if (!fb.ready) {
      const p = state.posts.find((x) => x.id === id);
      if (p) p.likes = (p.likes || 0) + 1;
      render();
      return;
    }

    const { db, api } = fb;
    try {
      await api.updateDoc(api.doc(db, "posts", id), { likes: api.increment(1) });
      await fetchPosts();
    } catch {
      // ignore
    }
  });

  await fetchPosts();
}


async function loadOfferPage() {
  const form = $("#offer-form");
  if (!form) return;

  const hint = $("#offer-hint");
  const saveBtn = $("#offer-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (hint) hint.textContent = "";

    const data = {
      offeredSkill: $("#offer-skill")?.value?.trim() || "",
      category: $("#offer-category")?.value || "Tech",
      description: $("#offer-desc")?.value?.trim() || "",
      wantedSkill: $("#offer-want")?.value?.trim() || "",
      experience: $("#offer-exp")?.value || "",
      availability: $("#offer-availability")?.value?.trim() || "",
      location: $("#offer-location")?.value?.trim() || "",
    };

    if (!data.offeredSkill || !data.description) return;

    if (!fb.ready) {
      if (hint) hint.textContent = "Saved locally (static mode). Configure Firebase to store in Firestore.";
      form.reset();
      return;
    }

    const { auth, db, api } = fb;
    const user = auth.currentUser;
    if (!user) {
      if (hint) hint.textContent = "Please log in to offer a skill.";
      return;
    }

    saveBtn?.setAttribute("disabled", "");
    try {
      await api.addDoc(api.collection(db, "skills"), {
        title: data.offeredSkill,
        category: data.category,
        about: data.description,
        want: data.wantedSkill,
        level: data.experience,
        mode: data.location ? "In-person" : "Online",
        ownerId: user.uid,
        ownerName: user.displayName || "Member",
        location: data.location || "",
        availability: data.availability || "",
        featured: false,
        createdAt: api.serverTimestamp(),
      });

      await api.setDoc(api.doc(db, "users", user.uid), {
        name: user.displayName || "Member",
        email: user.email || null,
        location: data.location || "",
        availability: data.availability || "",
        category: data.category,
        skillOffered: data.offeredSkill,
        skillWanted: data.wantedSkill,
        experience: data.experience,
        updatedAt: api.serverTimestamp(),
      }, { merge: true });

      form.reset();
      if (hint) hint.textContent = "Published successfully. You can now appear in Browse.";
    } catch (err) {
      if (hint) hint.textContent = err?.message || "Failed to save. Check Firestore rules.";
    } finally {
      saveBtn?.removeAttribute("disabled");
    }
  });
}

async function loadProfilePage() {
  const wrap = $("#profile-wrap");
  if (!wrap) return;

  const shellContent = wrap.innerHTML; // Save the actual profile UI
  const { auth, db, api } = fb;

  function setFields(u) {
    const nameEl = $("#p-name");
    if (!nameEl) return; // UI might be hidden

    nameEl.value = u.name || "";
    $("#p-bio").value = u.bio || "";
    $("#p-location").value = u.location || "";
    $("#p-offered").value = u.skillOffered || u.skillsOffered || u.skills || "";
    $("#p-wanted").value = u.skillWanted || u.skillsWanted || "";
    $("#p-availability").value = u.availability || "";
    $("#p-category").value = u.category || "Tech";
    $("#p-experience").value = u.experience || "";

    $("#profile-name-display").textContent = u.name || "Member";
    $("#profile-loc-display").textContent = u.location || "Remote";
    $("#profile-bio-display").textContent = u.bio || "Add a short bio to help people understand what you teach.";
    $("#profile-avatar").textContent = (u.name || "M").charAt(0).toUpperCase();

    const offeredView = $("#skills-offered-view");
    const wantedView = $("#skills-wanted-view");
    const availabilityView = $("#availability-view");
    const offered = (u.skillOffered || u.skillsOffered || u.skills || "").trim();
    const wanted = (u.skillWanted || u.skillsWanted || "").trim();

    if (offeredView) {
      offeredView.innerHTML = offered
        ? offered.split(",").map((t) => t.trim()).filter(Boolean).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")
        : `<span class="chip muted">No skills offered yet</span>`;
    }
    if (wantedView) {
      wantedView.innerHTML = wanted
        ? wanted.split(",").map((t) => t.trim()).filter(Boolean).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")
        : `<span class="chip muted">No skills wanted yet</span>`;
    }
    if (availabilityView) availabilityView.textContent = u.availability || "Add your availability.";
  }

  async function fetchMe(user) {
    if (!user) {
      wrap.innerHTML = `
        <section class="empty-state glass-panel">
          <h2>Please log in</h2>
          <p class="muted">Log in to view and edit your profile.</p>
          <a class="btn-primary" href="login.html">Go to login</a>
        </section>
      `;
      return;
    }

    // Restore UI and wired events
    wrap.innerHTML = shellContent;
    wireForm();

    const ref = api.doc(db, "users", user.uid);
    const snap = await api.getDoc(ref);
    const data = snap.exists() ? snap.data() : {};
    setFields({
      name: user.displayName || data.name || "Member",
      bio: data.bio || "",
      location: data.location || "",
      skillOffered: data.skillOffered || data.skills || "",
      skillWanted: data.skillWanted || "",
      availability: data.availability || "",
      category: data.category || "Tech",
      experience: data.experience || "",
    });

    loadProfileReviews(user.uid);
  }

  async function loadProfileReviews(uid) {
    const list = $("#profile-reviews-list");
    const section = $("#profile-reviews-section");
    if (!list || !section) return;

    const q = api.query(api.collection(db, "ratings"), api.where("toUid", "==", uid), api.orderBy("createdAt", "desc"));
    
    api.onSnapshot(q, async (snap) => {
      const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (reviews.length === 0) {
        section.setAttribute("hidden", "");
        return;
      }

      section.removeAttribute("hidden");
      
      // Fetch reviewer names
      const reviewerIds = [...new Set(reviews.map(r => r.fromUid))];
      const reviewerNames = {};
      
      for (const rid of reviewerIds) {
        const rsnap = await api.getDoc(api.doc(db, "users", rid));
        if (rsnap.exists()) reviewerNames[rid] = rsnap.data().name || "Member";
      }

      list.innerHTML = reviews.map(r => `
        <div class="review-item">
          <div class="review-head">
            <div class="review-author">${escapeHtml(reviewerNames[r.fromUid] || "Member")}</div>
            <div class="review-stars">
              ${Array.from({ length: 5 }).map((_, i) => `<i class="fa-solid fa-star ${i < r.stars ? "" : "off"}"></i>`).join("")}
            </div>
          </div>
          <p class="review-comment">${escapeHtml(r.comment)}</p>
          <div class="review-date muted">${formatTime(r.createdAt)}</div>
        </div>
      `).join("");
    });
  }

  function wireForm() {
    const form = $("#profile-form");
    const hint = $("#profile-hint");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (hint) hint.textContent = "";

      const user = auth.currentUser;
      if (!user) return;

      const payload = {
        name: $("#p-name").value.trim(),
        bio: $("#p-bio").value.trim(),
        location: $("#p-location").value.trim(),
        skillOffered: $("#p-offered").value.trim(),
        skillWanted: $("#p-wanted").value.trim(),
        availability: $("#p-availability").value.trim(),
        category: $("#p-category").value,
        experience: $("#p-experience").value,
      };

      try {
        await api.setDoc(api.doc(db, "users", user.uid), {
          ...payload,
          email: user.email || null,
          photoURL: user.photoURL || "",
          updatedAt: api.serverTimestamp(),
          createdAt: api.serverTimestamp(),
        }, { merge: true });

        if (payload.name && user.displayName !== payload.name) {
          await api.updateProfile(user, { displayName: payload.name });
        }
        setFields(payload);
        if (hint) hint.textContent = "Profile updated.";
      } catch (err) {
        if (hint) hint.textContent = err?.message || "Failed to update profile.";
      }
    });
  }

  if (!fb.ready) {
    setFields(staticUsers()[0]);
    return;
  }

  // Use a listener so it waits for Firebase to identify the user
  api.onAuthStateChanged(auth, (user) => {
    fetchMe(user);
  });
}

function initNotifications(user) {
  const badge = $("#notif-badge");
  const list = $("#notif-list");
  if (!badge || !user) return;

  const { db, api } = fb;

  const q = api.query(
    api.collection(db, "notifications"),
    api.where("uid", "==", user.uid),
    api.orderBy("createdAt", "desc"),
    api.limit(10)
  );

  api.onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const unreadCount = all.filter((n) => !n.read).length;

    badge.textContent = unreadCount;
    badge.toggleAttribute("hidden", unreadCount === 0);

    if (all.length === 0) {
      list.innerHTML = '<div class="muted center" style="padding: 20px">No notifications</div>';
    } else {
      list.innerHTML = all
        .map(
          (n) => `
        <div class="notif-item" data-notif-id="${n.id}" data-type="${n.type}">
          <i class="fa-solid ${n.type === "message" ? "fa-envelope" : "fa-handshake"}"></i>
          <div>
            <div class="notif-msg" style="${!n.read ? "font-weight: 800;" : ""}">${escapeHtml(n.message)}</div>
            <div class="notif-time">${formatTime(n.createdAt)}</div>
          </div>
        </div>
      `
        )
        .join("");
    }
  });

  list.addEventListener("click", async (e) => {
    const item = e.target.closest(".notif-item");
    if (!item) return;

    const { notifId, type } = item.dataset;
    try {
      await api.updateDoc(api.doc(db, "notifications", notifId), { read: true });
      location.href = type === "message" ? "messages.html" : "requests.html";
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  });
}

async function loadRequestsPage() {
  const incomingList = $("#incoming-list");
  const sentList = $("#sent-list");
  if (!incomingList || !sentList) return;

  if (!fb.ready) return;
  const { auth, db, api } = fb;

  api.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (getPageName() === "requests.html") location.href = "login.html";
      return;
    }

    let incoming = [];
    let sent = [];

    const fetchRequests = async () => {
      try {
        // Fetch incoming
        const qIn = api.query(api.collection(db, "requests"), api.where("toUid", "==", user.uid));
        const snapIn = await api.getDocs(qIn);
        incoming = snapIn.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        // Fetch sent
        const qOut = api.query(api.collection(db, "requests"), api.where("fromUid", "==", user.uid));
        const snapOut = await api.getDocs(qOut);
        sent = snapOut.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        renderIncoming(incoming);
        renderSent(sent);
      } catch (err) {
        console.error("Failed to fetch requests:", err);
      }
    };

    function renderIncoming(list) {
      $("#incoming-empty")?.toggleAttribute("hidden", list.length > 0);
      incomingList.innerHTML = list
        .map(
          (req) => `
        <article class="glass-panel skill-card">
          <div class="skill-top">
            <div>
              <h3 class="skill-title">${escapeHtml(req.fromName)}</h3>
              <div class="muted">Skill: ${escapeHtml(req.skillId)}</div>
            </div>
            <div class="req-status">
               ${
                 req.status !== "pending"
                   ? `<span class="pill status-${req.status}">${req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>`
                   : ""
               }
            </div>
          </div>
          <div class="user-actions" style="display: flex; gap: 10px; margin-top: 15px;">
            ${
              req.status === "pending"
                ? `
              <button class="btn-primary" data-accept="${req.id}" style="padding: 8px 16px; font-size: 0.9rem;">Accept</button>
              <button class="btn-secondary" data-decline="${req.id}" style="padding: 8px 16px; font-size: 0.9rem;">Decline</button>
            `
                : ""
            }
            ${
              req.status === "accepted"
                ? `<button class="btn-primary" data-complete="${req.id}" style="padding: 8px 16px; font-size: 0.9rem;">Mark Complete</button>`
                : ""
            }
          </div>
        </article>
      `
        )
        .join("");
    }

    function renderSent(list) {
      $("#sent-empty")?.toggleAttribute("hidden", list.length > 0);
      sentList.innerHTML = list
        .map(
          (req) => `
        <article class="glass-panel skill-card">
          <div class="skill-top">
            <div>
              <h3 class="skill-title">${escapeHtml(req.toName)}</h3>
              <div class="muted">Skill: ${escapeHtml(req.skillId)}</div>
            </div>
            <span class="pill status-${req.status}">${req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span>
          </div>
          <div class="user-actions" style="margin-top: 15px;">
            ${
              req.status === "accepted"
                ? `<button class="btn-primary" data-complete="${req.id}" style="padding: 8px 16px; font-size: 0.9rem;">Mark Complete</button>`
                : ""
            }
          </div>
          <div id="rating-box-${req.id}" hidden></div>
        </article>
      `
        )
        .join("");
    }

    incomingList.addEventListener("click", async (e) => {
      const accId = e.target.closest("[data-accept]")?.getAttribute("data-accept");
      const decId = e.target.closest("[data-decline]")?.getAttribute("data-decline");
      const completeId = e.target.closest("[data-complete]")?.getAttribute("data-complete");

      if (!accId && !decId && !completeId) return;

      const id = accId || decId || completeId;
      const status = accId ? "accepted" : decId ? "declined" : "completed";
      const btn = e.target.closest("button");
      if (btn) btn.setAttribute("disabled", "");

      try {
        await api.updateDoc(api.doc(db, "requests", id), { status });
        
        // Add notification for the sender
        const req = incoming.find(r => r.id === id);
        if (req && (status === "accepted" || status === "completed")) {
          await api.addDoc(api.collection(db, "notifications"), {
            uid: req.fromUid,
            type: "request",
            message: status === "accepted" 
              ? `${user.displayName || "Someone"} accepted your connection request!` 
              : `${user.displayName || "Someone"} marked your exchange as complete!`,
            refId: id,
            read: false,
            createdAt: api.serverTimestamp(),
          });
        }

        if (status === "completed") {
          showRatingForm(id);
        } else {
          await fetchRequests();
        }
      } catch (err) {
        alert("Operation failed: " + err.message);
        if (btn) btn.removeAttribute("disabled");
      }
    });

    sentList.addEventListener("click", async (e) => {
      const completeId = e.target.closest("[data-complete]")?.getAttribute("data-complete");
      if (!completeId) return;

      const btn = e.target.closest("button");
      btn.setAttribute("disabled", "");

      try {
        await api.updateDoc(api.doc(db, "requests", completeId), { status: "completed" });
        
        // Add notification for the receiver
        const req = sent.find(r => r.id === completeId);
        if (req) {
          await api.addDoc(api.collection(db, "notifications"), {
            uid: req.toUid,
            type: "request",
            message: `${user.displayName || "Someone"} marked the exchange as complete!`,
            refId: completeId,
            read: false,
            createdAt: api.serverTimestamp(),
          });
        }

        showRatingForm(completeId);
      } catch (err) {
        alert("Operation failed: " + err.message);
        btn.removeAttribute("disabled");
      }
    });

    function showRatingForm(reqId) {
      const req = [...incoming.concat(sent)].find((r) => r.id === reqId);
      const toUid = req.fromUid === user.uid ? req.toUid : req.fromUid;
      const toName = req.fromUid === user.uid ? req.toName : req.fromName;

      const box = $(`#rating-box-${reqId}`) || (incomingList.contains($(`[data-accept="${reqId}"]`) || $(`[data-complete="${reqId}"]`)) ? null : null);
      // If we are in sent list, we have a box. If incoming, we just refresh.
      // But for simplicity, let's just use a modal or a generic box.
      // Let's find the card and append.
      const card = document.querySelector(`[data-complete="${reqId}"]`)?.closest("article");
      if (!card) return;

      card.querySelector(".user-actions").innerHTML = '<span class="pill status-accepted">Completed</span>';

      const formHtml = `
        <form class="rating-form" id="form-rating-${reqId}">
          <h4>Rate your experience with ${escapeHtml(toName)}</h4>
          <div class="rating-stars">
            <input type="radio" name="stars" value="5" id="s5-${reqId}" required><label for="s5-${reqId}"><i class="fa-solid fa-star"></i></label>
            <input type="radio" name="stars" value="4" id="s4-${reqId}"><label for="s4-${reqId}"><i class="fa-solid fa-star"></i></label>
            <input type="radio" name="stars" value="3" id="s3-${reqId}"><label for="s3-${reqId}"><i class="fa-solid fa-star"></i></label>
            <input type="radio" name="stars" value="2" id="s2-${reqId}"><label for="s2-${reqId}"><i class="fa-solid fa-star"></i></label>
            <input type="radio" name="stars" value="1" id="s1-${reqId}"><label for="s1-${reqId}"><i class="fa-solid fa-star"></i></label>
          </div>
          <textarea class="input textarea" name="comment" placeholder="Leave a feedback comment..." required></textarea>
          <button type="submit" class="btn-primary" style="width:100%">Submit Rating</button>
        </form>
      `;

      const container = document.createElement("div");
      container.innerHTML = formHtml;
      card.appendChild(container);

      container.querySelector("form").addEventListener("submit", async (fe) => {
        fe.preventDefault();
        const stars = container.querySelector('input[name="stars"]:checked').value;
        const comment = container.querySelector("textarea").value;
        const submitBtn = fe.target.querySelector('button[type="submit"]');

        submitBtn.setAttribute("disabled", "");

        try {
          // Duplicate check
          const dq = api.query(
            api.collection(db, "ratings"),
            api.where("fromUid", "==", user.uid),
            api.where("exchangeId", "==", reqId)
          );
          const dsnap = await api.getDocs(dq);
          if (!dsnap.empty) {
            alert("You have already rated this exchange.");
            return;
          }

          await api.addDoc(api.collection(db, "ratings"), {
            fromUid: user.uid,
            toUid: toUid,
            exchangeId: reqId,
            stars: Number(stars),
            comment,
            createdAt: api.serverTimestamp(),
          });

          container.innerHTML = '<div class="muted" style="padding:10px; text-align:center;">Thank you for your feedback!</div>';
          setTimeout(fetchRequests, 2000);
        } catch (error) {
          alert("Submission failed: " + error.message);
          submitBtn.removeAttribute("disabled");
        }
      });
    }

    await fetchRequests();
  });
}

async function loadMessagesPage() {
  const chatList = $("#chat-list");
  const chatWindow = $("#chat-window");
  const chatEmpty = $("#chat-empty");
  const msgFeed = $("#messages-feed");
  const msgForm = $("#message-form");
  const msgInput = $("#message-input");

  if (!chatList) return;
  if (!fb.ready) return;

  const { auth, db, api } = fb;
  let activeChatId = null;
  let unsubMessages = null;
  let unsubChats = null;

  function renderChatList(chats, user) {
    if (chats.length === 0) {
      chatList.innerHTML = '<div class="muted" style="padding: 20px; text-align: center;">No conversations yet.</div>';
      return;
    }

    chatList.innerHTML = chats
      .map((chat) => {
        const otherUid = chat.participants.find((id) => id !== user.uid);
        const name = chat.participantNames?.[otherUid] || "Member";
        return `
        <div class="chat-item ${chat.id === activeChatId ? "active" : ""}" data-chat-id="${chat.id}">
          <div class="avatar small">${name.charAt(0).toUpperCase()}</div>
          <div class="chat-item-info">
            <div class="chat-item-name">${escapeHtml(name)}</div>
            <div class="chat-item-last">${escapeHtml(chat.lastMessage || "No messages yet")}</div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  async function openChat(chatId, user) {
    if (unsubMessages) unsubMessages();
    activeChatId = chatId;

    chatEmpty.setAttribute("hidden", "");
    chatWindow.removeAttribute("hidden");

    const items = chatList.querySelectorAll(".chat-item");
    items.forEach((it) => it.classList.toggle("active", it.dataset.chatId === chatId));

    const activeItem = chatList.querySelector(`[data-chat-id="${chatId}"]`);
    if (activeItem) {
      $("#active-chat-name").textContent = activeItem.querySelector(".chat-item-name").textContent;
      $("#active-chat-avatar").textContent = activeItem.querySelector(".avatar").textContent;
    } else {
      try {
        const snap = await api.getDoc(api.doc(db, "chats", chatId));
        if (snap.exists()) {
          const data = snap.data();
          const otherUid = data.participants.find(id => id !== user.uid);
          const name = data.participantNames?.[otherUid] || "Member";
          $("#active-chat-name").textContent = name;
          $("#active-chat-avatar").textContent = name.charAt(0).toUpperCase();
        }
      } catch (e) {
        console.error("Failed to fetch chat details:", e);
      }
    }

    const mq = api.query(api.collection(db, `chats/${chatId}/messages`), api.orderBy("timestamp", "asc"));
    unsubMessages = api.onSnapshot(mq, (snap) => {
      const messages = snap.docs.map((d) => d.data());
      renderMessages(messages, user);
    });
  }

  function renderMessages(list, user) {
    msgFeed.innerHTML = list
      .map((m) => {
        let timeStr = "";
        if (m.timestamp) {
          const date = m.timestamp.seconds ? new Date(m.timestamp.seconds * 1000) : (m.timestamp.toDate ? m.timestamp.toDate() : new Date(m.timestamp));
          timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        return `
          <div class="msg ${m.senderId === user.uid ? "sent" : "received"}">
            <div>${escapeHtml(m.text)}</div>
            ${timeStr ? `<span class="msg-time">${timeStr}</span>` : ""}
          </div>
        `;
      })
      .join("");
    msgFeed.scrollTop = msgFeed.scrollHeight;
  }

  chatList.addEventListener("click", (e) => {
    const item = e.target.closest(".chat-item");
    const user = auth.currentUser;
    if (item && user) {
      openChat(item.dataset.chatId, user);
    }
  });

  msgForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const text = msgInput.value.trim();
    if (!text || !activeChatId || !user) return;

    msgInput.value = "";
    try {
      await api.addDoc(api.collection(db, `chats/${activeChatId}/messages`), {
        senderId: user.uid,
        text: text,
        timestamp: api.serverTimestamp(),
      });

      await api.updateDoc(api.doc(db, "chats", activeChatId), {
        lastMessage: text,
        lastUpdated: api.serverTimestamp(),
      });

      const snap = await api.getDoc(api.doc(db, "chats", activeChatId));
      if (snap.exists()) {
        const chatData = snap.data();
        const otherUid = chatData.participants.find((id) => id !== user.uid);
        await api.addDoc(api.collection(db, "notifications"), {
          uid: otherUid,
          type: "message",
          message: `New message from ${user.displayName || "Member"}`,
          refId: activeChatId,
          read: false,
          createdAt: api.serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Send failed:", err);
    }
  });

  api.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (getPageName() === "messages.html") location.href = "login.html";
      return;
    }

    if (unsubChats) unsubChats();

    const q = api.query(api.collection(db, "chats"), api.where("participants", "array-contains", user.uid));
    
    unsubChats = api.onSnapshot(q, (snap) => {
      const chats = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0));
      renderChatList(chats, user);

      const paramChatId = getParam("chat");
      if (paramChatId && !activeChatId) {
        setTimeout(() => openChat(paramChatId, user), 100);
      }
    }, (err) => {
      console.error("Chats listener failed:", err);
      chatList.innerHTML = '<div class="muted" style="padding: 20px; text-align: center;">Error loading chats.</div>';
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  renderNavbar();
  wireHomePageLinks();

  if (!fb.ready) {
    setAuthUI(null);
  }
  await wireAuth();

  await Promise.all([
    loadCounts(),
    loadBrowse(),
    loadBrowseUsers(),
    loadCommunityPage(),
    loadOfferPage(),
    loadProfilePage(),
    loadRequestsPage(),
    loadMessagesPage(),
  ]);
});
