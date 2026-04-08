// Progressive enhancement: filter the city <details> blocks in #all by summary text.
// Without this script, all sections remain fully clickable — everything still works.
(function () {
  var input = document.getElementById("city-filter");
  if (!input) return;
  var all = Array.prototype.slice.call(document.querySelectorAll("#all details"));
  var originalOpen = all.map(function (d) { return d.open; });

  function apply() {
    var q = input.value.trim().toLowerCase();
    if (!q) {
      all.forEach(function (d, i) { d.hidden = false; d.open = originalOpen[i]; });
      return;
    }
    all.forEach(function (d) {
      var summary = d.querySelector("summary");
      var match = summary && summary.textContent.toLowerCase().indexOf(q) !== -1;
      d.hidden = !match;
      d.open = !!match;
    });
  }

  input.addEventListener("input", apply);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { input.value = ""; apply(); }
  });
})();
