/* global Module, Log, moment */

Module.register("MMM-GoogleTasksTouch", {
	// Default module config.
	defaults: {
		listID: "", // List ID (see authenticate.js)
		maxResults: 10,
		showCompleted: true, //set showCompleted and showHidden true
		ordering: "myorder", // Order by due date or by 'my order' NOT IMPLEMENTED
		dateFormat: "MMM Do", // Format to display dates (moment.js formats)
		updateInterval: 10000, // Time between content updates (millisconds)
		animationSpeed: 0, // Speed of the update animation (milliseconds). Set to 0 to disable module fade.
		tableClass: "small", // Name of the classes issued from main.css
	},

	// Define required scripts
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required styles.
	getStyles: function () {
		return ["font-awesome.css", "MMM-GoogleTasksTouch.css"];
	},

	// Define start sequence
	start: function () {
		Log.info("Starting module: " + this.name);
		this.tasks = [];
		this.loaded = false;
		this.taskPositions = new Map(); // Store task element positions for animations

		if (!this.config.listID) {
			Log.log("config listID required");
		} else {
			this.sendSocketNotification("MODULE_READY", {});
		}

		// API requires completed config settings if showCompleted
		if (this.config.showCompleted) {
			this.config.showHidden = true;
		}
	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification === "SERVICE_READY") {
			self.sendSocketNotification("REQUEST_UPDATE", self.config);

			// Create repeating call to node_helper get list
			setInterval(function () {
				self.sendSocketNotification("REQUEST_UPDATE", self.config);
			}, self.config.updateInterval);

			// Check if payload id matches module id
		} else if (notification === "UPDATE_DATA" && payload.id === self.config.listID) {
			// Handle new data
			self.loaded = true;
			// We need to record positions *before* the new data replaces the old
			this.recordPositions();
			if (payload.items) {
				this.tasks = payload.items;
			} else {
				this.tasks = [];
				Log.info("No tasks found.");
			}
			this.updateDom();
		}
	},

	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.className = "container " + this.config.tableClass;

		if (!this.loaded) {
			wrapper.innerHTML = "LOADING";
			wrapper.className = this.config.tableClass + " dimmed";
			return wrapper;
		}
		
		if (!this.tasks || this.tasks.length === 0) {
			wrapper.innerHTML = "EMPTY";
			wrapper.className = this.config.tableClass + " dimmed";
			return wrapper;
		}


		// Sort tasks: incomplete first, then completed by most recently updated.
		var sortedTasks = this.tasks.slice().sort(function (a, b) {
			if (a.status === b.status) {
				if (a.status === "completed") {
					// Both completed: sort by updated date descending (newest first)
					return new Date(b.updated) - new Date(a.updated);
				}
				// Both incomplete: maintain original API order ('myorder')
				return 0;
			}
			// Incomplete tasks first
			return a.status === "completed" ? 1 : -1;
		});

		sortedTasks.forEach((item, i) => {
			var taskWrapper = document.createElement("div");
			taskWrapper.className = "task-wrapper";
			taskWrapper.dataset.taskId = item.id;
			
			var titleWrapper = document.createElement("div");
			var classes = "item title clickable";
			if (item.status === "completed") {
				classes += " completed";
			}
			titleWrapper.className = classes;

			var icon = item.status === "completed" ? '<i class="fa fa-check-circle completed-icon"></i>' : '<i class="fa fa-circle-thin todo-icon"></i>';
			titleWrapper.innerHTML = icon + item.title;

			titleWrapper.addEventListener("click", () => {
				this.toggleTask(item);
			});
			
			if (item.parent) {
				titleWrapper.classList.add("child");
			}

			if (item.notes) {
				var noteWrapper = document.createElement("div");
				noteWrapper.className = "item notes light";
				noteWrapper.innerHTML = item.notes.replace(/\n/g, "<br>");
				titleWrapper.appendChild(noteWrapper);
			}
			taskWrapper.appendChild(titleWrapper);

			var dateWrapper = document.createElement("div");
			dateWrapper.className = "item date light";
			if (item.due) {
				var date = moment(item.due);
				dateWrapper.innerHTML = date.utc().format(this.config.dateFormat);
			}
			taskWrapper.appendChild(dateWrapper);

			// Create borders between parent items
			if (i < sortedTasks.length - 1 && !sortedTasks[i+1].parent) {
                 taskWrapper.style.borderBottom = "1px solid #666";
            }
			
			wrapper.appendChild(taskWrapper);
		});
		
        // --- Progress Bar ---
        if (this.tasks && this.tasks.length > 0) {
            const totalTasks = this.tasks.length;
            const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
            const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            const progressBarContainer = document.createElement("div");
            progressBarContainer.className = "progress-bar-container";

            const progressBarFill = document.createElement("div");
            progressBarFill.className = "progress-bar-fill";
            progressBarFill.style.width = percentage + "%";
            
            progressBarContainer.appendChild(progressBarFill);
            wrapper.appendChild(progressBarContainer);
        }

		// After the DOM is built, apply animations
        requestAnimationFrame(() => this.animateTasks());

		return wrapper;
	},
	
	recordPositions: function() {
        this.taskPositions.clear();
        const taskElements = this.getTaskElements();
        taskElements.forEach(el => {
            this.taskPositions.set(el.dataset.taskId, el.getBoundingClientRect());
        });
    },

    animateTasks: function() {
        const taskElements = this.getTaskElements();
        taskElements.forEach(el => {
            const id = el.dataset.taskId;
            const lastPos = el.getBoundingClientRect();
            const firstPos = this.taskPositions.get(id);

            // Don't animate new tasks that are appearing for the first time
            if (!firstPos) return;
            
            const dx = firstPos.left - lastPos.left;
            const dy = firstPos.top - lastPos.top;

            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                requestAnimationFrame(() => {
                    el.style.transform = `translate(${dx}px, ${dy}px)`;
                    el.style.transition = 'transform 0s';
                    requestAnimationFrame(() => {
                        el.style.transform = '';
                        el.style.transition = 'transform 0.5s cubic-bezier(0.2, 0, 0, 1)';
                    });
                });
            }
        });
    },

	getTaskElements: function () {
		const moduleWrapper = document.getElementById(this.identifier);
		if (!moduleWrapper) return [];
		return moduleWrapper.querySelectorAll(".task-wrapper[data-task-id]");
	},

	toggleTask: function (task) {
		Log.info("Toggling task:", task.title);

		// Record positions before making any changes
		this.recordPositions();

		const newStatus = task.status === "completed" ? "needsAction" : "completed";

		// Optimistically update local task data
		const taskToUpdate = this.tasks.find((t) => t.id === task.id);
		if (taskToUpdate) {
			taskToUpdate.status = newStatus;
			if (newStatus === "completed") {
				taskToUpdate.updated = new Date().toISOString();
			}
		}

		// Send update to Google Tasks
		this.sendSocketNotification("UPDATE_TASK", {
			listID: this.config.listID,
			taskId: task.id,
			status: newStatus,
		});

		// Re-render the DOM, which will trigger animations
		this.updateDom(0);
	},
});
