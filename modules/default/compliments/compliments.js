/* global Module, Log, moment */

Module.register("compliments", {
	// Module config defaults.
	defaults: {
		remoteFile: null,
		remoteFileRefreshInterval: 0,
		fadeSpeed: 4000,
		morningStartTime: 3,
		morningEndTime: 12,
		afternoonStartTime: 12,
		afternoonEndTime: 17
	},

	// Vars
	compliments: null,
	lastCompliment: "",
	lastTimeOfDay: "",
	lastWeatherType: "",
	lastDate: "",
	currentWeatherType: "",

	// Define start sequence.
	async start() {
		Log.info(`Starting module: ${this.name}`);

		if (!this.config.remoteFile) {
			Log.error("Compliments: remoteFile is not set. Please point to a JSON file.");
			return;
		}

		// Load the compliments file initially.
		await this.loadCompliments();

		// Start a timer to check for state changes every second.
		setInterval(() => {
			this.checkForUpdate();
		}, 1000); // Check every second
	},

	// Load compliments from the JSON file.
	async loadCompliments() {
		try {
			const response = await fetch(this.file(this.config.remoteFile));
			if (!response.ok) {
				throw new Error(`Failed to load compliments file: ${response.statusText}`);
			}
			this.compliments = await response.json();
			Log.info("Compliments file loaded successfully.");
			// Perform an initial updateDom after loading
			this.updateDom(this.config.fadeSpeed);
		} catch (error) {
			Log.error(`Compliments: ${error.message}`);
			this.compliments = null; // Ensure we don't use stale data
		}
	},

	checkForUpdate() {
		const newTimeOfDay = this.getTimeOfDay();
		const newWeatherType = this.currentWeatherType;
		const newDate = moment().format("YYYY-MM-DD");

		const timeChanged = newTimeOfDay !== this.lastTimeOfDay;
		const weatherChanged = newWeatherType !== this.lastWeatherType;
		const dateChanged = newDate !== this.lastDate;

		if (timeChanged || weatherChanged || dateChanged) {
			Log.info("State change detected, updating compliment.");
			Log.info(`Details: TimeOfDay: ${this.lastTimeOfDay}->${newTimeOfDay}, Weather: ${this.lastWeatherType}->${newWeatherType}, Date: ${this.lastDate}->${newDate}`);
			this.updateDom(this.config.fadeSpeed);
		}
	},

	getTimeOfDay() {
		const hour = moment().hour();
		if (hour >= this.config.morningStartTime && hour < this.config.morningEndTime) {
			return "morning";
		}
		if (hour >= this.config.afternoonStartTime && hour < this.config.afternoonEndTime) {
			return "afternoon";
		}
		return "evening";
	},

	/**
	 * Gets a compliment based on the updated priority logic.
	 * @returns {string} A compliment string.
	 */
	getCompliment() {
		if (!this.compliments) {
			return "Loading compliments...";
		}

		const now = moment();
		const date_YYYYMMDD = now.format("YYYY-MM-DD");
		const date_MMDD = now.format("....-MM-DD");

		let complimentList = [];

		// Priority 1: Special Dates
		if (this.compliments.special_dates) {
			if (this.compliments.special_dates[date_YYYYMMDD]) {
				complimentList = this.compliments.special_dates[date_YYYYMMDD];
			} else if (this.compliments.special_dates[date_MMDD]) {
				complimentList = this.compliments.special_dates[date_MMDD];
			}
		}

		// If no special date, proceed to weather and time of day
		if (complimentList.length === 0) {
			// High-priority types that should override time of day
			const highPriorityWeather = ["rain", "snow", "showers", "fog", "thunderstorm", "drizzle", "night-rain", "night-snow", "night-showers", "night-thunderstorm"];
			// Regular types that will be mixed with time of day
			const regularWeather = ["clear", "clouds", "day-sunny", "day-cloudy", "cloudy", "cloudy-windy", "night-clear", "night-cloudy", "night-alt-cloudy-windy"];
			const timeOfDay = this.getTimeOfDay();

			// Priority 2: High-Priority Weather
			if (highPriorityWeather.includes(this.currentWeatherType) && this.compliments[this.currentWeatherType]) {
				complimentList = this.compliments[this.currentWeatherType];
			} else {
				// Priority 3: Mix Time of Day with Regular Weather
				// Start with time of day compliments
				if (this.compliments[timeOfDay]) {
					complimentList = [...this.compliments[timeOfDay]];
				}
				// Add regular weather compliments to the list
				if (regularWeather.includes(this.currentWeatherType) && this.compliments[this.currentWeatherType]) {
					complimentList.push(...this.compliments[this.currentWeatherType]);
				}
			}
		}

		if (complimentList.length === 0) {
			return "No compliments available.";
		}

		const randomIndex = Math.floor(Math.random() * complimentList.length);
		let newCompliment = complimentList[randomIndex];
		
		if (complimentList.length > 1 && newCompliment === this.lastCompliment){
			return this.getCompliment(); // Try again to avoid repeats
		}
		
		this.lastCompliment = newCompliment;
		return newCompliment;
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright pre-line";
		
		const complimentText = this.getCompliment();
		wrapper.innerHTML = complimentText;

		this.lastTimeOfDay = this.getTimeOfDay();
		this.lastWeatherType = this.currentWeatherType;
		this.lastDate = moment().format("YYYY-MM-DD");

		return wrapper;
	},

	notificationReceived(notification, payload, sender) {
		if (notification === "CURRENTWEATHER_TYPE") {
			Log.info(`Weather type received: ${payload.type}`);
			this.currentWeatherType = payload.type;
		}
	}
});
