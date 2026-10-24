/* =========================================================
   BE ONLY ONE
   File: assets/js/app.js

   Connected services:
   - Firebase Authentication
   - Firestore user profiles and content metadata
   - Cloudinary media uploads
   - Existing navigation, tutorial and feature dialogs

   Required sibling files:
   ./firebase-config.js
   ./cloudinary-config.js
   ========================================================= */

import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "./firebase-config.js";

import {
  uploadMedia
} from "./cloudinary-config.js";

const App = (() => {
  "use strict";

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const state = {
    authMode: "login",
    tutorialStep: 0,
    activeFeature: null,
    currentUser: null,
    uploading: false
  };

  const tutorialSteps = [
    {
      label: "WELCOME",
      icon: "♡",
      title: "Welcome to BE ONLY ONE",
      description:
        "Express your feelings, discover music, create your identity, and connect with others."
    },
    {
      label: "FEEL",
      icon: "♡",
      title: "Express your feelings",
      description:
        "Share thoughts, moods, stories, photos and short videos."
    },
    {
      label: "CREATE",
      icon: "♫",
      title: "Discover music and moods",
      description:
        "Upload audio and connect music with your stories and memories."
    },
    {
      label: "CONNECT",
      icon: "✦",
      title: "Build your identity",
      description:
        "Create your profile and discover respectful connections."
    }
  ];

  const featureDetails = {
    feelings: {
      label: "01 / FEEL",
      title: "Listen My Feelings",
      description:
        "Share your thoughts, moods, stories, photos and short videos.",
      steps: [
        "Choose a mood and write your thoughts.",
        "Optionally attach a photo or short video.",
        "Review your content before publishing."
      ]
    },
    music: {
      label: "02 / CREATE",
      title: "Music & Mood",
      description:
        "Upload audio and connect music with your memories.",
      steps: [
        "Choose an audio file.",
        "Upload it to Cloudinary.",
        "Save its metadata to Firestore."
      ]
    },
    identity: {
      label: "03 / EXPRESS",
      title: "Create Your Identity",
      description:
        "Build a personal profile that reflects your interests and story.",
      steps: [
        "Choose your display name.",
        "Add a bio and interests.",
        "Review your privacy settings."
      ]
    },
    community: {
      label: "04 / CONNECT",
      title: "Connect & Understand",
      description:
        "Explore community content and build respectful connections.",
      steps: [
        "Explore available content.",
        "Interact respectfully.",
        "Use blocking and reporting tools when needed."
      ]
    }
  };

  function showMessage(message, type = "info") {
    const node = $("#auth-message");

    if (!node) {
      console[type === "error" ? "error" : "info"](message);
      window.alert(message);
      return;
    }

    node.textContent = message;
    node.hidden = false;
    node.dataset.type = type;
  }

  function clearMessage() {
    const node = $("#auth-message");
    if (!node) return;

    node.textContent = "";
    node.hidden = true;
    delete node.dataset.type;
  }

  function friendlyError(error) {
    const messages = {
      "auth/email-already-in-use":
        "Ee email tho account already undi. Log in try cheyyi.",
      "auth/invalid-email":
        "Valid email address enter cheyyi.",
      "auth/invalid-credential":
        "Email leda password correct ga ledu.",
      "auth/user-not-found":
        "Ee email tho account dorakaledu.",
      "auth/wrong-password":
        "Password correct ga ledu.",
      "auth/weak-password":
        "Stronger password use cheyyi.",
      "auth/too-many-requests":
        "Chala attempts ayyayi. Konchem sepu tarvatha try cheyyi.",
      "auth/network-request-failed":
        "Internet connection check chesi malli try cheyyi.",
      "auth/operation-not-allowed":
        "Firebase Console lo Email/Password sign-in enable cheyyali.",
      "permission-denied":
        "Firestore permission deny ayyindi. Security rules check cheyyali."
    };

    return messages[error?.code] ||
      error?.message ||
      "Unexpected error. Please try again.";
  }

  function openDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }

    document.body.classList.add("dialog-open");
  }

  function closeDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }

    if (!document.querySelector("dialog[open]")) {
      document.body.classList.remove("dialog-open");
    }
  }

  /* -------------------- ACCOUNT MENU -------------------- */

  function setMenuOpen(open) {
    const menu = $("#account-menu");
    const toggle = $("#menu-toggle");

    if (!menu || !toggle) return;

    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu"
    );
  }

  function initAccountMenu() {
    const toggle = $("#menu-toggle");
    const menu = $("#account-menu");

    toggle?.addEventListener("click", () => {
      setMenuOpen(Boolean(menu?.hidden));
    });

    document.addEventListener("click", (event) => {
      if (!menu || menu.hidden) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      if (!menu.contains(target) && !toggle?.contains(target)) {
        setMenuOpen(false);
      }
    });

    menu?.addEventListener("click", (event) => {
      if (event.target instanceof Element &&
          event.target.closest("a")) {
        setMenuOpen(false);
      }
    });
  }

  /* -------------------- AUTHENTICATION -------------------- */

  function setAuthMode(mode) {
    state.authMode = mode === "signup" ? "signup" : "login";
    const signup = state.authMode === "signup";

    const setText = (selector, text) => {
      const node = $(selector);
      if (node) node.textContent = text;
    };

    setText("#auth-title",
      signup ? "Create your account" : "Welcome back");

    setText("#auth-description",
      signup
        ? "Create your BE ONLY ONE account."
        : "Sign in to continue to BE ONLY ONE.");

    setText("#auth-submit",
      signup ? "Create account" : "Log in");

    setText("#auth-switch-text",
      signup ? "Already have an account?" : "New here?");

    setText("#auth-mode-toggle",
      signup ? "Log in" : "Create an account");

    const name = $("#auth-display-name");
    const nameLabel = $("#display-name-label");
    const password = $("#auth-password");
    const forgot = $('[data-action="forgot-password"]');

    if (name) {
      name.hidden = !signup;
      name.required = signup;
      name.autocomplete = "nickname";
    }

    if (nameLabel) nameLabel.hidden = !signup;

    if (password) {
      password.autocomplete = signup
        ? "new-password"
        : "current-password";
    }

    if (forgot) forgot.hidden = signup;

    clearMessage();
  }

  function openAuth(mode = "login") {
    setMenuOpen(false);
    setAuthMode(mode);
    openDialog($("#auth-dialog"));
    $("#auth-email")?.focus();
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    const form = $("#auth-form");
    if (!form || !form.reportValidity()) return;

    const email = $("#auth-email")?.value.trim();
    const password = $("#auth-password")?.value;
    const displayName = $("#auth-display-name")?.value.trim();

    if (!email || !password) return;

    const submit = $("#auth-submit");
    if (submit) submit.disabled = true;

    clearMessage();

    try {
      if (state.authMode === "signup") {
        if (!displayName) {
          throw new Error("Please enter your display name.");
        }

        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        await updateProfile(result.user, { displayName });

        await setDoc(
          doc(db, "users", result.user.uid),
          {
            uid: result.user.uid,
            email: result.user.email,
            displayName,
            bio: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );

        closeDialog($("#auth-dialog"));
        form.reset();
        showMessage("Account created successfully.", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        closeDialog($("#auth-dialog"));
        form.reset();
        showMessage("Logged in successfully.", "success");
      }
    } catch (error) {
      showMessage(friendlyError(error), "error");
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  async function handleForgotPassword() {
    const email = $("#auth-email")?.value.trim();

    if (!email) {
      showMessage("Munduga email address enter cheyyi.", "warning");
      $("#auth-email")?.focus();
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showMessage(
        "If the account exists, password reset instructions have been sent.",
        "success"
      );
    } catch (error) {
      showMessage(friendlyError(error), "error");
    }
  }

  async function handleLogout() {
    setMenuOpen(false);

    try {
      await signOut(auth);
      showMessage("You have been logged out.", "success");
    } catch (error) {
      showMessage(friendlyError(error), "error");
    }
  }

  function initAuth() {
    $("#header-login-button")?.addEventListener("click", () => {
      if (state.currentUser) {
        setMenuOpen(true);
      } else {
        openAuth("login");
      }
    });

    $("#auth-mode-toggle")?.addEventListener("click", () => {
      setAuthMode(state.authMode === "login" ? "signup" : "login");
    });

    $("#auth-form")?.addEventListener("submit", handleAuthSubmit);

    $('[data-action="forgot-password"]')?.addEventListener(
      "click",
      handleForgotPassword
    );

    $('[data-action="close-auth"]')?.addEventListener("click", () => {
      closeDialog($("#auth-dialog"));
    });

    $("#logout-button")?.addEventListener("click", handleLogout);
  }

  async function syncUserProfile(user) {
    const nameNode = $("#profile-display-name");
    const bioNode = $("#profile-bio");
    const avatarNode = $("#profile-avatar");

    if (!user) {
      if (nameNode) nameNode.textContent = "Your identity starts here";
      if (bioNode) bioNode.textContent = "Your story, your way.";
      if (avatarNode) avatarNode.textContent = "♡";
      return;
    }

    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      const profile = snapshot.exists() ? snapshot.data() : {};

      const displayName =
        profile.displayName || user.displayName || "BE ONLY ONE Member";

      if (nameNode) nameNode.textContent = displayName;
      if (bioNode) bioNode.textContent = profile.bio || "Add your story.";
      if (avatarNode) {
        avatarNode.textContent =
          displayName.trim().charAt(0).toUpperCase() || "♡";
      }
    } catch (error) {
      console.error("Could not load user profile:", error);
      if (nameNode) {
        nameNode.textContent = user.displayName || "Your profile";
      }
    }
  }

  function initAuthState() {
    onAuthStateChanged(auth, async (user) => {
      state.currentUser = user;

      const loginButton = $("#header-login-button");
      if (loginButton) {
        loginButton.textContent = user
          ? (user.displayName || "My account")
          : "Log in";
      }

      await syncUserProfile(user);
    });
  }

  /* -------------------- TUTORIAL -------------------- */

  function renderTutorialStep() {
    const step = tutorialSteps[state.tutorialStep];
    if (!step) return;

    const setText = (selector, value) => {
      const node = $(selector);
      if (node) node.textContent = value;
    };

    setText("#tutorial-step-label", step.label);
    setText("#tutorial-visual", step.icon);
    setText("#tutorial-title", step.title);
    setText("#tutorial-description", step.description);

    const progress = $("#tutorial-progress");
    if (progress) {
      $$(".progress-dot", progress).forEach((dot, index) => {
        const active = index === state.tutorialStep;
        dot.classList.toggle("active", active);

        if (active) dot.setAttribute("aria-current", "step");
        else dot.removeAttribute("aria-current");
      });
    }

    const next = $('[data-action="next-tutorial"]');
    if (next) {
      next.textContent =
        state.tutorialStep === tutorialSteps.length - 1
          ? "Finish"
          : "Next";
    }
  }

  function openTutorial() {
    state.tutorialStep = 0;
    renderTutorialStep();
    setMenuOpen(false);
    openDialog($("#tutorial-dialog"));
  }

  function nextTutorialStep() {
    if (state.tutorialStep < tutorialSteps.length - 1) {
      state.tutorialStep += 1;
      renderTutorialStep();
      return;
    }

    closeDialog($("#tutorial-dialog"));

    const status = $("#tutorial-status");
    if (status) {
      status.textContent = "Introduction completed.";
    }
  }

  function skipTutorial() {
    closeDialog($("#tutorial-dialog"));

    const status = $("#tutorial-status");
    if (status) status.textContent = "Introduction skipped.";
  }

  function initTutorial() {
    $('[data-action="view-features"]')?.addEventListener(
      "click", openTutorial
    );

    $('[data-action="next-tutorial"]')?.addEventListener(
      "click", nextTutorialStep
    );

    $$('[data-action="skip-tutorial"]').forEach((button) => {
      button.addEventListener("click", skipTutorial);
    });

    $('[data-action="close-tutorial"]')?.addEventListener(
      "click", () => closeDialog($("#tutorial-dialog"))
    );
  }

  /* -------------------- CLOUDINARY / CONTENT -------------------- */

  function createElement(tag, attributes = {}, text = "") {
    const node = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "className") node.className = value;
      else if (key === "hidden") node.hidden = Boolean(value);
      else node.setAttribute(key, value);
    });

    if (text) node.textContent = text;
    return node;
  }

  function requireLogin() {
    if (state.currentUser) return true;

    closeDialog($("#feature-dialog"));
    openAuth("login");
    showMessage("Munduga login avvu, bro.", "warning");
    return false;
  }

  function renderUploadPanel(featureKey) {
    const dialog = $("#feature-dialog");
    if (!dialog) return;

    let panel = $("#feature-upload-panel", dialog);

    if (!panel) {
      panel = createElement("section", {
        id: "feature-upload-panel",
        className: "feature-upload-panel"
      });

      const steps = $("#feature-dialog-steps", dialog);
      if (steps) steps.insertAdjacentElement("afterend", panel);
      else dialog.appendChild(panel);
    }

    panel.replaceChildren();

    if (featureKey === "feelings") {
      panel.appendChild(createElement("h3", {}, "Share a feeling"));

      const mood = createElement("input", {
        id: "feeling-mood",
        type: "text",
        maxlength: "40",
        placeholder: "Mood (e.g. hopeful)"
      });

      const text = createElement("textarea", {
        id: "feeling-text",
        maxlength: "5000",
        rows: "4",
        placeholder: "Write what is on your mind..."
      });

      const visibility = createElement("select", {
        id: "feeling-visibility",
        "aria-label": "Post visibility"
      });

      visibility.append(
        new Option("Public", "public"),
        new Option("Private", "private")
      );

      const file = createElement("input", {
        id: "feeling-media",
        type: "file",
        accept: "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
      });

      panel.append(
        mood,
        text,
        createElement("label", { for: "feeling-visibility" }, "Visibility"),
        visibility,
        createElement("label", { for: "feeling-media" }, "Optional photo/video"),
        file
      );

      panel.appendChild(createElement("p", {},
        "Photo max 10 MB; video max 50 MB and 30 seconds."));

      const publish = createElement("button", {
        type: "button",
        className: "button button-primary",
        "data-action": "publish-feeling"
      }, "Publish feeling");

      publish.addEventListener("click", publishFeeling);
      panel.appendChild(publish);
    }

    if (featureKey === "music") {
      panel.appendChild(createElement("h3", {}, "Upload audio"));

      const title = createElement("input", {
        id: "music-title",
        type: "text",
        maxlength: "120",
        placeholder: "Track title",
        required: "required"
      });

      const file = createElement("input", {
        id: "music-file",
        type: "file",
        accept: "audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav"
      });

      const visibility = createElement("select", {
        id: "music-visibility",
        "aria-label": "Track visibility"
      });

      visibility.append(
        new Option("Public", "public"),
        new Option("Private", "private")
      );

      panel.append(
        title,
        createElement("label", { for: "music-file" }, "Choose audio file"),
        file,
        createElement("label", { for: "music-visibility" }, "Visibility"),
        visibility
      );

      const publish = createElement("button", {
        type: "button",
        className: "button button-primary"
      }, "Upload audio");

      publish.addEventListener("click", publishMusic);
      panel.appendChild(publish);
    }

    const status = createElement("p", {
      id: "media-upload-status",
      role: "status",
      "aria-live": "polite"
    });

    panel.appendChild(status);
  }

  async function uploadSelectedFile(file, statusNode) {
    if (!file) {
      throw new Error("Munduga file select cheyyi.");
    }

    if (state.uploading) {
      throw new Error("Upload already running. Please wait.");
    }

    state.uploading = true;
    if (statusNode) statusNode.textContent = "Uploading media...";

    try {
      const result = await uploadMedia(file, (progress) => {
        if (statusNode) {
          statusNode.textContent = `Uploading... ${progress}%`;
        }
      });

      if (!result?.secureUrl) {
        throw new Error("Cloudinary did not return a media URL.");
      }

      return result;
    } finally {
      state.uploading = false;
    }
  }

  async function publishFeeling() {
    if (!requireLogin()) return;

    const mood = $("#feeling-mood")?.value.trim() || "";
    const text = $("#feeling-text")?.value.trim() || "";
    const visibility = $("#feeling-visibility")?.value || "private";
    const file = $("#feeling-media")?.files?.[0] || null;
    const status = $("#media-upload-status");

    if (!text && !file) {
      if (status) status.textContent = "Write a feeling or select media first.";
      return;
    }

    try {
      let media = null;

      if (file) {
        media = await uploadSelectedFile(file, status);
      }

      await addDoc(collection(db, "feelings"), {
        authorId: state.currentUser.uid,
        authorName: state.currentUser.displayName || "Member",
        text,
        mood,
        topic: "feelings",
        visibility,
        status: "published",
        mediaUrl: media?.secureUrl || null,
        mediaPublicId: media?.publicId || null,
        mediaType: media?.resourceType || null,
        mediaFormat: media?.format || null,
        createdAt: serverTimestamp()
      });

      if (status) {
        status.textContent = "Feeling saved successfully.";
      }

      const textInput = $("#feeling-text");
      const moodInput = $("#feeling-mood");
      const fileInput = $("#feeling-media");

      if (textInput) textInput.value = "";
      if (moodInput) moodInput.value = "";
      if (fileInput) fileInput.value = "";

      await loadFeelings();
    } catch (error) {
      console.error("Publish feeling failed:", error);
      if (status) status.textContent = friendlyError(error);
    }
  }

  async function publishMusic() {
    if (!requireLogin()) return;

    const title = $("#music-title")?.value.trim();
    const file = $("#music-file")?.files?.[0];
    const visibility = $("#music-visibility")?.value || "private";
    const status = $("#media-upload-status");

    if (!title || !file) {
      if (status) status.textContent = "Enter a track title and choose audio.";
      return;
    }

    if (!file.type.startsWith("audio/")) {
      if (status) status.textContent = "Please choose an audio file.";
      return;
    }

    try {
      const media = await uploadSelectedFile(file, status);

      await addDoc(collection(db, "music"), {
        authorId: state.currentUser.uid,
        title,
        visibility,
        mediaUrl: media.secureUrl,
        mediaPublicId: media.publicId,
        mediaType: media.resourceType,
        mediaFormat: media.format || null,
        bytes: media.bytes,
        createdAt: serverTimestamp()
      });

      if (status) status.textContent = "Audio uploaded and metadata saved.";

      const titleInput = $("#music-title");
      const fileInput = $("#music-file");
      if (titleInput) titleInput.value = "";
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Audio upload failed:", error);
      if (status) status.textContent = friendlyError(error);
    }
  }

  async function loadFeelings() {
    const list = $("#feed-list");
    const stateNode = $("#feed-state");

    if (!list) return;

    if (stateNode) stateNode.textContent = "Loading feelings...";
    list.replaceChildren();

    // The query is intentionally avoided here because existing Firestore
    // security rules and indexes have not yet been inspected.
    // Reading the collection still requires appropriate read rules.
    try {
      const { getDocs } = await import(
        "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js"
      );

      const snapshot = await getDocs(collection(db, "feelings"));
      const items = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) =>
          item.visibility === "public" ||
          item.authorId === state.currentUser?.uid
        )
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        })
        .slice(0, 30);

      if (!items.length) {
        if (stateNode) {
          stateNode.textContent = "No feelings to show yet.";
        }
        return;
      }

      items.forEach((item) => {
        const article = createElement("article", {
          className: "feed-card"
        });

        const author = createElement("p", {
          className: "feed-author"
        }, item.authorName || "BE ONLY ONE Member");

        const mood = createElement("p", {
          className: "feed-mood"
        }, item.mood || "");

        const content = createElement("p", {
          className: "feed-text"
        }, item.text || "");

        article.append(author);

        if (item.mood) article.append(mood);
        if (item.text) article.append(content);

        if (item.mediaUrl && item.mediaType === "image") {
          const image = createElement("img", {
            src: item.mediaUrl,
            alt: "Shared feeling media",
            loading: "lazy"
          });
          article.appendChild(image);
        } else if (item.mediaUrl && item.mediaType === "video") {
          const video = createElement("video", {
            src: item.mediaUrl,
            controls: "controls",
            preload: "metadata"
          });
          article.appendChild(video);
        }

        list.appendChild(article);
      });

      if (stateNode) stateNode.textContent = "";
    } catch (error) {
      console.error("Loading feelings failed:", error);
      if (stateNode) {
        stateNode.textContent =
          "Feed could not load. Check Firestore read permissions.";
      }
    }
  }

  /* -------------------- FEATURE DETAILS -------------------- */

  function openFeature(featureKey) {
    const feature = featureDetails[featureKey];

    if (!feature) {
      showMessage("Feature not found.", "warning");
      return;
    }

    state.activeFeature = featureKey;

    const setText = (selector, value) => {
      const node = $(selector);
      if (node) node.textContent = value;
    };

    setText("#feature-dialog-eyebrow", feature.label);
    setText("#feature-dialog-title", feature.title);
    setText("#feature-dialog-description", feature.description);

    const list = $("#feature-dialog-steps");

    if (list) {
      list.replaceChildren();

      feature.steps.forEach((step) => {
        list.appendChild(createElement("li", {}, step));
      });
    }

    renderUploadPanel(featureKey);
    openDialog($("#feature-dialog"));
  }

  function initFeatureDialogs() {
    $$('[data-action="learn-feature"]').forEach((button) => {
      button.addEventListener("click", () => {
        openFeature(button.dataset.feature);
      });
    });

    $$('[data-action="close-feature"]').forEach((button) => {
      button.addEventListener("click", () => {
        closeDialog($("#feature-dialog"));
      });
    });
  }

  /* -------------------- PROFILE -------------------- */

  async function editProfile() {
    if (!requireLogin()) return;

    try {
      const snapshot = await getDoc(
        doc(db, "users", state.currentUser.uid)
      );

      const current = snapshot.exists() ? snapshot.data() : {};
      const newName = window.prompt(
        "Display name:",
        current.displayName || state.currentUser.displayName || ""
      );

      if (newName === null) return;

      const displayName = newName.trim();
      if (!displayName) {
        showMessage("Display name cannot be empty.", "warning");
        return;
      }

      const bio = window.prompt(
        "Short bio:",
        current.bio || ""
      );

      if (bio === null) return;

      await updateProfile(state.currentUser, { displayName });

      await setDoc(
        doc(db, "users", state.currentUser.uid),
        {
          uid: state.currentUser.uid,
          email: state.currentUser.email,
          displayName,
          bio: bio.trim().slice(0, 500),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      await syncUserProfile(state.currentUser);
      showMessage("Profile updated.", "success");
    } catch (error) {
      console.error("Profile update failed:", error);
      showMessage(friendlyError(error), "error");
    }
  }

  function initGeneralActions() {
    $$('[data-action="get-started"]').forEach((button) => {
      button.addEventListener("click", () => {
        openAuth("signup");
      });
    });

    $('[data-action="edit-profile"]')?.addEventListener(
      "click",
      editProfile
    );
  }

  function initNavigation() {
    const links = $$(".main-nav .nav-link");

    links.forEach((link) => {
      link.addEventListener("click", () => {
        links.forEach((item) => {
          item.classList.remove("active");
          item.removeAttribute("aria-current");
        });

        link.classList.add("active");
        link.setAttribute("aria-current", "location");
        setMenuOpen(false);
      });
    });
  }

  function initDialogs() {
    $$("dialog").forEach((dialog) => {
      dialog.addEventListener("close", () => {
        if (!document.querySelector("dialog[open]")) {
          document.body.classList.remove("dialog-open");
        }
      });

      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;

        const rect = dialog.getBoundingClientRect();
        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (!inside) closeDialog(dialog);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });
  }

  function initCurrentYear() {
    const year = $("#current-year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function init() {
    initAccountMenu();
    initAuth();
    initTutorial();
    initFeatureDialogs();
    initGeneralActions();
    initNavigation();
    initDialogs();
    initCurrentYear();
    initAuthState();

    setAuthMode("login");
    renderTutorialStep();
    setMenuOpen(false);

    console.info("BE ONLY ONE initialized.");
  }

  return { init };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", App.init, { once: true });
} else {
  App.init();
}
