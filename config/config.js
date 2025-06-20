/* Config Sample
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/configuration/introduction.html
 * and https://docs.magicmirror.builders/modules/configuration.html
 *
 * You can use environment variables using a `config.js.template` file instead of `config.js`
 * which will be converted to `config.js` while starting. For more information
 * see https://docs.magicmirror.builders/configuration/introduction.html#enviromnent-variables
 */
let config = {
	address: "localhost",	// Address to listen on, can be:
							// - "localhost", "127.0.0.1", "::1" to listen on loopback interface
							// - another specific IPv4/6 to listen on a specific interface
							// - "0.0.0.0", "::" to listen on any interface
							// Default, when address config is left out or empty, is "localhost"
	port: 8080,
	basePath: "/",	// The URL path where MagicMirror² is hosted. If you are using a Reverse proxy
									// you must set the sub path here. basePath must end with a /
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],	// Set [] to allow all IP addresses
									// or add a specific IPv4 of 192.168.1.5 :
									// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
									// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
									// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

	useHttps: false,			// Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: "",	// HTTPS private key path, only require when useHttps is true
	httpsCertificate: "",	// HTTPS Certificate path, only require when useHttps is true

	language: "en",
	locale: "en-US",   // this variable is provided as a consistent location
			   // it is currently only used by 3rd party modules. no MagicMirror code uses this value
			   // as we have no usage, we  have no constraints on what this field holds
			   // see https://en.wikipedia.org/wiki/Locale_(computer_software) for the possibilities

	logLevel: ["INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
	timeFormat: 12,
	units: "imperial",

    // electronOptions: {
    //     width: 1280,
    //     height: 720,
    // },

	modules: [
        {
            module: "alert",
        },
        {
            module: "clock",
            position: "top_right",
            config: {
                timeFormat: 12,
                displayType: "digital",
                showPeriod: true,
                showDate: true,
                showWeek: false,
                showSunTimes: false,
                showMoonTimes: false,
                displaySeconds: false,
                lat: 37.4419,
                lon: -122.1430
            }
        },
        {
            module: "weather",
            position: "top_right",
            config: {
                weatherProvider: "openweathermap",
                type: "current",
                lat: 37.4419,
                lon: -122.1430,
                apiKey: "bf36abb72b5ba4a69d9ab2293a841e2a",
                units: "imperial",
                showWindDirection: false,
                showWindSpeed: false,
                showSunTimes: false,
                showFeelsLike: true
            }
        },
        {
            module: "weather",
            position: "top_right",
            config: {
                weatherProvider: "openweathermap",
                type: "forecast",
                lat: 37.4419,
                lon: -122.1430,
                apiKey: "bf36abb72b5ba4a69d9ab2293a841e2a",
                maxNumberOfDays: 5,
                showRainAmount: true,
                colored: true,
                fade: false,
                units: "imperial"
            }
        },
        {
            module: "MMM-GoogleTasksTouch",
            position: "top_left",
            header: "Today's Tasks",
            config: {
                listID: "MTQxMjc5MTA0NjI5MDMxNTA0NDQ6MDow", // Copy from authenticate.js output
                maxResults: 10,
                showCompleted: true,
                dateFormat: "MMM Do",
                updateInterval: 30000, // 30 seconds
            }
        },
        {
            module: "compliments",
            position: "bottom_bar",
            config: {
                // Point to your new JSON file
                remoteFile: "compliments.json",
                // Set updateInterval to 0 to disable remote file fetching after initial load
                remoteFileRefreshInterval: 0, 
                // We handle fades manually now
                fadeSpeed: 2000 
            }
        },
        {
            module: "MMM-DynamicWallpaper",
            position: "fullscreen_below",
            config: {
                imagePath: "css/wallpapers/",
                transitionDuration: 60000, // 1 minute transition
                images: [
                    { file: "morning.jpg", startHour: 6, endHour: 10.5, name: "morning" },
                    { file: "day.jpg", startHour: 10.5, endHour: 16, name: "day" },
                    { file: "afternoon.jpg", startHour: 16, endHour: 19.5, name: "afternoon" },
                    { file: "evening.jpg", startHour: 19.5, endHour: 22, name: "evening" },
                    { file: "night.jpg", startHour: 22, endHour: 6, name: "night" }
                ]
            }
        }
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
