var NodeHelper = require("node_helper");
const {google} = require('googleapis');
const fs = require('fs');

module.exports = NodeHelper.create({

start: function() {
console.log("Starting node helper for: " + this.name);
this.oAuth2Client;
this.service;
},

socketNotificationReceived: function(notification, payload) {
if (notification === "MODULE_READY") {
if(!this.service) {
this.authenticate();
} else {
console.log("TASKS SERVICE ALREADY RUNNING, DONT NEED TO AUTHENTICATE AGAIN")
this.sendSocketNotification("SERVICE_READY", {});
}
} else if (notification === "REQUEST_UPDATE") {
this.getList(payload);
} else if (notification === "UPDATE_TASK") {
this.updateTask(payload);
}
},

authenticate: function() {
var self = this;

fs.readFile(self.path + '/credentials.json', (err, content) => {
if (err) return console.log('Error loading client secret file:', err);
authorize(JSON.parse(content), self.startTasksService);
});

function authorize(credentials, callback) {
const {client_secret, client_id, redirect_uris} = credentials.installed;
self.oAuth2Client = new google.auth.OAuth2(
client_id, client_secret, redirect_uris[0]);
fs.readFile(self.path + '/token.json', (err, token) => {
if (err) return console.log('Error loading token');
self.oAuth2Client.setCredentials(JSON.parse(token));
callback(self.oAuth2Client, self);
});
}
},

startTasksService: function(auth, self) {
self.service = google.tasks({version: 'v1', auth});
self.sendSocketNotification("SERVICE_READY", {});
},

getList: function(config) {
var self = this;

if(!self.service) {
console.log("Refresh required");
return;
}

self.service.tasks.list({
tasklist: config.listID,
maxResults: config.maxResults,
showCompleted: config.showCompleted,
showHidden: config.showHidden,
}, (err, res) => {
if (err) return console.error('The API returned an error: ' + err);

var payload = {id: config.listID, items: res.data.items};
self.sendSocketNotification("UPDATE_DATA", payload);
});
},

// NEW: Add task update functionality
updateTask: function(payload) {
    var self = this;

    if(!self.service) {
        console.log("Service not ready");
        return;
    }

    console.log("Updating task:", payload.taskId, "to status:", payload.status);

    // First get the current task to preserve its properties
    self.service.tasks.get({
        tasklist: payload.listID,
        task: payload.taskId
    }, (err, currentTask) => {
        if (err) {
            console.error('Error getting current task:', err);
            return;
        }

        // Update the task while preserving all existing properties
        const updatedTask = {
            id: payload.taskId,
            title: currentTask.data.title, // Preserve title
            notes: currentTask.data.notes, // Preserve notes
            due: currentTask.data.due, // Preserve due date
            status: payload.status // Update status
        };

        self.service.tasks.update({
            tasklist: payload.listID,
            task: payload.taskId,
            resource: updatedTask
        }, (err, res) => {
            if (err) {
                console.error('Error updating task:', err);
                self.sendSocketNotification("TASK_UPDATE_ERROR", {error: err});
            } else {
                console.log('Task updated successfully');
                self.sendSocketNotification("TASK_UPDATED", {taskId: payload.taskId, status: payload.status});
            }
        });
    });
},
});