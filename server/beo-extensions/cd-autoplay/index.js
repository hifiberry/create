/*Copyright 2018 Bang & Olufsen A/S
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

var exec = require("child_process").exec;

var debug = beo.debug;
var version = require("./package.json").version;

var settings = {
	cdAutoplayEnabled: false
};

var sources = null;

beo.bus.on('general', function(event) {
	if (event.header == "startup") {
		if (beo.extensions.sources &&
			beo.extensions.sources.setSourceOptions &&
			beo.extensions.sources.sourceDeactivated) {
			sources = beo.extensions.sources;
		}

		if (sources) {
			getCdAutoplayStatus(function(enabled) {
				sources.setSourceOptions("cd-autoplay", {
					enabled: enabled,
					transportControls: true,
					usesHifiberryControl: true,
					aka: "mpd-cd-autoplay"
				});
			});
		}
	}

	if (event.header == "activatedExtension") {
		if (event.content.extension == "cd-autoplay") {
			beo.bus.emit("ui", { target: "cd-autoplay", header: "cdAutoplaySettings", content: settings });
		}
	}
});

beo.bus.on('product-information', function(event) {
	if (event.header == "systemNameChanged") {
		// do nothing, let the reconfigure-players script handle the system name change
	}
});

beo.bus.on('cd-autoplay', function(event) {
	if (event.header == "cdAutoplayEnabled") {
		if (event.content.enabled != undefined) {
			setCdAutoplayStatus(event.content.enabled, function(newStatus, error) {
				beo.bus.emit("ui", { target: "cd-autoplay", header: "cdAutoplaySettings", content: settings });
				if (sources) sources.setSourceOptions("cd-autoplay", { enabled: newStatus });
				if (newStatus == false) {
					if (sources) sources.sourceDeactivated("cd-autoplay");
				}
				if (error) {
					beo.bus.emit("ui", { target: "cd-autoplay", header: "errorTogglingCdAutoplay", content: {} });
				}
			});
		}
	}
});

function getCdAutoplayStatus(callback) {
	exec("systemctl is-enabled --quiet mpd-cd-autoplay.service").on('exit', function(code) {
		if (code == 0) {
			settings.cdAutoplayEnabled = true;
			callback(true);
		} else {
			settings.cdAutoplayEnabled = false;
			callback(false);
		}
	});
}

function setCdAutoplayStatus(enabled, callback) {
	if (enabled) {
		exec("systemctl unmask mpd-cd-autoplay.service").on('exit', function(code) {
			if (code == 0) {
				settings.cdAutoplayEnabled = true;
				if (debug) console.log("cd-autoplay enabled.");
				callback(true);
			} else {
				settings.cdAutoplayEnabled = false;
				callback(false, true);
			}
		});
	} else {
		exec("systemctl mask mpd-cd-autoplay.service").on('exit', function(code) {
			settings.cdAutoplayEnabled = false;
			if (code == 0) {
				callback(false);
				if (debug) console.log("cd-autoplay disabled.");
			} else {
				callback(false, true);
			}
		});
	}
}

module.exports = {
	version: version,
	isEnabled: getCdAutoplayStatus
};
