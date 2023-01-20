const config = {
	engine: {
		failedCondition: {
			1: { variable: "A:ENG FAILED:1", type: "Bool", value: 1 },
			2: { variable: "A:ENG FAILED:2", type: "Bool", value: 1 },
		},
		runningCondition: {
			1: { variable: "A:ENG COMBUSTION:1", type: "Bool", value: 1 },
			2: { variable: "A:ENG COMBUSTION:2", type: "Bool", value: 1 },
		},
		failAction: {
			1: { variable: "K:TOGGLE_ENGINE1_FAILURE", type: "Bool", value: 1, },
			2: { variable: "K:TOGGLE_ENGINE2_FAILURE", type: "Bool", value: 1, },
		},
		fixAction: {
			1: { variable: "K:TOGGLE_ENGINE1_FAILURE", type: "Bool", value: 1, },
			2: { variable: "K:TOGGLE_ENGINE2_FAILURE", type: "Bool", value: 1, },
		},
	},
	fuel: {
		offCondition: {
			1: { variable: "A:FUEL TANK SELECTOR:1", type: "Enum", value: 0 },
			2: { variable: "A:FUEL TANK SELECTOR:2", type: "Enum", value: 0 },
		},
		offAction: {
			1: { variable: "K:FUEL_SELECTOR_SET", type: "Enum", value: 0, },
			2: { variable: "K:FUEL_SELECTOR_2_SET", type: "Enum", value: 0, },
		},
	}
};

this.store = {
	script_enabled: true,
	intro_message: false,
	outro_message: false,
	sleeping: false,
};

const persisted = this.$api.datastore.import();
this.store = persisted ? persisted : this.store;

settings_define({
	sleeping: {
		type: "checkbox",
		label: "Sleeping -  fail and fix actions are inactive",
		value: this.store.sleeping,
		changed: (value) => {
			this.store.sleeping = value;
			this.$api.datastore.export(this.store);
		}
	},
	intro_message: {
		type: "checkbox",
		label: "Send message in chat when FailBot goes online",
		value: this.store.intro_message,
		changed: (value) => {
			this.store.intro_message = value;
			this.$api.datastore.export(this.store);
		}
	},
	outro_message: {
		type: "checkbox",
		label: "Send message in chat when FailBot goes offline",
		value: this.store.outro_message,
		changed: (value) => {
			this.store.outro_message = value;
			this.$api.datastore.export(this.store);
		}
	}
});

this.message = {
	online: () => {
		if (this.store.intro_message) {
			const sleeping = this.store.sleeping ? "sleeping" : "active";
			this.$api.twitch.send_message("/me FailBot is online and " + sleeping + "!");
		}
	},
	offline: () => {
		if (this.store.intro_message) {
			this.$api.twitch.send_message("/me FailBot is going offline!");
		}
	},
}

if (this.$api.twitch.is_connected()) {
	this.message.online();
}

twitch_connection((state) => { if (state) this.message.online(); });

script_message_rcv((caller_reference_name, message, reply_callback) => {
	if (message === "sleeping") {
		reply_callback(this.store.sleeping);
		return;
	}

	if (message === "toggle_sleep") {
		this.store.sleeping = !this.store.sleeping;
		this.$api.datastore.export(this.store);
		this.$api.twitch.send_message("/me FailBot is now " + (this.store.sleeping ? "sleeping" : "active") + "!");
		reply_callback(this.store.sleeping);
		return;
	}
});

exit(() => {
	this.message.offline();
	console.log("FailBot exited");
});

run(() => {
	this.store.script_enabled = !this.store.script_enabled;
	if (this.store.script_enabled) {
		if (this.store.intro_message) {
			this.$api.twitch.send_message("/me FailBot is now enabled and " + (this.store.sleeping ? "sleeping" : "active") + "!");
		}
	} else {
		if (this.store.outro_message) {
			this.$api.twitch.send_message("/me FailBot is now disabled!");
		}
	}

	this.$api.datastore.export(this.store);
	return true;
});

state(() => {
	if (this.$api.twitch.is_connected()) {
		return !this.store.script_enabled ? "mdi:comment-off-outline:Fail Bot" : "mdi:comment:Fail Bot"
	} else {
		return "mdi:wifi-strength-off:Fail Bot";
	}
});

info(() => {
	if (this.$api.twitch.is_connected()) {
		return !this.store.script_enabled ? "FailBot Disabled" : "FailBot Enabled";
	} else {
		return "FailBot Unavailable";
	}
});

style(() => {
	if (this.$api.twitch.is_connected()) {
		return this.store.script_enabled ? "active" : "error";
	} else {
		return "error";
	}
});

twitch_message((message) => {
	if (this.store.script_enabled && message.parameters) {
		if (message.tags ? message.tags["display-name"] : false) {
			let reply_prefix = "@reply-parent-msg-id=" + message.tags["id"];
			let msg_params = message.parameters.split(" ");

			switch (msg_params[0].toLowerCase()) {
				case '!commands':
				case "!failbot": {
					this.commands.failBot(reply_prefix);
					break;
				}

				case "!checkengine": {
					this.commands.checkEngine(reply_prefix);
					break;
				}

				case "!failengine": {
					if (this.store.sleeping) {
						this.commands.sleeping(reply_prefix);
						break;
					}

					this.commands.failEngine(reply_prefix);
					break;
				}

				case "!fixengine": {
					if (this.store.sleeping) {
						this.commands.sleeping(reply_prefix);
						break;
					}

					this.commands.fixEngine(reply_prefix);
					break;
				}

				case "!checkfuel": {
					this.commands.checkFuel(reply_prefix);
					break;
				}

				case "!fueloff": {
					if (this.store.sleeping) {
						this.commands.sleeping(reply_prefix);
						break;
					}

					this.commands.fuelOff(reply_prefix);
					break;
				}
			}
		}
	}
});

this.commands = {
	failBot: (reply_prefix) => {
		const msg = [
			"!checkEngine",
			"!failEngine",
			"!fixEngine",
			"!checkFuel",
			"!fuelOff",
		];

		this.$api.twitch.send_message("FailBot: " + msg.join(" "), reply_prefix);
	},
	sleeping: (reply_prefix) => {
		this.$api.twitch.send_message("FailBot: Sleeping... Zzz...", reply_prefix);
	},
	checkEngine: (reply_prefix) => {
		const engine1 = "Engine 1 is " + this.engine.getState(1) + ". ";
		const engine2 = "Engine 2 is " + this.engine.getState(2) + ". ";
		this.$api.twitch.send_message("FailBot: " + engine1 + engine2, reply_prefix);
	},
	failEngine: (reply_prefix) => {
		if (this.engine.isAnyFailed()) {
			this.$api.twitch.send_message("FailBot: Umm... One engine has already failed", reply_prefix);
			return;
		}

		if (!this.engine.isAllRunning()) {
			this.$api.twitch.send_message("FailBot: Umm... We really need one at least one engine running", reply_prefix);
			return;
		}

		const engineNumber = this.utils.random(1, 2);
		this.engine.fail(engineNumber);
		this.$api.twitch.send_message("FailBot: Aye Captain! Failed Engine " + engineNumber, reply_prefix);
	},
	fixEngine: (reply_prefix) => {
		if (!this.engine.isAnyFailed()) {
			this.$api.twitch.send_message("FailBot: Umm... All engines are fine", reply_prefix);
			return;
		}

		this.engine.fix(1);
		this.engine.fix(2);
		this.$api.twitch.send_message("FailBot: Consider it done!", reply_prefix);
	},
	checkFuel: (reply_prefix) => {
		const fuelSelector1 = "Fuel Selector 1 is " + this.fuel.getState(1) + ". ";
		const fuelSelector2 = "Fuel Selector 2 is " + this.fuel.getState(2) + ". ";
		this.$api.twitch.send_message("FailBot: " + fuelSelector1 + fuelSelector2, reply_prefix);
	},
	fuelOff: (reply_prefix) => {
		if (!this.engine.isAllRunning()) {
			this.$api.twitch.send_message("FailBot: Umm... We really need one at least one engine running", reply_prefix);
			return;
		}

		const fuelSelectorNumber = this.utils.random(1, 2);
		this.fuel.off(fuelSelectorNumber);
		this.$api.twitch.send_message("FailBot: Aye Captain! Fuel off for Engine " + fuelSelectorNumber, reply_prefix);
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
	isAllRunning: () => {
		if (!this.engine.isRunning(1)) {
			return false;
		}

		if (!this.engine.isRunning(2)) {
			return false;
		}

		return true;
	},
	isAnyFailed: () => {
		if (this.engine.isFailed(1)) {
			return true;
		}

		if (this.engine.isFailed(2)) {
			return true;
		}

		return false;
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

console.log("FailBot loaded");
