const prefix = "FailBot: ";
const aircraft = this.$api.variables.get("A:Title", "String");
const log_firebot_events = true;

const config = {
	conditions: {
		engine: {
			0: { minRunning: 0, maxFailed: 0 },
			1: { minRunning: 0, maxFailed: 1 },
			2: { minRunning: 1, maxFailed: 1 },
			3: { minRunning: 1, maxFailed: 2 },
			4: { minRunning: 1, maxFailed: 3 },
		}
	},
	engine: {
		failedCondition: {
			1: { variable: "A:ENG FAILED:1", type: "Bool", value: 1 },
			2: { variable: "A:ENG FAILED:2", type: "Bool", value: 1 },
			3: { variable: "A:ENG FAILED:3", type: "Bool", value: 1 },
			4: { variable: "A:ENG FAILED:4", type: "Bool", value: 1 },
		},
		runningCondition: {
			1: { variable: "A:ENG COMBUSTION:1", type: "Bool", value: 1 },
			2: { variable: "A:ENG COMBUSTION:2", type: "Bool", value: 1 },
			3: { variable: "A:ENG COMBUSTION:3", type: "Bool", value: 1 },
			4: { variable: "A:ENG COMBUSTION:4", type: "Bool", value: 1 },
		},
		failAction: {
			1: { variable: "K:TOGGLE_ENGINE1_FAILURE", type: "Bool", value: 1, },
			2: { variable: "K:TOGGLE_ENGINE2_FAILURE", type: "Bool", value: 1, },
			3: { variable: "K:TOGGLE_ENGINE3_FAILURE", type: "Bool", value: 1, },
			4: { variable: "K:TOGGLE_ENGINE4_FAILURE", type: "Bool", value: 1, },
		},
		fixAction: {
			1: { variable: "K:TOGGLE_ENGINE1_FAILURE", type: "Bool", value: 1, },
			2: { variable: "K:TOGGLE_ENGINE2_FAILURE", type: "Bool", value: 1, },
			3: { variable: "K:TOGGLE_ENGINE3_FAILURE", type: "Bool", value: 1, },
			4: { variable: "K:TOGGLE_ENGINE4_FAILURE", type: "Bool", value: 1, },
		},
		count: { variable: "A:NUMBER OF ENGINES", type: "Number" }, // minimum 0, maximum 4 before SU12, 16 on SU12?
	},
	fuel: {
		offCondition: {
			1: { variable: "A:FUEL TANK SELECTOR:1", type: "Enum", value: 0 },
			2: { variable: "A:FUEL TANK SELECTOR:2", type: "Enum", value: 0 },
			3: { variable: "A:FUEL TANK SELECTOR:3", type: "Enum", value: 0 },
			4: { variable: "A:FUEL TANK SELECTOR:4", type: "Enum", value: 0 },
		},
		offAction: {
			1: { variable: "K:FUEL_SELECTOR_SET", type: "Enum", value: 0, },
			2: { variable: "K:FUEL_SELECTOR_2_SET", type: "Enum", value: 0, },
			3: { variable: "K:FUEL_SELECTOR_3_SET", type: "Enum", value: 0, },
			4: { variable: "K:FUEL_SELECTOR_4_SET", type: "Enum", value: 0, },
		},
	},
	firebot: {
		update_interval_ms: 10000,
		events: {
			update_interval_ms: 10000,
			pause: "http://localhost:7472/api/v1/effects/preset/48f93dc0-cb41-11ed-ac72-f9b06d0df55f",
			unpause: "http://localhost:7472/api/v1/effects/preset/afd0d3a0-cb64-11ed-ac72-f9b06d0df55f",
			failEngineAvailable: "http://localhost:7472/api/v1/effects/preset/d276d7b0-cb41-11ed-adb2-a13f208bfc77",
			failEngineUnavailable: "http://localhost:7472/api/v1/effects/preset/19cad0d0-cbd8-11ed-a699-eb1929f85242",
			fixEngineAvailable: "http://localhost:7472/api/v1/effects/preset/ff684650-cb41-11ed-adb2-a13f208bfc77",
			fixEngineUnavailable: "http://localhost:7472/api/v1/effects/preset/87911480-cbd8-11ed-a699-eb1929f85242",
		}
	}
};

if (aircraft.startsWith("Black Square Baron")) {
	config.engine.failAction[1].variable = "H:BKSQ_FAILURE_L_ENGINE_FAILURE";
	config.engine.failAction[2].variable = "H:BKSQ_FAILURE_R_ENGINE_FAILURE";

	config.engine.fixAction[1].variable = "H:BKSQ_FAILURE_L_ENGINE_FAILURE";
	config.engine.fixAction[2].variable = "H:BKSQ_FAILURE_R_ENGINE_FAILURE";
}

this.settings = {
	store: {
		script_enabled: true,
		intro_message: true,
		outro_message: true,
		sleeping: false,
		trigger_moderator: true,
		trigger_viewer: false,
		firebot_integration: false,
		fuel_events: false,
	},
	init: () => {
		const persisted = this.$api.datastore.import();
		this.settings.store = persisted ? persisted : this.settings.store;
		this.settings.settings_define();
	},
	settings_define: () => {
		settings_define({
			sleeping: {
				type: "checkbox",
				label: "Sleeping (events off)",
				value: this.settings.store.sleeping,
				changed: (value) => {
					this.settings.store.sleeping = value;
					this.$api.datastore.export(this.settings.store);
				}
			},
			trigger_moderator: {
				type: "checkbox",
				label: "Trigger by Moderators",
				value: this.settings.store.trigger_moderator,
				changed: (value) => {
					this.settings.store.trigger_moderator = value;
					this.$api.datastore.export(this.settings.store);
				}
			},
			trigger_viewer: {
				type: "checkbox",
				label: "Trigger by Viewers",
				value: this.settings.store.trigger_viewer,
				changed: (value) => {
					this.settings.store.trigger_viewer = value;
					this.$api.datastore.export(this.settings.store);
				}
			},
			firebot_integration: {
				type: "checkbox",
				label: "Firebot integration",
				value: this.settings.store.firebot_integration,
				changed: (value) => {
					this.settings.store.firebot_integration = value;
					this.$api.datastore.export(this.settings.store);
				}
			},
			fuel_events: {
				type: "checkbox",
				label: "Fuel commands",
				value: this.settings.store.fuel_events,
				changed: (value) => {
					this.settings.store.fuel_events = value;
					this.$api.datastore.export(this.settings.store);
				}
			},
			intro_message: {
				type: "checkbox",
				label: "Online message ",
				value: this.settings.store.intro_message,
				changed: (value) => {
					this.settings.store.intro_message = value;
					this.$api.datastore.export(this.settings.store);
				}
			},
			outro_message: {
				type: "checkbox",
				label: "Offline message",
				value: this.settings.store.outro_message,
				changed: (value) => {
					this.settings.store.outro_message = value;
					this.$api.datastore.export(this.settings.store);
				}
			},
		});
	}
}

this.twitch = {
	init: () => {
		if (this.$api.twitch.is_connected()) {
			this.message.online();
		}

		twitch_connection(this.twitch.twitch_connection);
		twitch_message(this.twitch.twitch_message);
	},
	twitch_connection: (state) => {
		if (state) this.message.online();
	},
	twitch_message: (message) => {
		if (this.settings.store.script_enabled && message.parameters) {
			if (message.tags ? message.tags["display-name"] : false) {
				let reply_prefix = "@reply-parent-msg-id=" + message.tags["id"];
				let msg_params = message.parameters.split(" ");

				switch (msg_params[0].toLowerCase()) {
					case '!commands':
					case "!failbot": {
						this.commands.failBot();
						break;
					}

					case "!checkengine":
					case "!checkengines": {
						this.commands.checkEngine(reply_prefix);
						break;
					}

					case "!failengine": {
						if (this.twitch.shouldTriggerEvent(message, reply_prefix)) {
							this.commands.failEngine(reply_prefix);
						}

						break;
					}

					case "!fixengine":
					case "!fixengines": {
						if (this.twitch.shouldTriggerEvent(message, reply_prefix)) {
							this.commands.fixEngines(reply_prefix);
						}

						break;
					}

					case "!checkfuel": {
						if (this.settings.store.fuel_events) {
							this.commands.checkFuel(reply_prefix);
						}

						break;
					}

					case "!fueloff": {
						if (this.settings.store.fuel_events && this.twitch.shouldTriggerEvent(message, reply_prefix)) {
							this.commands.fuelOff(reply_prefix);
						}

						break;
					}
				}
			}
		}
	},
	shouldTriggerEvent: (message, reply_prefix) => {
		if (this.settings.store.sleeping) {
			this.message.sleeping(reply_prefix);
			return false;
		}

		if (this.settings.store.trigger_viewer) {
			return true;
		}

		if (this.settings.store.trigger_moderator && message.tags.mod) {
			return true;
		}

		if (message.tags.badges.broadcaster) {
			return true;
		}

		if (this.settings.store.trigger_moderator) {
			this.message.moderator(reply_prefix);
		} else {
			this.message.streamer(reply_prefix);
		}

		return false;
	},
}

this.message = {
	online: () => {
		if (this.settings.store.intro_message) {
			const sleeping = this.settings.store.sleeping ? "sleeping" : "active";
			this.$api.twitch.send_message("/me FailBot is online and " + sleeping + "!");
		}
	},
	offline: () => {
		if (this.settings.store.intro_message) {
			this.$api.twitch.send_message("/me FailBot is going offline!");
		}
	},
	sleeping: (reply_prefix) => {
		this.$api.twitch.send_message(prefix + "Sleeping... Zzz...", reply_prefix);
	},
	moderator: (reply_prefix) => {
		this.$api.twitch.send_message(prefix + "Only Moderators can trigger events with command", reply_prefix);
	},
	streamer: (reply_prefix) => {
		this.$api.twitch.send_message(prefix + "Only Streamer can trigger events with command", reply_prefix);
	},
}

this.firebot = {
	last_update: null,
	log: (message) => {
		if(log_firebot_events){
			const now = (new Date()).toISOString().substring(11);
			console.log(now + " Firebot: " + message)
		}
	},
	pause: () => {
		this.firebot.log("Pause");
		fetch(config.firebot.events.pause);
	},
	unpause: () => {
		this.firebot.log("Unpause");
		fetch(config.firebot.events.unpause);
	},
	failEngineAvailable: () => {
		this.firebot.log("Fail Engine Available");
		fetch(config.firebot.events.failEngineAvailable);
	},
	failEngineUnavailable: () => {
		this.firebot.log("Fail Engine Unavailable");
		fetch(config.firebot.events.failEngineUnavailable);
	},
	fixEngineAvailable: () => {
		this.firebot.log("Fix Engine Available");
		fetch(config.firebot.events.fixEngineAvailable);
	},
	fixEngineUnavailable: () => {
		this.firebot.log("Fix Engine Unavailable");
		fetch(config.firebot.events.fixEngineUnavailable);
	},
	update: () => {
		const now = new Date;
		const diff = now - this.firebot.last_update;
		if (diff < config.firebot.update_interval_ms) {
			return;
		}

		this.firebot.last_update = now;

		if (!this.settings.store.script_enabled || this.settings.store.sleeping) {
			this.firebot.pause();
			return;
		} else {
			this.firebot.unpause();
		}

		if (this.engine.canFailEngine()) {
			this.firebot.failEngineAvailable();
		} else {
			this.firebot.failEngineUnavailable();
		}

		if (this.engine.isAnyFailed()) {
			this.firebot.fixEngineAvailable();
		} else {
			this.firebot.fixEngineUnavailable();
		}
	},
	onStart: () => {
		this.firebot.update();
	},
	onExit: () => {
		this.firebot.pause();
	},
}

this.core = {
	init: () => {
		run(this.core.run);

		state(this.core.state);
		info(this.core.info);
		style(this.core.style);

		script_message_rcv(this.core.script_message_rcv);

		loop_1hz(this.firebot.update);
	},
	exit: () => {
		this.message.offline();

		if(this.settings.store.firebot_integration){
			this.firebot.onExit();
		}
		
		console.log("FailBot exited");
	},
	run: () => {
		this.settings.store.script_enabled = !this.settings.store.script_enabled;
		if (this.settings.store.script_enabled) {
			if (this.settings.store.intro_message) {
				this.$api.twitch.send_message("/me FailBot is now enabled and " + (this.settings.store.sleeping ? "sleeping" : "active") + "!");
			}
		} else {
			if (this.settings.store.outro_message) {
				this.$api.twitch.send_message("/me FailBot is now disabled!");
			}
		}

		this.$api.datastore.export(this.settings.store);
		return true;
	},
	state: () => {
		if (this.$api.twitch.is_connected()) {
			return !this.settings.store.script_enabled ? "mdi:comment-off-outline:Fail Bot" : "mdi:comment:Fail Bot"
		} else {
			return "mdi:wifi-strength-off:Fail Bot";
		}
	},
	info: () => {
		if (this.$api.twitch.is_connected()) {
			return !this.settings.store.script_enabled ? "FailBot Disabled" : "FailBot Enabled";
		} else {
			return "FailBot Unavailable";
		}
	},
	style: () => {
		if (this.$api.twitch.is_connected()) {
			return this.settings.store.script_enabled ? "active" : "error";
		} else {
			return "error";
		}
	},
	script_message_rcv: (caller_reference_name, message, reply_callback) => {
		if (message === "sleeping") {
			reply_callback(this.settings.store.sleeping);
			return;
		}

		if (message === "toggle_sleep") {
			this.settings.store.sleeping = !this.settings.store.sleeping;
			this.$api.datastore.export(this.settings.store);
			this.set_settings();
			this.$api.twitch.send_message("/me FailBot is now " + (this.settings.store.sleeping ? "sleeping" : "active") + "!");
			reply_callback(this.settings.store.sleeping);
			return;
		}
	},
}

this.commands = {
	failBot: (reply_prefix) => {
		const msg = [
			"!checkEngine",
			"!failEngine",
			"!fixEngine",
		];

		if (this.settings.store.fuel_events) {
			msg.push("!checkFuel");
			msg.push("!fuelOff");
		}

		this.$api.twitch.send_message(prefix + msg.join(" "), reply_prefix);
	},
	checkEngine: () => {
		const enginesCount = this.engine.getCount();
		let message = "";

		for (let i = 0; i < enginesCount; i++) {
			const engineNumber = i + 1;
			message += "Engine " + engineNumber + " is " + this.engine.getState(engineNumber) + ". ";
		}

		this.$api.twitch.send_message(prefix + message);
	},
	failEngine: (reply_prefix) => {
		if (!this.engine.isLessThanMaxFailed()) {
			this.$api.twitch.send_message(prefix + "Umm... We already have " + enginesFailedCount + " failed engine" + (enginesFailedCount > 1 ? "s" : ""), reply_prefix);
			return;
		}

		if (!this.engine.isMoreThanMinRunning()) {
			const enginesCount = this.engine.getCount();
			const minRunning = config.conditions.engine[enginesCount].minRunning;
			this.$api.twitch.send_message(prefix + "Umm... We really need one at least " + minRunning + " engine" + (minRunning > 1 ? "s" : "") + " running", reply_prefix);
			return;
		}

		const runningEngines = this.engine.getRunningEngines();
		const engineNumber = this.utils.random(1, runningEngines.length);
		this.engine.fail(engineNumber);
		this.$api.twitch.send_message(prefix + "Aye Captain!", reply_prefix);
	},
	fixEngines: (reply_prefix) => {
		if (!this.engine.isAnyFailed()) {
			this.$api.twitch.send_message(prefix + "Umm... All engines are fine", reply_prefix);
			return;
		}

		this.engine.fixAll();
		this.$api.twitch.send_message(prefix + "Consider it done!", reply_prefix);
	},
	checkFuel: (reply_prefix) => {
		const enginesCount = this.engine.getCount();
		let message = "";

		for (let i = 0; i < enginesCount; i++) {
			const engineNumber = i + 1;
			message += "Fuel Selector " + engineNumber + " is " + this.fuel.getState(engineNumber) + ". ";
		}

		this.$api.twitch.send_message(prefix + message, reply_prefix);
	},
	fuelOff: (reply_prefix) => {
		const enginesCount = this.engine.getCount();

		const enginesRunningCount = this.engine.getRunningCount();
		const minRunning = config.conditions.engine[enginesCount].minRunning;
		if (enginesRunningCount <= minRunning) {
			this.$api.twitch.send_message(prefix + "Umm... We really need one at least " + minRunning + " engine" + (minRunning > 1 ? "s" : "") + " running", reply_prefix);
			return;
		}

		const runningEngines = this.engine.getRunningEngines();
		const fuelSelectorNumber = this.utils.random(1, runningEngines.length);
		this.fuel.off(fuelSelectorNumber);
		this.$api.twitch.send_message(prefix + "Aye Captain!", reply_prefix);
	},
}

this.engine = {
	isFailed: (engineNumber) => {
		const condition = config.engine.failedCondition[engineNumber];
		const value = this.$api.variables.get(condition.variable, condition.type);
		return value === condition.value;
	},
	isRunning: (engineNumber) => {
		const condition = config.engine.runningCondition[engineNumber];
		const value = this.$api.variables.get(condition.variable, condition.type);
		return value === condition.value;
	},
	isLessThanMaxFailed: () => {
		const enginesCount = this.engine.getCount();
		const enginesFailedCount = this.engine.getFailedCount();
		const maxFailed = config.conditions.engine[enginesCount].maxFailed;

		return enginesFailedCount < maxFailed;
	},
	isMoreThanMinRunning: () => {
		const enginesCount = this.engine.getCount();
		const enginesRunningCount = this.engine.getRunningCount();
		const minRunning = config.conditions.engine[enginesCount].minRunning;
		return enginesRunningCount > minRunning;
	},
	canFailEngine: () => {
		return this.engine.isLessThanMaxFailed()
			&& this.engine.isMoreThanMinRunning();
	},
	isAnyFailed: () => {
		const enginesCount = this.engine.getCount();
		let isAnyFailed = false;

		for (let i = 0; i < enginesCount; i++) {
			let engineNumber = i + 1;
			if (this.engine.isFailed(engineNumber)) {
				isAnyFailed = true;
			}
		}

		return isAnyFailed;
	},
	getCount: () => {
		const condition = config.engine.count;
		return this.$api.variables.get(condition.variable, condition.type);
	},
	getRunningCount: () => {
		const enginesCount = this.engine.getCount();
		let runningCount = 0;

		for (let i = 0; i < enginesCount; i++) {
			let engineNumber = i + 1;
			if (this.engine.isRunning(engineNumber)) {
				runningCount++;
			}
		}

		return runningCount;
	},
	getRunningEngines: () => {
		const enginesCount = this.engine.getCount();
		let runningEngines = [];

		for (let i = 0; i < enginesCount; i++) {
			let engineNumber = i + 1;
			if (this.engine.isRunning(engineNumber)) {
				runningEngines.push(engineNumber);
			}
		}

		return runningEngines;
	},
	getFailedCount: () => {
		const enginesCount = this.engine.getCount();
		let failedCount = 0;

		for (let i = 0; i < enginesCount; i++) {
			let engineNumber = i + 1;
			if (this.engine.isFailed(engineNumber)) {
				failedCount++;
			}
		}

		return failedCount;
	},
	getState: (engineNumber) => {
		if (this.engine.isRunning(engineNumber)) {
			return "Running";
		}

		if (this.engine.isFailed(engineNumber)) {
			return "Failed";
		}

		return "Off";
	},
	fail: (engineNumber) => {
		if (this.engine.isFailed(engineNumber)) {
			return;
		}

		const failAction = config.engine.failAction[engineNumber];
		this.$api.variables.set(failAction.variable, failAction.type, failAction.value);
	},
	fix: (engineNumber) => {
		if (!this.engine.isFailed(engineNumber)) {
			return;
		}

		const fixAction = config.engine.fixAction[engineNumber];
		this.$api.variables.set(fixAction.variable, fixAction.type, fixAction.value);
	},
	fixAll: () => {
		const enginesCount = this.engine.getCount();
		for (let i = 0; i < enginesCount; i++) {
			let engineNumber = i + 1;
			this.engine.fix(engineNumber);
		}
	}
}

this.fuel = {
	isOff: (fuelSelectorNumber) => {
		const condition = config.fuel.offCondition[fuelSelectorNumber];
		const value = this.$api.variables.get(condition.variable, condition.type);
		return value === condition.value;
	},
	getState: (fuelSelectorNumber) => {
		return this.fuel.isOff(fuelSelectorNumber) ? "Off" : "On";
	},
	off: (fuelSelectorNumber) => {
		const fuelOffAction = config.fuel.offAction[fuelSelectorNumber];
		this.$api.variables.set(fuelOffAction.variable, fuelOffAction.type, fuelOffAction.value);
	},
}

this.utils = {
	random: (min, max) => {
		return Math.floor(Math.random() * (max - min + 1) + min)
	},
};

this.settings.init();
this.core.init();
this.twitch.init();

console.log("FailBot loaded");
