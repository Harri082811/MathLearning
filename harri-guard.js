(function () {
  "use strict";

  var AD_HOST_RE = /(?:effectivecpmnetwork|highperformanceformat|profitablegatecpm|adsterra|monetag|quge5|senty\.com|magsrv|pl\d+\.\w+\.\w+\/|pagedistribution)/i;

  function isAdSrc(url) {
    if (!url || typeof url !== "string" || !url) return false;
    url = String(url);
    if (url.indexOf("http") !== 0 && url.indexOf("//") !== 0) return false;
    return AD_HOST_RE.test(url);
  }

  function blockEl(host) {
    try {
      var proto = host === "script" ? HTMLScriptElement.prototype : HTMLIFrameElement.prototype;
      var hasSrc = Object.getOwnPropertyDescriptor(proto, "src");
      if (hasSrc && hasSrc.set) {
        Object.defineProperty(proto, "src", {
          configurable: true,
          enumerable: hasSrc.enumerable,
          get: function () {
            return hasSrc.get ? hasSrc.get.call(this) : "";
          },
          set: function (v) {
            if (isAdSrc(v)) {
              try {
                this.dataset.harriAdBlocked = "1";
              } catch (e) {}
              return;
            }
            if (hasSrc.set) hasSrc.set.call(this, v);
          },
        });
      }
    } catch (e) {}
  }
  blockEl("script");
  blockEl("iframe");

  var obs = null;
  function removeAds() {
    try {
      var bad = document.querySelectorAll(
        'script[src], iframe[src], script[data-pz-loading-ad="1"], script[data-pz-monetag="1"]'
      );
      bad.forEach(function (n) {
        var src = n.getAttribute && (n.getAttribute("src") || "");
        var id = (n.id || "").toLowerCase();
        var marker = n.dataset && n.dataset.harriAdBlocked;
        if (marker || isAdSrc(src) || id.indexOf("pz-adsterra") === 0 || id.indexOf("pz-monetag") === 0 || id === "pz-video-ad-root") {
          try { n.remove(); } catch (e) {}
        }
      });
    } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", removeAds);
  if (document.readyState !== "loading") removeAds();

  if (typeof MutationObserver !== "undefined") {
    try {
      obs = new MutationObserver(function (muts) {
        var changed = false;
        muts.forEach(function (m) {
          m.addedNodes && m.addedNodes.forEach(function (n) {
            if (!n || n.nodeType !== 1) return;
            var tag = (n.tagName || "").toLowerCase();
            var src = n.getAttribute && (n.getAttribute("src") || "");
            var id = (n.id || "").toLowerCase();
            if ((tag === "script" || tag === "iframe") && (isAdSrc(src) || (n.dataset && n.dataset.harriAdBlocked))) {
              try { n.remove(); changed = true; } catch (e) {}
            } else if (tag === "div" && (id.indexOf("pz-adsterra") === 0 || id.indexOf("pz-monetag") === 0 || id === "pz-video-ad-root")) {
              try { n.remove(); changed = true; } catch (e) {}
            }
          });
        });
        if (changed) removeAds();
      });
      obs.observe(document.documentElement || document, { childList: true, subtree: true });
    } catch (e) {}
  }

  var nativeOpen = window.open && window.open.bind ? window.open.bind(window) : window.open;
  if (typeof nativeOpen === "function") {
    window.open = function (url, name, features) {
      if (isAdSrc(url)) return null;
      return nativeOpen(url, name, features);
    };
  }

  var nativeAssign = window.location && window.location.assign;
  var nativeReplace = window.location && window.location.replace;
  if (nativeAssign) {
    try {
      window.location.assign = function (url) {
        if (isAdSrc(url)) return;
        return nativeAssign.call(window.location, url);
      };
    } catch (e) {}
  }
  if (nativeReplace) {
    try {
      window.location.replace = function (url) {
        if (isAdSrc(url)) return;
        return nativeReplace.call(window.location, url);
      };
    } catch (e) {}
  }

  ["effectivecpmnetwork.com", "highperformanceformat.com", "profitablegatecpm.com", "adsterra.com", "monetag.com", "quge5.com", "s.magsrv.com", "a.magsrv.com"].forEach(function (h) {
    try {
      var r = document.createElement("link");
      r.rel = "dns-prefetch";
      r.href = "//x." + h + ".invalid";
      r.setAttribute("aria-hidden", "true");
    } catch (e) {}
  });

  function fallbackIcon(img) {
    try {
      var check = img.getAttribute("data-harri-fb");
      if (check) return;
      img.setAttribute("data-harri-fb", "1");
      var src = img.getAttribute("src") || "";
      var cur = "";
      try { cur = img.currentSrc || ""; } catch (e) {}
      var combined = (src + " " + cur).toLowerCase();
      if (combined.indexOf("storage/") !== -1) {
        img.setAttribute("src", "placeholder.svg");
        img.setAttribute("srcset", "");
        if (img.parentNode && img.parentNode.parentNode) {
          img.parentNode.classList && img.parentNode.classList.add("has-harri-ph");
        }
      }
    } catch (e) {}
  }

  document.addEventListener(
    "error",
    function (e) {
      var t = e && e.target;
      if (t && t.tagName && String(t.tagName).toLowerCase() === "img") fallbackIcon(t);
    },
    true
  );
})();
