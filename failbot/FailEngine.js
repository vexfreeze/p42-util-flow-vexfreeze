const engineNumber = 1; // minimum 1, maximum 4

const config = {
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
			2: { variable: "K:TOGGLE_ENGINE2_FAILURE", type: "Enum", value: 1, },
			3: { variable: "K:TOGGLE_ENGINE3_FAILURE", type: "Enum", value: 1, },
			4: { variable: "K:TOGGLE_ENGINE4_FAILURE", type: "Enum", value: 1, },
		},
		fixAction: {
			1: { variable: "K:TOGGLE_ENGINE1_FAILURE", type: "Bool", value: 1, },
			2: { variable: "K:TOGGLE_ENGINE2_FAILURE", type: "Bool", value: 1, },
			3: { variable: "K:TOGGLE_ENGINE3_FAILURE", type: "Bool", value: 1, },
			4: { variable: "K:TOGGLE_ENGINE4_FAILURE", type: "Bool", value: 1, },
		},
		count: { variable: "A:NUMBER OF ENGINES", type: "Number" }, // minimum 0, maximum 4
	},
};

run(() => {
	if(!this.engine.isAvailable(engineNumber)){
		return;
	}

	if (!this.engine.isFailed(engineNumber)) {
		this.engine.fail(engineNumber);
	} else {
		this.engine.fix(engineNumber);
	}
});

state(() => {
	if(!this.engine.isAvailable(engineNumber)){
		return "mdi:engine-outline:ENG " + engineNumber + "<br/>U/A";
	}

	const isFailed = this.engine.isFailed(engineNumber);
	const engineState = this.engine.getState(engineNumber);
	return (isFailed ? "mdi:engine-off:" : "mdi:engine:") + "ENG " + engineNumber + "<br/>" + engineState;
})

info(() => {
	return 'ENG ' + engineNumber + '<br/>Fail/Fix';
})

style(() => {
	if(!this.engine.isAvailable(engineNumber)){
		return null;
	}

	if (this.engine.isRunning(engineNumber)) {
		return "active";
	}

	if (this.engine.isFailed(engineNumber)) {
		return "error";
	}

	return null;
});

this.engine = {
	isAvailable: (engineNumber) => {
		const condition = config.engine.count;
		const enginesCount = this.$api.variables.get(condition.variable, condition.type);
		return engineNumber <= enginesCount;
	},
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
