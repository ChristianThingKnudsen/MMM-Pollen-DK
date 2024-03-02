Module.register("MMM-Pollen-DK", {
  defaults: {
    region: "west",
    showHeader: false,
    pollenTypes: [
      "Græs",
      "Birk",
      "Bynke",
      "Elm",
      "El",
      "Hassel",
      "Cladosporium",
      "Alternaria",
    ],
    displayTime: 30000,
  },

  regions: {
    east: 48,
    west: 49,
  },

  pollenTypes: {
    El: 1,
    Hassel: 2,
    Elm: 4,
    Birk: 7,
    Græs: 28,
    Bynke: 31,
    Alternaria: 44,
    Cladosporium: 45,
  },
  pollenData: null,
  start: function () {
    Log.info("Starting module: " + this.name);
    this.getData();
    this.now = this.getNow();
    // Views
    this.currentViewIndex = 0;
    this.views = ["VIEW_ALL"];
    if (this.config.forecast) this.views.push("FORECAST");
  },

  getData: function () {
    this.sendSocketNotification("GET_POLLEN_DATA", {});
  },
  validateRegion: function (region) {
    if (!typeof region === "string") {
      return "region: '" + region + "' must be a string";
    }

    if (!this.regions[region]) {
      return "Region: '" + region + "' does not exist";
    } else {
      return true;
    }
  },
  validatePollenTypes: function (pollenTypes) {
    if (!Array.isArray(pollenTypes)) {
      return "Pollen types: '" + pollenTypes + "' must be an array";
    }

    for (let i = 0; i < pollenTypes.length; i++) {
      if (!this.pollenTypes[pollenTypes[i]]) {
        return "Polen type: '" + pollenTypes[i] + "' does not exist";
      }
    }
    return true;
  },
  validateForecast(type) {
    if (type) {
      return true;
    } else {
      return pollenTypes[type]
        ? true
        : "Forecast type: '" + type + "' does not exist";
    }
  },
  // Gets automatically called when the module starts
  loaded: function (callback) {
    this.finishLoading();
    callback();
  },
  getScripts: function () {
    return [
      "//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.2/jquery.js",
      "moment.js",
    ];
  },
  getStyles: function () {
    return ["MMM-Pollen-DK.css"];
  },
  getNow: function () {
    return moment().format("DD.MM.YY - HH:mm:ss");
  },
  renderTitle(wrapper) {
    var title = document.createElement("header");
    title.innerHTML = this.config.region + " - Updated: " + this.now;
    title.setAttribute("width", "330px");
    wrapper.appendChild(title);
    return wrapper;
  },
  getDom: function () {
    // Create the base element
    var self = this;
    var wrapper = document.createElement("div");

    const regionIsValid = this.validateRegion(this.config.region);
    const pollenTypesAreValid = this.validatePollenTypes(
      this.config.pollenTypes
    );
    const forecastIsValid = this.validateForecast(this.config.forecast);
    const iconSize = 30;
    const textSize = "18px";

    const data = this.pollenData;
    if (!data) {
      wrapper.innerHTML = "Loading...";
      setTimeout(function () {
        self.updateDom(1000);
      }, 2000);
      console.log("Waiting for Data...");
      return wrapper;
    }
    // Add fontawesome to html head, to use their icons
    var link = document.createElement("link");
    link.id = "id2";
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";
    document.head.appendChild(link);

    // Check views. If exceeded, change league and reset view
    if (this.currentViewIndex >= this.views.length) {
      // Reset the index to 0 if it exceeds the list length
      this.currentViewIndex = 0;
    }

    if (regionIsValid != true) {
      wrapper.innerHTML = regionIsValid;
      return wrapper;
    }
    if (pollenTypesAreValid != true) {
      wrapper.innerHTML = pollenTypesAreValid;
      return wrapper;
    }

    if (forecastIsValid != true) {
      wrapper.innerHTML = forecastIsValid;
      return wrapper;
    }

    if (this.config.showHeader) {
      wrapper = this.renderTitle(wrapper);
    }

    switch (this.views[this.currentViewIndex]) {
      case "VIEW_ALL":
        var wrapper = this.renderAll(data, wrapper, textSize, iconSize);

        break;
      case "FORECAST":
        var wrapper = this.renderForecast(data, wrapper, textSize, iconSize);
        break;
      default:
        wrapper.innerHTML =
          "ERROR: Entered invalidate state: " +
          this.views[this.currentViewIndex];

        break;
    }
    this.currentViewIndex = this.currentViewIndex + 1;
    setTimeout(function () {
      self.updateDom(1000);
    }, this.config.displayTime);
    return wrapper;
  },
  renderAll(data, wrapper, textSize, iconSize) {
    const region = this.config.region;
    const pollenTypes = this.config.pollenTypes;

    // Create Table View
    var table = document.createElement("table");
    table.className = "xsmall";

    var labelRow = document.createElement("tr");
    labelRow.setAttribute("width", "330px");

    // Pollen Type Icon
    var pollenTypeLabel = document.createElement("th");
    pollenTypeLabel.setAttribute("width", "20px");
    pollenTypeLabel.setAttribute("align", "left");
    pollenTypeLabel.setAttribute("width", "20px");
    pollenTypeLabel.style.fontSize = textSize;

    labelRow.appendChild(pollenTypeLabel);

    // Pollen Season Icon
    var pollenSeasonLabel = document.createElement("th");
    var pollenSeasonIcon = document.createElement("i");
    pollenSeasonIcon.classList.add("fa", "fa-clock-o");
    pollenSeasonLabel.setAttribute("width", "20px");
    pollenSeasonLabel.appendChild(pollenSeasonIcon);
    pollenSeasonLabel.setAttribute("align", "left");
    pollenSeasonLabel.setAttribute("width", "20px");
    pollenSeasonLabel.style.fontSize = textSize;
    pollenSeasonIcon.style.fontSize = textSize;
    labelRow.appendChild(pollenSeasonLabel);

    var pollenName = document.createElement("th");
    pollenName.innerHTML = "Navn";
    pollenName.setAttribute("align", "left");
    pollenName.style.fontSize = textSize;
    labelRow.appendChild(pollenName);

    // Pollen Value Icon
    var pollenValueLabel = document.createElement("th");
    var pollenValueIcon = document.createElement("i");
    pollenValueIcon.classList.add("fa", "fa-leaf");
    pollenValueLabel.appendChild(pollenValueIcon);
    pollenValueLabel.setAttribute("align", "left");
    pollenValueLabel.style.fontSize = textSize;
    pollenValueIcon.style.fontSize = textSize;

    labelRow.appendChild(pollenValueLabel);

    // Next pollen value icon
    var pollenNextLabel = document.createElement("th");
    var pollenNextIcon = document.createElement("i");
    pollenNextIcon.classList.add("fa", "fa-line-chart");
    pollenNextLabel.appendChild(pollenNextIcon);
    pollenNextLabel.setAttribute("align", "left");
    labelRow.appendChild(pollenNextLabel);
    pollenNextLabel.style.fontSize = textSize;
    pollenNextLabel.style.fontSize = textSize;

    table.appendChild(labelRow);

    for (let i = 0; i < pollenTypes.length; i++) {
      const pollenId = this.pollenTypes[pollenTypes[i]];
      const regionId = this.regions[region];
      // console.log("pollenId");
      // console.log(pollenId);
      // console.log("regionId");
      // console.log(regionId);
      var row = document.createElement("tr");

      const regionData = data.fields?.[regionId];
      const pollenData =
        regionData?.mapValue?.fields?.data?.mapValue?.fields?.[pollenId]
          ?.mapValue?.fields;
      // console.log("pollenData for " + pollenTypes[i]);
      // console.log(pollenData);

      const predictions = pollenData?.predictions?.mapValue?.fields;
      const nextPredictionCell = this.getLatestPrediction(
        pollenTypes[i],
        predictions,
        textSize
      );

      var iconCell = document.createElement("td");
      iconCell.setAttribute("align", "left");
      iconCell.style.fontSize = textSize;
      const iconUrl = this.getImage(pollenTypes[i]);
      if (iconUrl) {
        var logo = document.createElement("img");
        logo.src = iconUrl;
        logo.width = iconSize;
        logo.height = iconSize;
        logo.style.fontSize = textSize;
        iconCell.appendChild(logo);
      } else {
        iconCell.innerHTML = "ERROR";
      }

      var typeCell = document.createElement("td");
      typeCell.setAttribute("align", "left");
      const type = pollenTypes[i];
      typeCell.innerHTML = type;
      typeCell.style.fontSize = textSize;

      var valueCell = document.createElement("td");
      valueCell.setAttribute("align", "left");
      const value = parseInt(pollenData?.level?.integerValue);
      if (value > 0) {
        valueCell.innerHTML = value;
      } else {
        valueCell.innerHTML = "0";
      }
      const severity = this.getSeverity(type, value);

      switch (severity) {
        case "LOW":
          valueCell.style.color = "green";
          break;
        case "MEDIUM":
          valueCell.style.color = "yellow";
          break;
        case "HIGH":
          valueCell.style.color = "red";
          break;
        default:
          break;
      }
      valueCell.style.fontSize = textSize;

      var seasonCellLabel = document.createElement("td");
      var seasonCellIcon = document.createElement("i");
      seasonCellLabel.setAttribute("align", "left");
      if (pollenData?.inSeason?.booleanValue) {
        seasonCellIcon.classList.add("fa", "fa-check-circle");
      } else {
        seasonCellIcon.classList.add("fa", "fa-times-circle");
      }
      seasonCellLabel.style.fontSize = textSize;
      seasonCellIcon.style.fontSize = textSize;
      seasonCellLabel.appendChild(seasonCellIcon);

      row.appendChild(iconCell);
      row.appendChild(seasonCellLabel);
      row.appendChild(typeCell);
      row.appendChild(valueCell);
      row.appendChild(nextPredictionCell);

      table.appendChild(row);
    }
    wrapper.appendChild(table);
    return wrapper;
  },
  renderForecast(data, wrapper, textSize, iconSize) {
    const region = this.config.region;
    const type = this.config.forecast;
    const pollenId = this.pollenTypes[type];
    const regionId = this.regions[region];

    // Create Table View
    var table = document.createElement("table");
    table.className = "xsmall";
    table.id = "stripped";

    var labelRow = document.createElement("tr");
    labelRow.setAttribute("width", "330px");

    var timeCell = document.createElement("th");
    timeCell.innerHTML = "Time";
    timeCell.setAttribute("align", "left");
    timeCell.style.fontSize = textSize;
    labelRow.appendChild(timeCell);

    // Pollen Type Icon
    var iconCell = document.createElement("th");
    iconCell.setAttribute("align", "center");
    iconCell.style.fontSize = textSize;
    const iconUrl = this.getImage(type);
    if (iconUrl) {
      var logo = document.createElement("img");
      logo.setAttribute("align", "center");
      logo.src = iconUrl;
      logo.width = iconSize;
      logo.height = iconSize;
      logo.style.fontSize = textSize;
      iconCell.appendChild(logo);
    } else {
      iconCell.innerHTML = "ERROR";
    }
    labelRow.appendChild(iconCell);

    table.appendChild(labelRow);

    const regionData = data.fields?.[regionId];
    const pollenData =
      regionData?.mapValue?.fields?.data?.mapValue?.fields?.[pollenId]?.mapValue
        ?.fields;
    const predictions = pollenData?.predictions?.mapValue?.fields;

    var row = document.createElement("tr");
    // Time cell
    var timeCell = document.createElement("td");
    timeCell.setAttribute("align", "left");
    timeCell.innerHTML = "Nu";
    timeCell.style.fontSize = textSize;
    row.appendChild(timeCell);
    // Value
    var valueCell = document.createElement("td");
    valueCell.setAttribute("align", "center");
    const value = parseInt(pollenData?.level?.integerValue);
    if (value > 0) {
      valueCell.innerHTML = value;
    } else {
      valueCell.innerHTML = "0";
    }
    const severity = this.getSeverity(type, value);

    switch (severity) {
      case "LOW":
        valueCell.style.color = "green";
        break;
      case "MEDIUM":
        valueCell.style.color = "yellow";
        break;
      case "HIGH":
        valueCell.style.color = "red";
        break;
      default:
        break;
    }
    valueCell.style.fontSize = textSize;
    row.appendChild(valueCell);
    table.appendChild(row);
    table = this.wrapperRenderForecastRows(table, type, predictions, textSize);

    wrapper.appendChild(table);
    return wrapper;
  },
  wrapperRenderForecastRows(table, type, predictions, textSize) {
    const keys = Object.keys(predictions);
    console.log("keys");
    console.log(keys);
    const dates = [];
    for (let i = 0; i < keys.length; i++) {
      let [day, month, year] = keys[i].split("-");
      let date = new Date(`${year}-${month}-${day}`);
      dates.push(date);
    }
    dates.sort((a, b) => a - b);
    var dayNames = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "lør"];
    var monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Maj",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dec",
    ];

    for (let i = 0; i < dates.length; i++) {
      var date = dates[i];
      const dateKey = `${date.getDate().toString().padStart(2, "0")}-${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${date.getFullYear()}`;
      console.log("dateKey");
      console.log(dateKey);
      const stringValue =
        predictions[dateKey]?.mapValue?.fields?.prediction?.stringValue;
      const value = stringValue ? parseInt(stringValue) : 0;
      console.log("value");
      console.log(value);

      var row = document.createElement("tr");

      // Timecell
      var timeCell = document.createElement("td");
      timeCell.setAttribute("align", "left");
      timeCell.innerHTML =
        dayNames[date.getDay()] +
        " " +
        date.getDate() +
        ". " +
        monthNames[date.getMonth()];
      timeCell.style.fontSize = textSize;
      row.appendChild(timeCell);

      //Valuecell
      var valueCell = document.createElement("td");
      valueCell.setAttribute("align", "center");
      if (value > 0) {
        valueCell.innerHTML = value;
      } else {
        valueCell.innerHTML = "0";
      }
      const severity = this.getSeverity(type, value);

      switch (severity) {
        case "LOW":
          valueCell.style.color = "green";
          break;
        case "MEDIUM":
          valueCell.style.color = "yellow";
          break;
        case "HIGH":
          valueCell.style.color = "red";
          break;
        default:
          break;
      }
      valueCell.style.fontSize = textSize;
      row.appendChild(timeCell);
      row.appendChild(valueCell);
      table.appendChild(row);
    }
    return table;
  },
  getLatestPrediction(type, predictions, textSize) {
    const keys = Object.keys(predictions);
    // Convert each string date to a Date object in the correct format and find the latest date
    let nextDate = keys.reduce((min, dateStr) => {
      // Convert 'dd-mm-yyyy' to 'yyyy-mm-dd'
      let [day, month, year] = dateStr.split("-");
      let date = new Date(`${year}-${month}-${day}`);

      return date < min ? date : min;
    }, new Date(keys[0].split("-").reverse().join("-"))); // Initial min date

    // Convert the latest Date object back to a string in the 'dd-mm-yyyy' format
    const nextDayKey = `${nextDate.getDate().toString().padStart(2, "0")}-${(
      nextDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${nextDate.getFullYear()}`;
    // console.log("dates");
    // console.log(keys);
    // console.log("nextDayKey");
    // console.log(nextDayKey);

    var dayNames = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "lør"];

    const date = new Date(nextDayKey);
    const value =
      predictions[nextDayKey]?.mapValue?.fields?.prediction?.stringValue;

    var nextDateCell = document.createElement("td");
    nextDateCell.setAttribute("align", "left");
    if (value > 0) {
      nextDateCell.innerHTML = value + " (" + dayNames[date.getDay()] + ")";
    } else {
      nextDateCell.innerHTML = "0 (" + dayNames[date.getDay()] + ")";
    }
    const severity = this.getSeverity(type, value);

    switch (severity) {
      case "LOW":
        nextDateCell.style.color = "green";
        break;
      case "MEDIUM":
        nextDateCell.style.color = "yellow";
        break;
      case "HIGH":
        nextDateCell.style.color = "red";
        break;
      default:
        break;
    }

    nextDateCell.style.fontSize = textSize;

    return nextDateCell;
  },
  getSeverity: function (type, value) {
    if (type == "Græs" || type == "Bynke") {
      if (value < 10) {
        return "LOW";
      } else if (value < 50) {
        return "MEDIUM";
      } else {
        return "HIGH";
      }
    } else if (type == "El" || type == "Elm") {
      if (value < 10) {
        return "LOW";
      } else if (value < 50) {
        return "MEDIUM";
      } else {
        return "HIGH";
      }
    } else if (type == "Birk") {
      if (value < 30) {
        return "LOW";
      } else if (value < 100) {
        return "MEDIUM";
      } else {
        return "HIGH";
      }
    } else if (type == "Hassel") {
      if (value < 5) {
        return "LOW";
      } else if (value < 15) {
        return "MEDIUM";
      } else {
        return "HIGH";
      }
    } else {
      return "UNKNOWN";
    }
  },
  getImage(type) {
    switch (type) {
      case "Græs":
        return "https://www.astma-allergi.dk/resources/pollen-icons/gr%C3%A6sIcon.png";
      case "Bynke":
        return "https://www.astma-allergi.dk/resources/pollen-icons/bynkeIcon.png";
      case "El":
        return "https://www.astma-allergi.dk/resources/pollen-icons/elIcon.png";
      case "Elm":
        return "https://www.astma-allergi.dk/resources/pollen-icons/elmIcon.png";
      case "Birk":
        return "https://www.astma-allergi.dk/resources/pollen-icons/birkIcon.png";
      case "Hassel":
        return "https://www.astma-allergi.dk/resources/pollen-icons/hasselIcon.png";
      case "Alternaria":
        return "https://www.astma-allergi.dk/resources/pollen-icons/alternariaIcon.png";
      case "Cladosporium":
        return "https://www.astma-allergi.dk/resources/pollen-icons/cladosporiumIcon.png";
      default:
        return null;
    }
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "POLLEN_DATA":
        this.now = this.getNow();
        const data = JSON.parse(payload.data);
        this.pollenData = data;
        break;
    }
  },
});
