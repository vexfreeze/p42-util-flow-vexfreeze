this.store = {
	script_enabled: true,
	intro_message: false,
	outro_message: false,
}

const persisted = this.$api.datastore.import();
this.store = persisted ? persisted : this.store;

this.msg_online = () => (this.store.intro_message ? this.$api.twitch.send_message('/me ATCBot is online and ' + (this.store.script_enabled ? 'active' : 'disabled') + '!') : null);
this.msg_offline = () => (this.store.outro_message ? this.$api.twitch.send_message('/me ATCBot is going offline!') : null);

if(this.$api.twitch.is_connected()) this.msg_online();

settings_define({
	intro_message: {
		type: 'checkbox',
		label: 'Send message in chat when ATCBot goes online',
		value: this.store.intro_message,
		changed: (value) => {
			this.store.intro_message = value;
			this.$api.datastore.export(this.store);
		}
	},
	outro_message: {
		type: 'checkbox',
		label: 'Send message in chat when ATCBot goes offline',
		value: this.store.outro_message,
		changed: (value) => {
			this.store.outro_message = value;
			this.$api.datastore.export(this.store);
		}
	}
})

twitch_connection((state) => {
	if(state) this.msg_online();
})

exit(() => {
	this.msg_offline();
	console.log("ATCBot exited");
})

run(() => {
	this.store.script_enabled = !this.store.script_enabled;
	if(this.store.script_enabled) {
		if(this.store.intro_message) {
			this.$api.twitch.send_message('/me ATCBot is now enabled.');
		}
	} else {
		if(this.store.outro_message) {
			this.$api.twitch.send_message('/me ATCBot is now disabled!');
		}
	}
	this.$api.datastore.export(this.store);
	return true;
})

twitch_message((message) => {
	if(this.store.script_enabled && message.parameters) {
		if(message.tags ? message.tags['display-name'] : false) {

			let reply_prefix = '@reply-parent-msg-id=' + message.tags['id'];
			let msg_params = message.parameters.split(' ');

			switch(msg_params[0]){

				case '!commands':
				case '!atcbot': {
					const msg = [
						'!flight',
						'!server',
						'!heading',
						'!speed',
						'!altitude',
						'!aircraft',
						'!nearest',
                        '!wind',
						'!wx',
						'!runways'
					];
					this.$api.twitch.send_message('ATCBot: ' + msg.join(' '), reply_prefix);
					break;
				}

				case '!flight':
				case '!info':
				case '!nfo':
				{
					const msg = [];
					const server_state = this.$api.community.get_server();
					const servers = this.$api.community.get_servers();
					const server_name = servers.find(x => x.ID == server_state).name;
					const on_ground = this.$api.variables.get("SIM ON GROUND", "bool")

					this.utils.get_nearest((airports) => {

						if(on_ground) {
							msg.push('On the ground');
						} else {
							const spd = Math.round(this.$api.variables.get("GROUND VELOCITY", "knots")) + 'kts';
							const hdg = Math.round(this.$api.variables.get("A:PLANE HEADING DEGREES TRUE", "Degrees")) + '°';
							const alt = Math.round(this.$api.variables.get("A:PLANE ALTITUDE", "Feet")) + 'ft';
							msg.push('Flying ' + alt + ' at ' + spd + ' hdg ' + hdg);
						}

						if(airports.length) {
							msg.push("near " + airports[0].icao);
						} else {
							const lon = this.$api.variables.get("PLANE LONGITUDE", "Degrees");
							const lat = this.$api.variables.get("PLANE LATITUDE", "Degrees");
							msg.push("at " + (Math.round(lat * 10000) / 10000) + ', ' + (Math.round(lon * 10000) / 10000));
						}

						msg.push("in the \"" + this.$api.variables.get("A:Title", "String") + "\"");

						msg.push("and we're on " + server_name + " server");

						this.$api.twitch.send_message(msg.join(' '), reply_prefix);
					});

					break;
				}

				case '!heading':
				case '!hdg':
				{
					this.$api.twitch.send_message('We\'re flying ' + Math.round(this.$api.variables.get("A:PLANE HEADING DEGREES TRUE", "Degrees")) + '°', reply_prefix);
					break;
				}

				case '!speed':
				case '!spd':
				{
					this.$api.twitch.send_message('Ground speed is ' + Math.round(this.$api.variables.get("GROUND VELOCITY", "knots")) + ' Knots', reply_prefix);
					break;
				}

				case '!altitude':
				case '!alt':
				{
					const msg = [
						'Altitude is ' + Math.round(this.$api.variables.get("A:PLANE ALTITUDE", "Feet")) + 'ft ASL'
					];

					const on_ground = this.$api.variables.get("SIM ON GROUND", "bool")
					if(on_ground) {
						msg.push('(currently on the ground)');
					}

					this.$api.twitch.send_message(msg.join(' '), reply_prefix);
					break;
				}

				case '!aircraft':
				case '!plane':
				{
					this.$api.twitch.send_message('Aircraft is ' + this.$api.variables.get("A:Title", "String"), reply_prefix);
					break;
				}

				case '!nearest':
				case '!near':
				case '!nrst':
				case '!airport':
				case '!icao':
				{
					this.utils.get_nearest((airports) => {
						if(airports.length) {
							this.$api.twitch.send_message('Nearest airport is ' + airports[0].icao, reply_prefix);
						} else {
							this.$api.twitch.send_message('No airports nearby. Coords are ' + (Math.round(lat * 10000) / 10000) + ', ' + (Math.round(lon * 10000) / 10000), reply_prefix);
						}
					});
					break;
				}

				case '!wind':
				case '!winds':
				{
					const wind_spd = Math.round(this.$api.variables.get("AMBIENT WIND VELOCITY", "Knots"));
					const wind_dir = Math.round(this.$api.variables.get("AMBIENT WIND DIRECTION", "Degrees"));

					this.$api.twitch.send_message('Current winds are ' + wind_dir + "@" + wind_spd + "kts", reply_prefix);
					break;
				}

				case '!wx':
				case '!weather':
				case '!metar':
				{
					if(msg_params.length > 1) {
						this.$api.weather.find_metar_by_icao(msg_params[1], (metar) => {
							if(metar) {
								this.$api.twitch.send_message(metar.metarString, reply_prefix);
							} else {
								this.$api.twitch.send_message('No METAR available for ' + msg_params[1], reply_prefix);
							}
						});
					} else {
						const lon = this.$api.variables.get("PLANE LONGITUDE", "Degrees");
						const lat = this.$api.variables.get("PLANE LATITUDE", "Degrees");
						this.$api.weather.find_metar_from_coords(lat, lon, (metar) => {
							if(metar) {
								this.$api.twitch.send_message('Nearest METAR: ' + metar.metarString, reply_prefix);
							} else {
								this.$api.twitch.send_message('No METAR available.', reply_prefix);
							}
						});
					}
					break;
				}

				case '!server': {
					const server_state = this.$api.community.get_server();
					const servers = this.$api.community.get_servers();
					const server_name = servers.find(x => x.ID == server_state).name;
					this.$api.twitch.send_message('We are on ' +server_name, reply_prefix);
					break;
				}

				case '!rwy':
				case '!rwys':
				case '!runway':
				case '!runways':
				{
					const compute_airport = (airport) => {
						this.$api.weather.find_metar_by_icao(airport.icao, (metar) => {
							if(metar) {
								let runways = [];

								airport.runways.forEach((runway, index) => {

									const rph = runway.direction;
									const rsh = runway.direction - 180;

									runways.push([ runway.primaryName, this.utils.get_wind_components(rph, metar.windDir, metar.windSpeed) ]);
									runways.push([ runway.secondaryName, this.utils.get_wind_components(rsh, metar.windDir, metar.windSpeed) ]);
								});

								runways = runways.filter(x => x[1][1] >= 0);
								runways.sort((a, b) => { return Math.abs(a[1][0]) - Math.abs(b[1][0]) });

								const parsed_list = runways.map(x => {
									const l = [
										((x[1][1] > 0) ? '▼' : '▲') + '' + Math.abs(Math.round(x[1][1])),
										((x[1][0] > 0) ? '▶' : '◀') + '' + Math.abs(Math.round(x[1][0])),
									];
									return '(' + x[0] + ': ' + l.join(' ') + ')';
								});
								this.$api.twitch.send_message('Winds per runway at ' + airport.icao + ' are ' + parsed_list.join('  —  '), reply_prefix);
							} else {
								const parsed_list = airport.runways.map(x => {
									return x.primaryName + '-' + x.secondaryName;
								});
								this.$api.twitch.send_message('No weather info available at ' + airport.icao + '. Runways are ' + parsed_list.join(', '), reply_prefix);
							}
						});
					}

					if(msg_params.length > 1) {

						this.$api.airports.find_airport_by_icao('atc_bot', msg_params[1],
						(airports) => { // Added
							if(airports.length) {
								compute_airport(airports[0]);
							} else {
								this.$api.twitch.send_message('No airport with this ICAO.', reply_prefix);
							}
						});
						break;

					} else {

						const lon = this.$api.variables.get("PLANE LONGITUDE", "Degrees");
						const lat = this.$api.variables.get("PLANE LATITUDE", "Degrees");
						this.$api.airports.find_airports_by_coords('atc_bot', lon, lat, 100000, 1,
						(airports) => { // Added
							if(airports.length) {
								compute_airport(airports[0]);
							} else {
								this.$api.twitch.send_message('No airports nearby. Coords are ' + lat + ', ' + lon, reply_prefix);
							}
						}, (airports) => { // Removed
						}, (airports) => { // Failed
						}, true)
						break;

					}

				}
			}
		}
	}
});

state(() => {
	if(this.$api.twitch.is_connected()) {
		return !this.store.script_enabled ? 'mdi:comment-off-outline:ATC Bot' : 'mdi:comment:ATC Bot'
	} else {
		return 'mdi:wifi-strength-off:ATC Bot';
	}
})

info(() => {
	if(this.$api.twitch.is_connected()) {
		return !this.store.script_enabled ? 'ATCBot Disabled' : 'ATCBot Enabled';
	} else {
		return 'ATCBot Unavailable';
	}
})

style(() => {
	if(this.$api.twitch.is_connected()) {
		return this.store.script_enabled  ? 'active' : 'error';
	} else {
		return 'error';
	}
})

this.utils = {
	get_nearest: (callback) => {
		const lon = this.$api.variables.get("PLANE LONGITUDE", "Degrees");
		const lat = this.$api.variables.get("PLANE LATITUDE", "Degrees");
		this.$api.airports.find_airports_by_coords('atc_bot', lon, lat, 100000, 1,
		(airports) => { // Added
			callback(airports);
		}, (airports) => { // Removed
		}, (airports) => { // Failed
		}, true)
	},
	get_wind_components: (runway_angle, wind_angle, wind_speed) => {
		return [
			wind_speed * Math.sin((runway_angle - wind_angle) * (Math.PI/180)),
			wind_speed * Math.cos((runway_angle - wind_angle) * (Math.PI/180)),
		]
	}
}

console.log("ATCBot loaded");