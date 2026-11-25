var destinations = [
  { name: "Jaipur", state: "Rajasthan", type: "Heritage", emoji: "🏰", temp: 28, budget: 3500, wiki: "Hawa Mahal|City Palace, Jaipur|Jaipur" },
  { name: "Goa", state: "Goa", type: "Beach", emoji: "🏖️", temp: 30, budget: 4000, wiki: "Baga Beach|Calangute|Anjuna|Goa" },
  { name: "Munnar", state: "Kerala", type: "Nature", emoji: "🍃", temp: 24, budget: 3000, wiki: "Munnar|Eravikulam National Park|Mattupetty Dam" },
  { name: "Manali", state: "Himachal Pradesh", type: "Nature", emoji: "🏔️", temp: 18, budget: 3200, wiki: "Manali, Himachal Pradesh|Rohtang Pass|Solang Valley" },
  { name: "Varanasi", state: "Uttar Pradesh", type: "Spiritual", emoji: "🪔", temp: 27, budget: 2500, wiki: "Ghats in Varanasi|Dashashwamedh Ghat|Varanasi" },
  { name: "Leh", state: "Ladakh", type: "Nature", emoji: "🏞️", temp: 15, budget: 4500, wiki: "Leh Palace|Shanti Stupa|Leh" }
];

var activeType = "All";
var trips = [];
var selectedTripId = null;

var destinationBox = document.getElementById("destinationBox");
var searchInput = document.getElementById("searchInput");
var tripSelect = document.getElementById("tripSelect");
var tripInfo = document.getElementById("tripInfo");
var stateBox = document.getElementById("stateBox");

// "wiki" = name of the Wikipedia article whose main photo is used for the card
var states = [
  { name: "Andhra Pradesh", known: "Temples and Araku hills", wiki: "Tirumala Venkateswara Temple|Araku Valley" },
  { name: "Arunachal Pradesh", known: "Monasteries and Himalayan valleys", wiki: "Tawang Monastery|Tawang" },
  { name: "Assam", known: "Rhinos and tea gardens", wiki: "Kaziranga National Park|Majuli" },
  { name: "Bihar", known: "Bodh Gaya and ancient Nalanda", wiki: "Mahabodhi Temple|Nalanda" },
  { name: "Chhattisgarh", known: "Waterfalls and tribal culture", wiki: "Chitrakote Falls|Chhattisgarh" },
  { name: "Goa", known: "Beaches and Portuguese churches", wiki: "Basilica of Bom Jesus|Goa" },
  { name: "Gujarat", known: "Rann of Kutch and Statue of Unity", wiki: "Statue of Unity|Rann of Kutch" },
  { name: "Haryana", known: "Kurukshetra and Pinjore Gardens", wiki: "Pinjore Gardens|Kurukshetra" },
  { name: "Himachal Pradesh", known: "Snow peaks, Shimla and Spiti", wiki: "Spiti Valley|Shimla" },
  { name: "Jharkhand", known: "Waterfalls and forests", wiki: "Hundru Falls|Ranchi" },
  { name: "Karnataka", known: "Hampi, Mysuru and Coorg", wiki: "Hampi|Mysore Palace" },
  { name: "Kerala", known: "Backwaters and houseboats", wiki: "Kerala backwaters|Alappuzha" },
  { name: "Madhya Pradesh", known: "Khajuraho and tiger reserves", wiki: "Khajuraho Group of Monuments|Sanchi" },
  { name: "Maharashtra", known: "Mumbai and Ajanta caves", wiki: "Gateway of India|Ajanta Caves" },
  { name: "Manipur", known: "Floating islands of Loktak", wiki: "Loktak Lake|Imphal" },
  { name: "Meghalaya", known: "Living root bridges and rain", wiki: "Living root bridges|Shillong" },
  { name: "Mizoram", known: "Green hills and waterfalls", wiki: "Vantawng Falls|Aizawl" },
  { name: "Nagaland", known: "Hornbill Festival and tribal heritage", wiki: "Hornbill Festival|Kohima" },
  { name: "Odisha", known: "Konark and Puri", wiki: "Konark Sun Temple|Jagannath Temple, Puri" },
  { name: "Punjab", known: "Golden Temple and Punjabi food", wiki: "Golden Temple|Jallianwala Bagh" },
  { name: "Rajasthan", known: "Forts, palaces and the Thar desert", wiki: "Amer Fort|Jaisalmer Fort" },
  { name: "Sikkim", known: "Kanchenjunga views and monasteries", wiki: "Kangchenjunga|Gangtok" },
  { name: "Tamil Nadu", known: "Dravidian temples and hill stations", wiki: "Meenakshi Temple|Brihadisvara Temple, Thanjavur" },
  { name: "Telangana", known: "Hyderabad, Charminar and biryani", wiki: "Charminar|Golconda" },
  { name: "Tripura", known: "Royal palaces and temples", wiki: "Ujjayanta Palace|Agartala" },
  { name: "Uttar Pradesh", known: "Taj Mahal and Varanasi", wiki: "Taj Mahal|Agra Fort" },
  { name: "Uttarakhand", known: "Himalayan treks and Rishikesh", wiki: "Valley of Flowers National Park|Rishikesh" },
  { name: "West Bengal", known: "Kolkata and Darjeeling tea", wiki: "Victoria Memorial, Kolkata|Howrah Bridge" },
  { name: "Delhi", known: "India Gate and Mughal monuments", wiki: "India Gate|Red Fort" },
  { name: "Jammu & Kashmir", known: "Dal Lake and Gulmarg", wiki: "Dal Lake|Srinagar" },
  { name: "Ladakh", known: "Mountain lakes and monasteries", wiki: "Pangong Tso|Nubra Valley" }
];

var gradients = [
  "linear-gradient(135deg, #ff5fa2, #ffb36b)",
  "linear-gradient(135deg, #00b8a9, #3ec5ff)",
  "linear-gradient(135deg, #6d5efc, #9f7aea)"
];

// Photo links are saved in the browser, so they appear instantly next time
var savedPhotos = {};
try { savedPhotos = JSON.parse(localStorage.getItem("yatraPhotos")) || {}; } catch (e) {}

function savePhoto(key, url) {
  savedPhotos[key] = url;
  try { localStorage.setItem("yatraPhotos", JSON.stringify(savedPhotos)); } catch (e) {}
}

var photoRequests = {};
var photoQueue = [];
var activeRequests = 0;

// Only 3 requests run at a time (too many at once get blocked and photos go missing).
// A failed request is tried once more after a short wait.
function getJson(url, tries) {
  return new Promise(function(resolve) {
    photoQueue.push({ url: url, tries: tries, resolve: resolve });
    nextRequest();
  });
}

function nextRequest() {
  if (activeRequests >= 3 || photoQueue.length === 0) {
    return;
  }
  var job = photoQueue.shift();
  activeRequests++;

  fetch(job.url)
    .then(function(res) {
      if (!res.ok) { throw new Error("bad response"); }
      return res.json();
    })
    .then(function(data) { job.resolve(data); })
    .catch(function() {
      if (job.tries > 0) {
        setTimeout(function() {
          photoQueue.push({ url: job.url, tries: job.tries - 1, resolve: job.resolve });
          nextRequest();
        }, 800);
      } else {
        job.resolve(null);
      }
    })
    .then(function() {
      activeRequests--;
      nextRequest();
    });
}

var apiUrl = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&origin=*";

function fetchOneTitle(title, size) {
  var url = apiUrl + "&pithumbsize=" + size + "&redirects=1&titles=" + encodeURIComponent(title);

  return getJson(url, 1).then(function(data) {
    if (!data || !data.query) { return ""; }
    var pages = data.query.pages;
    for (var id in pages) {
      if (pages[id].thumbnail) {
        return pages[id].thumbnail.source;
      }
    }
    return "";
  });
}

// Last chance: search Wikipedia and take the best result that has a photo
function searchPhoto(term, size) {
  var url = apiUrl + "&pithumbsize=" + size + "&generator=search&gsrlimit=6&gsrsearch=" +
    encodeURIComponent(term + " India");

  return getJson(url, 1).then(function(data) {
    if (!data || !data.query) { return ""; }
    var pages = data.query.pages;
    var best = null;
    for (var id in pages) {
      if (pages[id].thumbnail && (best === null || pages[id].index < best.index)) {
        best = pages[id];
      }
    }
    return best ? best.thumbnail.source : "";
  });
}

// wikiTitle can hold several article names separated by "|".
// They are tried in order, then a search is used if none has a photo.
function firstPhoto(titles, n, size) {
  if (n >= titles.length) {
    return searchPhoto(titles[0], size);
  }
  return fetchOneTitle(titles[n], size).then(function(url) {
    return url !== "" ? url : firstPhoto(titles, n + 1, size);
  });
}

function fetchPhotoUrl(wikiTitle, size) {
  size = size || 500;
  var key = wikiTitle + size;

  if (savedPhotos[key]) {
    return Promise.resolve(savedPhotos[key]);
  }
  if (!photoRequests[key]) {
    photoRequests[key] = firstPhoto(wikiTitle.split("|"), 0, size).then(function(url) {
      if (url !== "") { savePhoto(key, url); }
      return url;
    });
  }
  return photoRequests[key];
}

// If a photo cannot be found or loaded, the gradient + emoji stay as the fallback.
function loadPhoto(box) {
  var img = box.querySelector(".photo");

  fetchPhotoUrl(box.dataset.wiki).then(function(url) {
    if (url === "") {
      return;
    }
    img.onload = function() {
      box.classList.add("has-photo");
    };
    img.onerror = function() {
      // the image server sometimes refuses at first - try once more
      if (!box.dataset.retried) {
        box.dataset.retried = "yes";
        setTimeout(function() { img.src = url + "?retry=1"; }, 1500);
      }
    };
    img.src = url;
  });
}

function showDestinations() {
  var searchText = searchInput.value.toLowerCase();
  var filtered = [];

  for (var i = 0; i < destinations.length; i++) {
    var place = destinations[i];
    var name = place.name.toLowerCase();
    var state = place.state.toLowerCase();

    if ((name.includes(searchText) || state.includes(searchText)) &&
        (activeType === "All" || place.type === activeType)) {
      filtered.push(place);
    }
  }

  destinationBox.innerHTML = "";

  if (filtered.length === 0) {
    destinationBox.innerHTML = '<p class="empty">No places match. Try another search or type.</p>';
  }

  for (var i = 0; i < filtered.length; i++) {
    var place = filtered[i];
    var color = gradients[i % 3];

    var card = document.createElement("div");
    card.className = "destination-card";

    card.innerHTML = `
      <div class="card-top" data-wiki="${place.wiki}" style="background:${color}">
        <img class="photo" alt="${place.name}" loading="lazy">
        <span class="card-emoji">${place.emoji}</span>
        <span class="temp-tag">${place.temp}°C</span>
      </div>
      <div class="card-body">
        <span class="type-badge">${place.type}</span>
        <h3>${place.name}</h3>
        <p>${place.state}</p>
        <p class="price"><small>Budget</small> ₹${place.budget.toLocaleString("en-IN")}</p>

        <div class="card-actions">
          <button class="card-btn" onclick="alert('${place.name} weather is ${place.temp}°C')">Weather</button>
          <button class="card-btn add" onclick="addToTrip('${place.name}')">Add to Trip</button>
        </div>
      </div>
    `;

    destinationBox.appendChild(card);
    loadPhoto(card.querySelector(".card-top"));
  }
}

function showStates() {
  stateBox.innerHTML = "";

  for (var i = 0; i < states.length; i++) {
    var state = states[i];

    var card = document.createElement("div");
    card.className = "state-card";

    card.innerHTML = `
      <div class="card-top" data-wiki="${state.wiki}" style="background:${gradients[i % 3]}">
        <img class="photo" alt="${state.name}" loading="lazy">
        <span class="card-emoji">📍</span>
      </div>
      <div class="state-label">
        <h3>${state.name}</h3>
        <p>${state.known}</p>
      </div>
    `;

    stateBox.appendChild(card);
    loadPhoto(card.querySelector(".card-top"));
  }
}

function addToTrip(placeName) {
  if (trips.length === 0) {
    createTrip("My India Trip", "", 0);
  }

  var trip = getSelectedTrip();

  for (var i = 0; i < destinations.length; i++) {
    if (destinations[i].name === placeName) {
      trip.places.push(destinations[i]);
      break;
    }
  }

  updateTripInfo();
  renderTripList();
}

function createTrip(name, date, budget) {
  var trip = {
    id: Date.now(),
    name: name,
    date: date,
    budget: budget,
    places: []
  };

  trips.push(trip);
  selectedTripId = trip.id;

  updateTripInfo();
  renderTripList();
}

function getSelectedTrip() {
  for (var i = 0; i < trips.length; i++) {
    if (trips[i].id === selectedTripId) {
      return trips[i];
    }
  }
  return null;
}

function renderTripList() {
  tripSelect.innerHTML = "";

  for (var i = 0; i < trips.length; i++) {
    var option = document.createElement("option");
    option.value = trips[i].id;
    option.textContent = trips[i].name;

    if (trips[i].id === selectedTripId) {
      option.selected = true;
    }

    tripSelect.appendChild(option);
  }
}

function updateTripInfo() {
  var trip = getSelectedTrip();

  if (!trip) {
    tripInfo.innerHTML = `
      <h3>No Trip Selected</h3>
      <p>Create a trip and add destinations to it.</p>
    `;
    return;
  }

  var total = 0;

  for (var i = 0; i < trip.places.length; i++) {
    total += trip.places[i].budget;
  }

  var html = `
    <h3>${trip.name}</h3>
    <p><strong>Date:</strong> ${trip.date}</p>
    <p><strong>Budget:</strong> ₹${trip.budget}</p>
    <p><strong>Places Added:</strong> ${trip.places.length}</p>
    <p><strong>Estimated Cost:</strong> ₹${total}</p>
  `;

  if (trip.places.length > 0) {
    html += "<h4>Selected Places:</h4>";
    for (var i = 0; i < trip.places.length; i++) {
      html += `
        <div class="trip-place">
          ${trip.places[i].emoji} ${trip.places[i].name}
        </div>
      `;
    }
  }

  tripInfo.innerHTML = html;
}

searchInput.addEventListener("input", showDestinations);

document.getElementById("createTripBtn").addEventListener("click", function() {
  var name = document.getElementById("tripName").value.trim();
  var date = document.getElementById("tripDate").value;
  var budget = document.getElementById("tripBudget").value;

  if (name === "") {
    alert("Please enter a trip name");
    return;
  }

  createTrip(name, date, budget);

  document.getElementById("tripName").value = "";
  document.getElementById("tripDate").value = "";
  document.getElementById("tripBudget").value = "";
});

tripSelect.addEventListener("change", function() {
  selectedTripId = Number(tripSelect.value);
  updateTripInfo();
});

// Type chips filter the destinations
var chips = document.querySelectorAll(".chip");
for (var c = 0; c < chips.length; c++) {
  chips[c].addEventListener("click", function() {
    for (var k = 0; k < chips.length; k++) {
      chips[k].classList.remove("active");
    }
    this.classList.add("active");
    activeType = this.textContent;
    showDestinations();
  });
}

// Colour buttons in the header switch the theme
var themeButtons = document.querySelectorAll(".theme-btn");
for (var t = 0; t < themeButtons.length; t++) {
  themeButtons[t].addEventListener("click", function() {
    document.body.dataset.theme = this.dataset.theme;
  });
}

// Big photo behind the hero (the gradient stays if it cannot load)
fetchPhotoUrl("Taj Mahal|Amer Fort|Hawa Mahal", 1280).then(function(url) {
  if (url !== "") {
    document.querySelector(".hero").style.setProperty("--hero-img", 'url("' + url + '")');
  }
});

showDestinations();
showStates();
