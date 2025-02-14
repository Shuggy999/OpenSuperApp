document.addEventListener("DOMContentLoaded", function() {
  // Get references
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  var overlay = document.getElementById("overlay");
  var content = document.getElementById("content");

  // Toggle sidebar
  burger.addEventListener("click", function() {
    menu.classList.toggle("active");
    overlay.classList.toggle("active");
  });
  overlay.addEventListener("click", function() {
    menu.classList.remove("active");
    overlay.classList.remove("active");
  });

  // Modified loadSection to accept a callback after the partial loads
  function loadSection(section, callback) {
    fetch("partials/" + section + ".html")
      .then(function(response) {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.text();
      })
      .then(function(html) {
        content.innerHTML = html;
        initSectionScripts(section);
        if (callback && typeof callback === "function") {
          callback();
        }
      })
      .catch(function(error) {
        console.error("Error loading section:", error);
        content.innerHTML = "<p>Error loading content.</p>";
      });
  }

  // Initialize section-specific scripts
  function initSectionScripts(section) {
    if (section === "section-radio") {
      // Radio-specific initialization goes here...
      var radioPlayer = document.getElementById("radio-player");
      var playButtons = document.querySelectorAll(".play-button");
      playButtons.forEach(function(button) {
        button.addEventListener("click", function() {
          var streamURL = this.getAttribute("data-stream");
          if (Hls.isSupported()) {
            var hls = new Hls();
            hls.loadSource(streamURL);
            hls.attachMedia(radioPlayer);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
              radioPlayer.play();
            });
          } else if (radioPlayer.canPlayType("application/vnd.apple.mpegurl")) {
            radioPlayer.src = streamURL;
            radioPlayer.play();
          }
        });
      });
    }
    if (section === "section-programmes") {
      loadProgrammes();
    }
    if (section === "section-programme-viewer") {
      // Attach back button listener after the viewer partial loads
      var programmeBack = document.getElementById("programme-back");
      if (programmeBack) {
        programmeBack.addEventListener("click", function() {
          loadSection("section-programmes");
        });
      }
    }
  }

  // Load default section
  loadSection("section-home");

  // Menu link handling
  var menuLinks = menu.querySelectorAll("a[data-section]");
  menuLinks.forEach(function(link) {
    link.addEventListener("click", function(e) {
      e.preventDefault();
      var section = this.getAttribute("data-section");
      loadSection(section);
      menu.classList.remove("active");
      overlay.classList.remove("active");
    });
  });

  // PROGRAMMES SECTION: Fetch and display programme cards
  function loadProgrammes() {
    fetch('https://cards-wol-fa.yinzcam.com/V1/Card/PROGRAMMES')
      .then(function(response) { return response.text(); })
      .then(function(str) {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(str, "application/xml");
        var cards = xmlDoc.getElementsByTagName("Card");
        var programmeGrid = document.getElementById("programme-grid");
        programmeGrid.innerHTML = ""; // Clear previous content

        for (var i = 0; i < cards.length; i++) {
          var card = cards[i];
          var view = card.getElementsByTagName("View")[0];
          var title = "";
          if (view) {
            var internalNameElement = view.getElementsByTagName("InternalName")[0];
            if (internalNameElement) {
              title = internalNameElement.textContent.trim();
            }
          }
          var imageURLElement = view ? view.getElementsByTagName("ImageURL")[0] : null;
          var imageURL = imageURLElement ? imageURLElement.textContent.trim() : "";
          var urlElement = view ? view.getElementsByTagName("URL")[0] : null;
          var linkURL = urlElement ? urlElement.textContent.trim() : "";

          // Extract the actual URL from the query string
          var actualURL = "";
          if (linkURL.indexOf('?') > -1) {
            var parts = linkURL.split('?');
            var queryString = parts[1];
            var params = new URLSearchParams(queryString);
            if (params.get("url")) {
              actualURL = decodeURIComponent(params.get("url"));
            }
          }

          // Create the programme card
          var programmeCard = document.createElement("div");
          programmeCard.className = "programme-item";
          programmeCard.setAttribute("data-url", actualURL);
          programmeCard.innerHTML = `
            <img src="${imageURL}" alt="${title}">
            <h3>${title}</h3>
          `;

          // On click, load the iframe viewer in a new partial (or open in new tab with Ctrl/Command)
          programmeCard.addEventListener("click", function(e) {
            var url = this.getAttribute("data-url");
            if (url) {
              if (e.ctrlKey || e.metaKey) {
                window.open(url, '_blank');
              } else {
                // Load the viewer partial and then set the iframe src
                loadSection("section-programme-viewer", function() {
                  var iframe = document.getElementById("programme-frame");
                  if (iframe) {
                    iframe.src = url;
                  } else {
                    console.error("No iframe found in programme viewer");
                  }
                });
              }
            }
          });

          programmeGrid.appendChild(programmeCard);
        }
      })
      .catch(function(err) {
        console.error("Error loading programmes:", err);
      });
  }
});
