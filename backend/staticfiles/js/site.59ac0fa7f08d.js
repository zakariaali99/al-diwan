/* Progressive enhancement only — every page works fully without this file. */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  /* --- Theme toggle (persisted; falls back to OS preference) -------------- */
  var root = document.documentElement;
  var toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var current =
        root.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("al-diwan-theme", next);
      } catch (e) {
        /* private mode — theme just won't persist */
      }
      toggle.setAttribute("aria-label", next === "dark" ? toggle.dataset.labelLight : toggle.dataset.labelDark);
    });
  }

  /* --- Mobile navigation -------------------------------------------------- */
  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      navToggle.setAttribute("aria-expanded", String(!open));
      document.body.style.overflow = !open ? "hidden" : "";
    });
    // Close when a link is followed, so back-navigation doesn't restore an open menu
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.setAttribute("data-open", "false");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.getAttribute("data-open") === "true") {
        navToggle.click();
        navToggle.focus();
      }
    });
  }

  /* --- Sticky-header shadow ---------------------------------------------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      header.setAttribute("data-scrolled", String(window.scrollY > 8));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* --- Scroll reveal ------------------------------------------------------ */
  var revealables = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (revealables.length && "IntersectionObserver" in window && !reduceMotion) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    revealables.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealables.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* --- Count-up for trust figures ----------------------------------------
     These are credibility numbers, so a half-finished animation showing the
     wrong figure is worse than no animation. requestAnimationFrame is paused
     in background tabs, which can otherwise freeze a counter mid-count, so
     every path here ends by writing the exact final value.                  */
  var counters = document.querySelectorAll("[data-count-to]");

  var finalText = function (el) {
    return el.dataset.countTo + (el.dataset.countSuffix || "");
  };
  var settle = function (el) {
    el.textContent = finalText(el);
  };

  if (!counters.length) {
    /* nothing to do */
  } else if (!("IntersectionObserver" in window) || reduceMotion) {
    counters.forEach(settle);
  } else {
    var animating = [];
    var settleAll = function () {
      animating.forEach(settle);
      animating.length = 0;
    };
    // If the tab is hidden mid-count, rAF stops firing — snap to the real value.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) settleAll();
    });
    window.addEventListener("pagehide", settleAll);

    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          countObserver.unobserve(el);

          if (document.hidden) {
            settle(el);
            return;
          }

          var target = parseFloat(el.dataset.countTo);
          if (!isFinite(target)) {
            settle(el);
            return;
          }

          var suffix = el.dataset.countSuffix || "";
          var start = performance.now();
          var duration = 1200;
          animating.push(el);

          var tick = function (now) {
            var progress = Math.min((now - start) / duration, 1);
            if (progress >= 1) {
              settle(el); // exact final value, never a rounded approximation
              var i = animating.indexOf(el);
              if (i > -1) animating.splice(i, 1);
              return;
            }
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = String(Math.round(target * eased)) + suffix;
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) {
      countObserver.observe(el);
    });
  }
})();
