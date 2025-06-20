Module.register("MMM-DynamicWallpaper", {
    defaults: {
        images: [
            { file: "morning.jpg", startHour: 6, endHour: 10.5, name: "morning" },
            { file: "day.jpg", startHour: 10.5, endHour: 16, name: "day" },
            { file: "afternoon.jpg", startHour: 16, endHour: 19.5, name: "afternoon" },
            { file: "evening.jpg", startHour: 19.5, endHour: 22, name: "evening" },
            { file: "night.jpg", startHour: 22, endHour: 6, name: "night" }
        ],
        transitionDuration: 60000, // 60 seconds
        updateInterval: 300000, // Check every 5 minutes
        imagePath: "css/wallpapers/"
    },

    // Add this to your wallpaper module's start() function
start: function() {
    this.addTextShadows();
    this.updateBackground();
    setInterval(() => {
        this.updateBackground();
    }, this.config.updateInterval);
},

addTextShadows: function() {
    const style = document.createElement('style');
    style.textContent = `
        .module-content,
        .module-header,
        .clock,
        .weather,
        .currentweather,
        .weatherforecast {
            text-shadow: 
                2px 2px 4px rgba(0,0,0,0.8),
                -1px -1px 2px rgba(0,0,0,0.5),
                1px 1px 2px rgba(0,0,0,0.8) !important;
            color: white !important;
        }
        
        .dimmed {
            color: rgba(255,255,255,0.8) !important;
        }
    `;
    document.head.appendChild(style);
},

    updateBackground: function() {
        const now = new Date();
        const currentHour = now.getHours() + (now.getMinutes() / 60);
        
        let currentImage = this.getCurrentImage(currentHour);
        Log.info("Current time: " + currentHour + ", Using image: " + currentImage.file);
        
        // For now, just set the background without transitions
        this.setBackground(currentImage);
    },

    getCurrentImage: function(hour) {
        for (let img of this.config.images) {
            if (this.isTimeInRange(hour, img.startHour, img.endHour)) {
                return img;
            }
        }
        return this.config.images[0]; // Default to first image
    },

    isTimeInRange: function(hour, start, end) {
        if (start <= end) {
            return hour >= start && hour < end;
        } else { // Handles overnight ranges (like 22-6)
            return hour >= start || hour < end;
        }
    },

    setBackground: function(img) {
        const body = document.querySelector('body');
        const imagePath = this.config.imagePath + img.file;
        Log.info("Setting background to: " + imagePath);
        
        body.style.backgroundImage = `url('${imagePath}')`;
        body.style.backgroundSize = 'cover';  // This should fill the screen
        body.style.backgroundPosition = 'center center';
        body.style.backgroundRepeat = 'no-repeat';
        body.style.backgroundAttachment = 'fixed';
        body.style.transition = 'none';
        
        // Also ensure the body and html fill the entire viewport
        body.style.margin = '0';
        body.style.padding = '0';
        body.style.width = '100vw';
        body.style.height = '100vh';
        
        // Make sure html element is also full size
        document.documentElement.style.margin = '0';
        document.documentElement.style.padding = '0';
        document.documentElement.style.width = '100%';
        document.documentElement.style.height = '100%';
    },

    getDom: function() {
        return document.createElement("div");
    }
});