/*
 * BE ONLY ONE
 * File: assets/js/firebase-config.js
 * Purpose: Firebase initialization for browser modules
 */

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDaYNxk89vnvc-SHrTNfNrQ0gJCYdnrBOI",
  authDomain: "createyourownidentity-2e2a3.firebaseapp.com",
  projectId: "createyourownidentity-2e2a3",
  storageBucket: "createyourownidentity-2e2a3.firebasestorage.app",
  messagingSenderId: "316875593955",
  appId: "1:316875593955:web:529cb0fe3c45f2cca54dd6",
  measurementId: "G-LXVR8CJWRE"
};

// Reuse the existing Firebase app if already initialized.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export only the services and functions this website needs.
export {
  app,
  auth,
  db,
  storage,

  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,

  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,

  ref,
  uploadBytes,
  getDownloadURL
};
