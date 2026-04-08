// Progressive enhancement: filter the city <details> blocks in #all by summary text.
// Without JS, all sections remain fully clickable — everything still works.
(function () {
  function init() {
    var input = document.getElementById("city-filter");
    if (!input) {
      console.warn("[oaq] #city-filter not found");
      return;
    }
    var all = Array.prototype.slice.call(document.querySelectorAll("#all details"));
    if (all.length === 0) {
      console.warn("[oaq] no details found under #all");
      return;
    }
    var originalOpen = all.map(function (d) { return d.open; });
    console.log("[oaq] filter wired: " + all.length + " cities");

    function apply() {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        all.forEach(function (d, i) {
          d.hidden = false;
          d.removeAttribute("hidden");
          d.open = originalOpen[i];
        });
        return;
      }
      var visible = 0;
      all.forEach(function (d) {
        var summary = d.querySelector("summary");
        var text = summary ? summary.textContent.toLowerCase() : "";
        var match = text.indexOf(q) !== -1;
        if (match) {
          d.hidden = false;
          d.removeAttribute("hidden");
          d.open = true;
          visible++;
        } else {
          d.hidden = true;
          d.setAttribute("hidden", "");
          d.open = false;
        }
      });
    }

    input.addEventListener("input", apply);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        input.value = "";
        apply();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
