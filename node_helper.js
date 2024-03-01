var NodeHelper = require("node_helper");
let fetch;

import("node-fetch")
	.then((module) => {
		fetch = module.default;
	})
	.catch((err) => console.error("Failed to load node-fetch:", err));

module.exports = NodeHelper.create({
	start: function () {
		console.log("MMM-Pollen-DK module starting...");
	},

	socketNotificationReceived: function (notification, payload) {
		console.log("MMM-Pollen-DK received a notification: " + notification);
		if (notification == "GET_POLLEN_DATA") {
			this.fetchData();
		} else {
			console.error("MMM-Pollen-DK: Unknown notification: " + notification);
		}
	},
	fetchData: function () {
		console.log("Fetching pollen data...");
		var self = this;
		const url = "https://www.astma-allergi.dk/umbraco/Api/PollenApi/GetPollenFeed";
		const refreshTime = 300000; // Gets new data every 5 mins

		fetch(url)
			.then((res) => res.text())
			.then(function (body) {
				const data = JSON.parse(body);

				self.sendSocketNotification("POLLEN_DATA", {
					data: data
				});
			})
			.catch(function (e) {
				console.error("MMM-Pollen-DK failed to get pollen data..");
				console.error(e);
			})
			.finally(function (e) {
				setTimeout(function () {
					self.fetchData();
				}, refreshTime);
			});
	}
});
