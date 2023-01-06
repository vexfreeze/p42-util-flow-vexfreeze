const engineNumber = 1;

const config = {
	engine: {
		failedCondition: {
			1: { variable: "A:FUEL TANK SELECTOR:1", type: "Enum", value: 0 },
			2: { variable: "A:FUEL TANK SELECTOR:2", type: "Enum", value: 0 },
		},
		runningCondition: {
			1: { variable: "A:ENG COMBUSTION:1", type: "Bool", value: 1 },
			2: { variable: "A:ENG COMBUSTION:2", type: "Bool", value: 1 },
		},
		failAction: {
			1: { variable: "K:FUEL_SELECTOR_SET", type: "Enum", value: 0, },
			2: { variable: "K:FUEL_SELECTOR_2_SET", type: "Enum", value: 0, },
		},
		fixAction: {
			1: { variable: "K:FUEL_SELECTOR_SET", type: "Enum", value: 2, },
			2: { variable: "K:FUEL_SELECTOR_2_SET", type: "Enum", value: 3, },
		},
	},
};

run(() => {
	if(!this.engine.isFailed(engineNumber)){
		this.engine.fail(engineNumber);
	} else {
		this.engine.fix(engineNumber);
	}
});

state(() => {
	const isFailed = this.engine.isFailed(engineNumber);
	const engineState = this.engine.getState(engineNumber);
	return (isFailed ? "mdi:engine-off:" : "mdi:engine:") + "ENG " + engineNumber + " " + engineState;
})

info(() => {
	const engineState = this.engine.getState(engineNumber);
	return "Engine " + engineNumber + " " + engineState;
})

style(() => {	
	if(this.engine.isRunning(engineNumber)) {
		return "active";
	}

	if(this.engine.isFailed(engineNumber)) {
		return "error";
	}
	
	return null;
});

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
	getState: (engineNumber) => {
		if(this.engine.isRunning(engineNumber)) {
			return "Running";
		}
	
		if(this.engine.isFailed(engineNumber)) {
			return "Failed";
		}
	
		return "Off";
	},
	fail: (engineNumber) => {
		if(this.engine.isFailed(engineNumber)) {
			return;
		}
	
		const failAction = config.engine.failAction[engineNumber];
		this.$api.variables.set( failAction.variable, failAction.type, failAction.value);
	},
	fix: (engineNumber) => {
		if(!this.engine.isFailed(engineNumber)) {
			return;
		}
	
		const fixAction = config.engine.fixAction[engineNumber];
		this.$api.variables.set( fixAction.variable, fixAction.type, fixAction.value);
	},
}