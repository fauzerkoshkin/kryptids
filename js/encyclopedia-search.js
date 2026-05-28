(function () {
  var GROUPS_PER_PAGE = 6;
  var panel = document.getElementById("cryptid-search");
  var input = document.getElementById("cryptid-search-input");
  var form = document.getElementById("cryptid-search-form");
  var grid = document.querySelector(".encyclopedia-grid");
  var pager = document.getElementById("encyclopedia-pager");
  var pagerPrev = document.getElementById("encyclopedia-pager-prev");
  var pagerNext = document.getElementById("encyclopedia-pager-next");
  var pagerStatus = document.getElementById("encyclopedia-pager-status");
  if (!panel || !input || !form || !grid) return;

  var currentPage = 0;

  function letterGroups() {
    return Array.from(grid.querySelectorAll(":scope > .letter-group"));
  }

  function normalize(s) {
    return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function searchActive() {
    return normalize(input.value).length > 0;
  }

  function letterIdFromHash() {
    var h = location.hash.slice(1);
    return h.indexOf("letter-") === 0 ? h : null;
  }

  function cryptidIdFromHash() {
    var h = location.hash.slice(1);
    return h.indexOf("cryptid-") === 0 ? h : null;
  }

  function syncPageFromHash() {
    if (cryptidIdFromHash()) return;
    var id = letterIdFromHash();
    if (!id || searchActive()) return;
    var idx = letterGroups().findIndex(function (g) {
      return g.id === id;
    });
    if (idx >= 0) {
      currentPage = Math.floor(idx / GROUPS_PER_PAGE);
    }
  }

  function syncPageFromCryptidHash() {
    var id = cryptidIdFromHash();
    if (!id || searchActive()) return;
    var el = document.getElementById(id);
    if (!el || !grid.contains(el)) return;
    var group = el.closest(".letter-group");
    if (!group) return;
    var idx = letterGroups().indexOf(group);
    if (idx >= 0) {
      currentPage = Math.floor(idx / GROUPS_PER_PAGE);
    }
  }

  function scrollToId(id, align) {
    var el = id && document.getElementById(id);
    if (!el) return;
    requestAnimationFrame(function () {
      el.scrollIntoView({ behavior: "smooth", block: align || "start" });
    });
  }

  function stripHash() {
    history.replaceState(null, "", location.pathname + location.search);
  }

  function updatePagination() {
    if (!pager || !pagerPrev || !pagerNext || !pagerStatus) return;

    var groups = letterGroups();
    var n = groups.length;

    if (searchActive()) {
      groups.forEach(function (g) {
        g.classList.remove("letter-group--off-page");
      });
      pager.classList.remove("is-active");
      return;
    }

    var pages = Math.max(1, Math.ceil(n / GROUPS_PER_PAGE));
    if (currentPage >= pages) currentPage = pages - 1;
    if (currentPage < 0) currentPage = 0;

    groups.forEach(function (g, i) {
      var p = Math.floor(i / GROUPS_PER_PAGE);
      g.classList.toggle("letter-group--off-page", p !== currentPage);
    });

    if (pages <= 1) {
      groups.forEach(function (g) {
        g.classList.remove("letter-group--off-page");
      });
      pager.classList.remove("is-active");
      return;
    }

    pager.classList.add("is-active");
    if ((document.documentElement.lang || "ru") === "en") {
      pagerStatus.textContent = "Page " + (currentPage + 1) + " of " + pages;
    } else {
      pagerStatus.textContent =
        "Страница " + (currentPage + 1) + " из " + pages;
    }
    pagerPrev.disabled = currentPage <= 0;
    pagerNext.disabled = currentPage >= pages - 1;
  }

  function applyFilter() {
    var q = normalize(input.value);
    grid.querySelectorAll(".entry-card").forEach(function (card) {
      var span = card.querySelector("span:last-of-type");
      var name = normalize(span ? span.textContent : "");
      var match = !q || name.indexOf(q) !== -1;
      card.classList.toggle("entry-card--hidden", !match);
    });
    grid.querySelectorAll(".letter-group").forEach(function (group) {
      var shown = false;
      group.querySelectorAll(".entry-card").forEach(function (c) {
        if (!c.classList.contains("entry-card--hidden")) shown = true;
      });
      group.classList.toggle("letter-group--hidden", !shown);
    });
    updatePagination();
  }

  function focusSearchField() {
    setTimeout(function () {
      input.focus();
    }, 50);
  }

  input.addEventListener("input", function () {
    if (!searchActive()) {
      syncPageFromHash();
      syncPageFromCryptidHash();
    }
    applyFilter();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    applyFilter();
    if (location.hash === "#cryptid-search") {
      stripHash();
    }
    var first = grid.querySelector(".entry-card:not(.entry-card--hidden)");
    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  window.addEventListener("hashchange", function () {
    if (location.hash === "#cryptid-search") {
      focusSearchField();
      return;
    }
    if (cryptidIdFromHash() && !searchActive()) {
      syncPageFromCryptidHash();
      updatePagination();
      scrollToId(cryptidIdFromHash(), "center");
      return;
    }
    if (letterIdFromHash() && !searchActive()) {
      syncPageFromHash();
      updatePagination();
      scrollToId(letterIdFromHash(), "start");
    }
  });

  if (location.hash === "#cryptid-search") {
    focusSearchField();
  }

  var alphaRow = document.querySelector(".alpha-row");
  if (alphaRow) {
    alphaRow.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#letter-"]');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id || searchActive()) return;
      e.preventDefault();
      var idx = letterGroups().findIndex(function (g) {
        return g.id === id;
      });
      if (idx >= 0) {
        currentPage = Math.floor(idx / GROUPS_PER_PAGE);
        updatePagination();
      }
      location.hash = id;
      scrollToId(id, "start");
    });

    document.querySelectorAll(".alpha-btn--expand").forEach(function (btn) {
      btn.addEventListener("click", function () {
        alphaRow.classList.add("alpha-row--expanded");
      });
    });
    document.querySelectorAll(".alpha-btn--collapse").forEach(function (btn) {
      btn.addEventListener("click", function () {
        alphaRow.classList.remove("alpha-row--expanded");
      });
    });
  }

  if (pagerPrev && pagerNext) {
    pagerPrev.addEventListener("click", function () {
      if (currentPage > 0) {
        currentPage--;
        stripHash();
        updatePagination();
        if (pager) {
          pager.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });
    pagerNext.addEventListener("click", function () {
      var maxPage = Math.max(
        1,
        Math.ceil(letterGroups().length / GROUPS_PER_PAGE)
      );
      if (currentPage < maxPage - 1) {
        currentPage++;
        stripHash();
        updatePagination();
        if (pager) {
          pager.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    });
  }

  syncPageFromHash();
  syncPageFromCryptidHash();
  applyFilter();
  if (cryptidIdFromHash() && !searchActive()) {
    scrollToId(cryptidIdFromHash(), "center");
  } else if (letterIdFromHash() && !searchActive()) {
    scrollToId(letterIdFromHash(), "start");
  }
})();
