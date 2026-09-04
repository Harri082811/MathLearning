(function () {
  "use strict";

  function pzErrorOverlay(msg, stack) {
    try {
      var existing = document.getElementById("pz-error-overlay");
      if (existing) { existing.textContent += "\n\n" + msg; return; }
      var div = document.createElement("div");
      div.id = "pz-error-overlay";
      div.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:16px 20px;max-height:70vh;overflow:auto;background:rgba(180,20,20,0.95);color:#fff;font:12px/1.5 monospace;white-space:pre-wrap;word-break:break-word;border-bottom:2px solid #ff6b6b;pointer-events:auto;";
      div.appendChild(document.createElement("strong")).textContent = "PZ ERROR";
      var pre = document.createElement("div");
      pre.appendChild(document.createTextNode(msg + (stack ? "\n" + stack : "")));
      div.appendChild(pre);
      (document.body || document.documentElement).appendChild(div);
    } catch (e) {}
  }

  try {
    window.addEventListener("error", function (ev) {
      pzErrorOverlay(String(ev && ev.message || "Uncaught error"), ev && ev.error ? ev.error.stack : "");
    });
    window.addEventListener("unhandledrejection", function (ev) {
      var r = ev && ev.reason;
      pzErrorOverlay("Unhandled rejection: " + (r && r.message ? r.message : String(r)), r && r.stack ? r.stack : "");
    });
  } catch (e) {}

  function pzToXmlSafe(html) {
    if (!html || typeof html !== "string") return html;
    var s = html;
    try {
      s = s.replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b([^>]*)>/gi, function (full, tag, rest) {
        var inner = rest.replace(/\s*\/\s*$/, "");
        return "<" + tag + inner + "/>";
      });
      s = s.replace(/&(?!([a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#x[0-9a-fA-F]+);)/g, "&amp;");
    } catch (e) {}
    return s;
  }

  try {
    var elProto = window.HTMLElement && HTMLElement.prototype;
    if (elProto) {
      var ihDesc = Object.getOwnPropertyDescriptor(elProto, "innerHTML");
      var nativeIHSetter = ihDesc && ihDesc.set;
      if (nativeIHSetter) {
        Object.defineProperty(elProto, "innerHTML", {
          configurable: true,
          get: (ihDesc && ihDesc.get) ? ihDesc.get.bind(elProto) : undefined,
          set: function (v) {
            nativeIHSetter.call(this, pzToXmlSafe(v));
          },
        });
      }
    }
  } catch (e) {}

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

  var STORAGE_ORIGIN = "https://petezahgames.com";

  function isRelativeStorage(src) {
    if (!src || typeof src !== "string") return false;
    src = src.trim();
    return src.charAt(0) === "/" && src.toLowerCase().indexOf("/storage/") !== -1;
  }

  function fixImg(img) {
    try {
      if (!img || img.getAttribute("data-harri-ok")) return;
      var src = (img.getAttribute("src") || "").trim();
      var first = src.charAt(0);
      if (isRelativeStorage(src)) {
        img.setAttribute("src", STORAGE_ORIGIN + src);
        var ss = img.getAttribute("srcset") || "";
        if (ss) img.setAttribute("srcset", ss.split(",").map(function (part) {
          var p = part.trim().split(/\s+/)[0] || "";
          return (isRelativeStorage(p) ? STORAGE_ORIGIN + p : p) + (part.trim().match(/\s+\d+[wx]$/i) ? " " + part.trim().match(/\s+\d+[wx]$/i)[0].trim() : "");
        }).join(", "));
        img.setAttribute("data-harri-ok", "1");
      }
    } catch (e) {}
  }

  function fixAllImages() {
    try {
      var imgs = document.querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) fixImg(imgs[i]);
    } catch (e) {}
  }

  if (typeof MutationObserver !== "undefined") {
    try {
      var imgObs = new MutationObserver(function () { fixAllImages(); });
      imgObs.observe(document.documentElement || document, { childList: true, subtree: true });
    } catch (e) {}
  }
  fixAllImages();

  function fallbackIcon(img) {
    try {
      var src = (img.getAttribute("src") || "").trim();
      if (isRelativeStorage(src)) { fixImg(img); return; }
      var check = img.getAttribute("data-harri-fb");
      if (check) return;
      img.setAttribute("data-harri-fb", "1");
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
