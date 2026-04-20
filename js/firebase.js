import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getCountFromServer,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";

export function initFirebase() {
  if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_API_KEY") {
    return { ready: false, reason: "missing-config" };
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();

  return {
    ready: true,
    app,
    auth,
    db,
    googleProvider,
    api: {
      onAuthStateChanged,
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signInWithPopup,
      signOut,
      updateProfile,
      addDoc,
      arrayUnion,
      collection,
      doc,
      getDoc,
      getCountFromServer,
      getDocs,
      increment,
      limit,
      onSnapshot,
      orderBy,
      query,
      serverTimestamp,
      setDoc,
      updateDoc,
      where,
    },
  };
}

