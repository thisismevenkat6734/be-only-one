/* =========================================================
   BE ONLY ONE
   File: assets/js/app.js

   Handles:
   - Account menu
   - Login/signup dialog UI
   - Tutorial navigation
   - Feature information dialogs
   - Page navigation and basic accessibility

   IMPORTANT:
   Firebase Authentication, Firestore and Cloudinary are
   not connected by this file. Authentication is not faked.
   ========================================================= */

const App = (() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const state = {
    authMode: "login",
    tutorialStep: 0,
    activeFeature: null
  };

  const tutorialSteps = [
    {
      label: "WELCOME",
      icon: "♡",
      title: "Welcome to BE ONLY ONE",
      description:
        "A space to express your feelings, discover music, " +
        "create your identity, and connect with others."
    },
    {
      label: "FEEL",
      icon: "♡",
      title: "Express your feelings",
      description:
        "Share emotions, moods, thoughts, stories, photos, " +
        "and short videos when the sharing feature is connected."
    },
    {
      label: "CREATE",
      icon: "♫",
      title: "Discover music and moods",
      description:
        "Explore music, save favourites, and connect songs " +
        "with your memories and stories when audio features are enabled."
    },
    {
      label: "CONNECT",
      icon: "✦",
      title: "Build your own identity",
      description:
        "Create a profile, express your interests, and discover " +
        "respectful connections with privacy and safety in mind."
    }
  ];

  const featureDetails = {
    feelings: {
      label: "01 / FEEL",
      title: "Listen My Feelings",
      description:
        "A space for thoughts, emotions, moods, stories, photos, " +
        "and short videos.",
      steps: [
        "Choose how you want to express yourself.",
        "Write a story or select a mood.",
        "Review your privacy before sharing."
      ]
    },

    music: {
      label: "02 / CREATE",
      title: "Music & Mood",
      description:
        "Bring music and emotions together in one personal space.",
      steps: [
        "Discover available audio.",
        "Save music you enjoy.",
        "Connect music with your memories and feelings."
      ]
    },

    identity: {
      label: "03 / EXPRESS",
      title: "Create Your Identity",
      description:
        "Build a personal profile that reflects your interests and story.",
      steps: [
        "Choose your display name.",
        "Add a bio and your interests.",
        "Review your profile visibility and privacy."
      ]
    },

    community: {
      label: "04 / CONNECT",
      title: "Connect & Understand",
      description:
        "Discover community stories and build respectful connections.",
      steps: [
        "Explore content available to you.",
        "Interact respectfully with other people.",
        "Use blocking and reporting tools if needed."
      ]
    }
  };

  function showMessage(message, type = "info") {
    const authMessage = $("#auth-message");

    if (!authMessage) {
      window.alert(message);
      return;
    }

    authMessage.textContent = message;
    authMessage.hidden = false;
    authMessage.dataset.type = type;
  }

  function clearMessage() {
    const authMessage = $("#auth-message");

    if (!authMessage) return;

    authMessage.textContent = "";
    authMessage.hidden = true;
    delete authMessage.dataset.type;
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

  function closeAllDialogs() {
    $$("dialog[open]").forEach(closeDialog);
    document.body.classList.remove("dialog-open");
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

  function toggleMenu() {
    const menu = $("#account-menu");

    if (!menu) return;

    setMenuOpen(menu.hidden);
  }

  function initAccountMenu() {
    const toggle = $("#menu-toggle");
    const menu = $("#account-menu");

    toggle?.addEventListener("click", toggleMenu);

    document.addEventListener("click", (event) => {
      if (!menu || menu.hidden) return;

      const target = event.target;

      if (!(target instanceof Element)) return;

      if (!menu.contains(target) && !toggle?.contains(target)) {
        setMenuOpen(false);
      }
    });

    menu?.addEventListener("click", (event) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      if (target.closest("a")) {
        setMenuOpen(false);
      }
    });
  }

  /* -------------------- AUTH DIALOG UI -------------------- */

  function setAuthMode(mode) {
    state.authMode = mode === "signup" ? "signup" : "login";

    const isSignup = state.authMode === "signup";

    const title = $("#auth-title");
    const description = $("#auth-description");
    const displayName = $("#auth-display-name");
    const displayNameLabel = $("#display-name-label");
    const password = $("#auth-password");
    const submit = $("#auth-submit");
    const switchText = $("#auth-switch-text");
    const switchButton = $("#auth-mode-toggle");
    const forgotButton = $('[data-action="forgot-password"]');

    if (title) {
      title.textContent = isSignup
        ? "Create your account"
        : "Welcome back";
    }

    if (description) {
      description.textContent = isSignup
        ? "Create your BE ONLY ONE account."
        : "Sign in to continue to BE ONLY ONE.";
    }

    if (displayName) {
      displayName.hidden = !isSignup;
      displayName.required = isSignup;
      displayName.autocomplete = "nickname";
    }

    if (displayNameLabel) {
      displayNameLabel.hidden = !isSignup;
    }

    if (password) {
      password.autocomplete = isSignup
        ? "new-password"
        : "current-password";
    }

    if (submit) {
      submit.textContent = isSignup
        ? "Create account"
        : "Log in";
    }

    if (switchText) {
      switchText.textContent = isSignup
        ? "Already have an account?"
        : "New here?";
    }

    if (switchButton) {
      switchButton.textContent = isSignup
        ? "Log in"
        : "Create an account";
    }

    if (forgotButton) {
      forgotButton.hidden = isSignup;
    }

    clearMessage();
  }

  function openAuth(mode = "login") {
    setMenuOpen(false);
    setAuthMode(mode);

    const dialog = $("#auth-dialog");
    openDialog(dialog);

    window.setTimeout(() => {
      const email = $("#auth-email");
      email?.focus();
    }, 0);
  }

  function handleAuthSubmit(event) {
    event.preventDefault();

    const form = $("#auth-form");

    if (!form || !form.reportValidity()) return;

    /*
     * Do not simulate a successful login.
     * Firebase Authentication must be integrated before
     * account creation, sign-in or password recovery can work.
     */
    showMessage(
      "Authentication is not connected yet. Your account has not been created or signed in. Firebase setup is required.",
      "warning"
    );
  }

  function handleForgotPassword() {
    const email = $("#auth-email")?.value.trim();

    if (!email) {
      showMessage(
        "Enter your email address first. Password recovery will work after Firebase Authentication is connected.",
        "warning"
      );
      $("#auth-email")?.focus();
      return;
    }

    showMessage(
      "Password recovery is not connected yet. No recovery email has been sent.",
      "warning"
    );
  }

  function initAuth() {
    $("#header-login-button")?.addEventListener("click", () => {
      openAuth("login");
    });

    $("#auth-mode-toggle")?.addEventListener("click", () => {
      setAuthMode(
        state.authMode === "login" ? "signup" : "login"
      );
    });

    $("#auth-form")?.addEventListener("submit", handleAuthSubmit);

    $('[data-action="forgot-password"]')?.addEventListener(
      "click",
      handleForgotPassword
    );

    $('[data-action="close-auth"]')?.addEventListener("click", () => {
      closeDialog($("#auth-dialog"));
    });

    $("#logout-button")?.addEventListener("click", () => {
      showMessage(
        "Firebase Authentication is not connected. No user session was changed.",
        "warning"
      );
      setMenuOpen(false);
    });
  }

  /* -------------------- TUTORIAL -------------------- */

  function renderTutorialStep() {
    const step = tutorialSteps[state.tutorialStep];

    if (!step) return;

    const label = $("#tutorial-step-label");
    const visual = $("#tutorial-visual");
    const title = $("#tutorial-title");
    const description = $("#tutorial-description");
    const progress = $("#tutorial-progress");
    const nextButton = $('[data-action="next-tutorial"]');

    if (label) label.textContent = step.label;

    if (visual) {
      visual.textContent = step.icon;
    }

    if (title) title.textContent = step.title;

    if (description) description.textContent = step.description;

    if (progress) {
      $$(".progress-dot", progress).forEach((dot, index) => {
        dot.classList.toggle(
          "active",
          index === state.tutorialStep
        );

        if (index === state.tutorialStep) {
          dot.setAttribute("aria-current", "step");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    }

    if (nextButton) {
      nextButton.textContent =
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
      status.textContent =
        "Introduction completed. You can view the features again anytime.";
    }
  }

  function skipTutorial() {
    closeDialog($("#tutorial-dialog"));

    const status = $("#tutorial-status");

    if (status) {
      status.textContent =
        "Introduction skipped. You can return to View Features anytime.";
    }
  }

  function initTutorial() {
    $('[data-action="view-features"]')?.addEventListener(
      "click",
      openTutorial
    );

    $('[data-action="next-tutorial"]')?.addEventListener(
      "click",
      nextTutorialStep
    );

    $$('[data-action="skip-tutorial"]').forEach((button) => {
      button.addEventListener("click", skipTutorial);
    });

    $('[data-action="close-tutorial"]')?.addEventListener(
      "click",
      () => closeDialog($("#tutorial-dialog"))
    );
  }

  /* -------------------- FEATURE DETAILS -------------------- */

  function openFeature(featureKey) {
    const feature = featureDetails[featureKey];

    if (!feature) {
      showMessage("This feature could not be found.", "warning");
      return;
    }

    state.activeFeature = featureKey;

    const eyebrow = $("#feature-dialog-eyebrow");
    const title = $("#feature-dialog-title");
    const description = $("#feature-dialog-description");
    const stepsList = $("#feature-dialog-steps");

    if (eyebrow) eyebrow.textContent = feature.label;
    if (title) title.textContent = feature.title;
    if (description) description.textContent = feature.description;

    if (stepsList) {
      stepsList.replaceChildren();

      feature.steps.forEach((stepText) => {
        const item = document.createElement("li");
        item.textContent = stepText;
        stepsList.appendChild(item);
      });
    }

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

  /* -------------------- GENERAL ACTIONS -------------------- */

  function initGetStarted() {
    $$('[data-action="get-started"]').forEach((button) => {
      button.addEventListener("click", () => {
        openAuth("signup");
      });
    });

    $('[data-action="edit-profile"]')?.addEventListener("click", () => {
      openAuth("signup");
    });
  }

  function initNavigation() {
    const navLinks = $$(".main-nav .nav-link");

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.forEach((item) => {
          item.classList.remove("active");
          item.removeAttribute("aria-current");
        });

        link.classList.add("active");
        link.setAttribute("aria-current", "page");
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

      /*
       * Close a native dialog when the backdrop itself is clicked.
       */
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;

        const rect = dialog.getBoundingClientRect();

        const insideDialog =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (!insideDialog) closeDialog(dialog);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    });
  }

  function initCurrentYear() {
    const year = $("#current-year");

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }
  }

  function init() {
    initAccountMenu();
    initAuth();
    initTutorial();
    initFeatureDialogs();
    initGetStarted();
    initNavigation();
    initDialogs();
    initCurrentYear();

    setAuthMode("login");
    renderTutorialStep();
    setMenuOpen(false);

    console.info(
      "BE ONLY ONE UI initialized. Backend services are not connected by this file."
    );
  }

  return { init };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", App.init, { once: true });
} else {
  App.init();
}
