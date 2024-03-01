Module.register("MMM-Pollen-DK", {
	defaults: {
		region: "west",
		pollenTypes: ["Græs", "Birk", "Bynke", "Elm", "El", "Hassel", "Cladosporium", "Alternaria"]
	},

	regions: {
		east: 48,
		west: 49
	},

	pollenTypes: {
		El: 1,
		Hassel: 2,
		Elm: 4,
		Birk: 7,
		Græs: 28,
		Bynke: 31,
		Alternaria: 44,
		Cladosporium: 45
	},
	pollenData: null,
	start: function () {
		Log.info("Starting module: " + this.name);
		this.getData();
		this.now = this.getNow();
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

	updateTable: function (data) {
		this.pollenData = data;
		this.getDom();
	},

	getScripts: function () {
		return ["//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.2/jquery.js", "moment.js"];
	},

	getStyles: function () {
		return [];
	},
	getNow: function () {
		return moment().format("DD.MM.YY - HH:mm:ss");
	},

	getHeader: function () {
		return "Pollen DK";
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
		const pollenTypesAreValid = this.validatePollenTypes(this.config.pollenTypes);

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
		link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";
		document.head.appendChild(link);

		if (regionIsValid != true) {
			wrapper.innerHTML = regionIsValid;
			return wrapper;
		}
		if (pollenTypesAreValid != true) {
			wrapper.innerHTML = pollenTypesAreValid;
			return wrapper;
		}

		const region = this.config.region;
		const pollenTypes = this.config.pollenTypes;

		wrapper = this.renderTitle(wrapper);

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
		labelRow.appendChild(pollenTypeLabel);

		// Pollen Season Icon
		var pollenSeasonLabel = document.createElement("th");
		var pollenSeasonIcon = document.createElement("i");
		pollenSeasonIcon.classList.add("fa", "fa-clock-o");
		pollenSeasonLabel.setAttribute("width", "20px");
		pollenSeasonLabel.appendChild(pollenSeasonIcon);
		pollenSeasonLabel.setAttribute("align", "left");
		pollenSeasonLabel.setAttribute("width", "20px");
		labelRow.appendChild(pollenSeasonLabel);

		var pollenName = document.createElement("th");
		pollenName.innerHTML = "Navn";
		pollenName.setAttribute("align", "left");
		labelRow.appendChild(pollenName);

		// Pollen Value Icon
		var pollenValueLabel = document.createElement("th");
		var pollenValueIcon = document.createElement("i");
		pollenValueIcon.classList.add("fa", "fa-leaf");
		pollenValueLabel.appendChild(pollenValueIcon);
		pollenValueLabel.setAttribute("align", "left");
		labelRow.appendChild(pollenValueLabel);

		// Next pollen value icon
		var pollenNextLabel = document.createElement("th");
		var pollenNextIcon = document.createElement("i");
		pollenNextIcon.classList.add("fa", "fa-line-chart");
		pollenNextLabel.appendChild(pollenNextIcon);
		pollenNextLabel.setAttribute("align", "left");
		labelRow.appendChild(pollenNextLabel);

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
			const pollenData = regionData?.mapValue?.fields?.data?.mapValue?.fields?.[pollenId]?.mapValue?.fields;
			// console.log("pollenData for " + pollenTypes[i]);
			// console.log(pollenData);

			const predictions = pollenData?.predictions?.mapValue?.fields;
			const nextPredictionCell = this.getLatestPrediction(pollenTypes[i], predictions);

			var iconCell = document.createElement("td");
			iconCell.setAttribute("align", "left");
			const iconUrl = this.getImage(pollenTypes[i]);
			if (iconUrl) {
				var logo = document.createElement("img");
				logo.src = iconUrl;
				logo.width = 20;
				logo.height = 20;
				iconCell.appendChild(logo);
			} else {
				iconCell.innerHTML = "ERROR";
			}

			var typeCell = document.createElement("td");
			typeCell.setAttribute("align", "left");
			const type = pollenTypes[i];
			typeCell.innerHTML = type;

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

			var seasonCellLabel = document.createElement("td");
			var seasonCellIcon = document.createElement("i");
			seasonCellLabel.setAttribute("align", "left");
			if (pollenData?.inSeason?.booleanValue) {
				seasonCellIcon.classList.add("fa", "fa-check-circle");
			} else {
				seasonCellIcon.classList.add("fa", "fa-times-circle");
			}
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
	getLatestPrediction(type, predictions) {
		const keys = Object.keys(predictions);
		// Convert each string date to a Date object in the correct format and find the latest date
		let nextDate = keys.reduce(
			(min, dateStr) => {
				// Convert 'dd-mm-yyyy' to 'yyyy-mm-dd'
				let [day, month, year] = dateStr.split("-");
				let date = new Date(`${year}-${month}-${day}`);

				return date < min ? date : min;
			},
			new Date(keys[0].split("-").reverse().join("-"))
		); // Initial min date

		// Convert the latest Date object back to a string in the 'dd-mm-yyyy' format
		const nextDayKey = `${nextDate.getDate().toString().padStart(2, "0")}-${(nextDate.getMonth() + 1).toString().padStart(2, "0")}-${nextDate.getFullYear()}`;
		// console.log("dates");
		// console.log(keys);
		// console.log("nextDayKey");
		// console.log(nextDayKey);

		var dayNames = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "lør"];
		const date = new Date(nextDayKey);
		const value = predictions[nextDayKey]?.mapValue?.fields?.prediction?.stringValue;

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
			case "Græs":
				return "grass.png";
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
				this.updateTable(JSON.parse(payload.data));
				break;
		}
	}
});
