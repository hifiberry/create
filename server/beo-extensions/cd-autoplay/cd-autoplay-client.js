var cd_autoplay = (function() {
	var cdAutoplayEnabled = false;

	$(document).on("cd-autoplay", function(event, data) {
		if (data.header == "cdAutoplaySettings") {
			if (data.content.cdAutoplayEnabled) {
				cdAutoplayEnabled = true;
				$("#cd-autoplay-enabled-toggle").addClass("on");
			} else {
				cdAutoplayEnabled = false;
				$("#cd-autoplay-enabled-toggle").removeClass("on");
			}

			beo.notify(false, "cd-autoplay");
		}
	});

	function toggleEnabled() {
		enabled = (!cdAutoplayEnabled) ? true : false;
		if (enabled) {
			beo.notify({ title: "Turning automatic CD playback on...", icon: "attention", timeout: false, id: "cd-autoplay" });
		} else {
			beo.notify({ title: "Turning automatic CD playback off...", icon: "attention", timeout: false, id: "cd-autoplay" });
		}
		beo.send({ target: "cd-autoplay", header: "cdAutoplayEnabled", content: { enabled: enabled } });
	}

	return {
		toggleEnabled: toggleEnabled,
	};
})();
