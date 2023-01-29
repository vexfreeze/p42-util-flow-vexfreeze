const eng_number = 1; // minimum 1, maximum 4

const eng_type = this.$api.variables.get("A:ENGINE TYPE", "Enum");
const eng_count = this.$api.variables.get("A:NUMBER OF ENGINES", "Number");

run(() => {
	if (eng_number > eng_count) {
		return;
	}

	let eng_all_running = true;
	for (let i = 0; i < eng_count; i++) {
		const eng_state = this.$api.variables.get("A:ENG COMBUSTION:" + (i + 1), "Bool");
		if (!eng_state) {
			eng_all_running = false;
		}
	}

	if (eng_all_running) {
		this.$api.variables.set("K:ENGINE_AUTO_SHUTDOWN", "Number", 1);
	} else {
		this.$api.variables.set("K:ENGINE_AUTO_START", "Number", 1);
	}
});

state(() => {
	if (eng_number > eng_count) {
		return 'mdi:engine-outline:ENG ' + eng_number + '<br/>U/A';
	}

	const eng_state = this.$api.variables.get("A:ENG COMBUSTION:" + eng_number, "Bool");
	const eng_power = this.eng_power();

	if (eng_state) {
		return 'mdi:engine-off:ENG ' + eng_number + '<br/>' + eng_power;
	} else {
		return 'mdi:engine:ENG ' + eng_number + '<br/>' + eng_power;
	}
});

style(() => {
	if (eng_number > eng_count) {
		return null;
	}

	const eng_state = this.$api.variables.get("A:ENG COMBUSTION:" + eng_number, "Bool");
	return eng_state ? 'active' : null;
})

info(() => {
	if (eng_number > eng_count) {
		return 'No Action';
	}

	return 'All Engines<br/>On/Off';
});

this.eng_power = () => {
	let eng_power;

	if (eng_number > eng_count) {
		eng_power = 'U/A';
	} else {
		switch (eng_type) {
			case 2: // None
			case 3: // Helo
			default: {
				eng_power = 'UKWN';
				break;
			}
			case 0: { // Piston
				eng_power = this.$api.variables.get("A:PROP RPM:" + eng_number, "RPM");
				eng_power = (Math.round(eng_power * 10) / 10).toFixed(0) + '<br/>RPM';
				break;
			}
			case 5: // Turboprop
			case 1: { // Jet
				eng_power = this.$api.variables.get("A:TURB ENG CORRECTED N1:" + eng_number, "Percent");
				eng_power = (Math.round(eng_power * 10) / 10).toFixed(1) + '%';
				break;
			}
		}
	}

	return eng_power;
}