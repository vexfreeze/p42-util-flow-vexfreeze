const fetch_interval = 60 * 1000;
const route_prefix = 'Route: ';

let last_fetch = null;

const app = this;

app.store = {
    simbrief_id: null,
    update_message: true,
    intro_message: false,
    outro_message: false,
    script_enabled: false,
    route: "Not loaded from simbrief yet",
}

const persisted = app.$api.datastore.import();
app.store = persisted ? persisted : app.store;

app.msg_online = () => (app.store.intro_message ? app.$api.twitch.send_message('/me RouteBot is online and ' + (app.store.script_enabled ? 'active' : 'disabled') + '!') : null);
app.msg_offline = () => (app.store.outro_message ? app.$api.twitch.send_message('/me RouteBot is going offline!') : null);

app.init = () => {
    if (app.$api.twitch.is_connected()) {
        app.msg_online();
    }

    app.fetchSimBrief();
}

settings_define({
    simbrief_id: {
        type: 'text',
        label: 'SimBrief id or username',
        value: app.store.simbrief_id,
        changed: (value) => {
            app.store.simbrief_id = value;
            app.$api.datastore.export(app.store);
        }
    },
    update_message: {
        type: 'checkbox',
        label: 'Send route update in chat',
        value: app.store.update_message,
        changed: (value) => {
            app.store.update_message = value;
            app.$api.datastore.export(app.store);
        }
    },
    intro_message: {
        type: 'checkbox',
        label: 'Send message in chat when RouteBot goes online',
        value: app.store.intro_message,
        changed: (value) => {
            app.store.intro_message = value;
            app.$api.datastore.export(app.store);
        }
    },
    outro_message: {
        type: 'checkbox',
        label: 'Send message in chat when RouteBot goes offline',
        value: app.store.outro_message,
        changed: (value) => {
            app.store.outro_message = value;
            app.$api.datastore.export(app.store);
        }
    }
})

script_message_rcv((caller_reference_name, message, reply_callback) => {
    if (message === "refresh" && app.store.script_enabled) {
        console.log("Refresh");
        app.fetchSimBrief();
    }
});

run(() => {
    app.store.script_enabled = !app.store.script_enabled;
    if (app.store.script_enabled) {
        if (app.store.intro_message) {
            app.$api.twitch.send_message('/me RouteBot is now enabled.');
            app.fetchSimBrief();
        }
    } else {
        if (app.store.outro_message) {
            app.$api.twitch.send_message('/me RouteBot is now disabled!');
        }
    }

    app.$api.datastore.export(app.store);
    return true;
});

state(() => {
    return 'mdi:routes';
})

info(() => {
    if (this.$api.twitch.is_connected()) {
        return !this.store.script_enabled ? 'RouteBot Disabled' : 'RouteBot Enabled';
    } else {
        return 'RouteBot Unavailable';
    }
})

style(() => {
    if (this.$api.twitch.is_connected()) {
        return this.store.script_enabled ? 'active' : 'error';
    } else {
        return 'error';
    }
})

twitch_message((message) => {
    if (app.store.script_enabled && message.parameters) {
        if (message.tags ? message.tags["display-name"] : false) {
            let reply_prefix = "@reply-parent-msg-id=" + message.tags["id"];
            let msg_params = message.parameters.split(" ");

            switch (msg_params[0].toLowerCase()) {
                case '!route': {
                    const now = new Date();

                    if (now - last_fetch > fetch_interval) {
                        app.fetchSimBrief(true, reply_prefix);
                    } else {
                        app.$api.twitch.send_message(app.store.route, reply_prefix);
                    }

                    break;
                }
            }
        }
    }
});

// // Navigraph confirmed that webapi endpoint is intended for polling
// // Disabled until there is a viable solution
// loop_1hz(() => {
//     if (!app.store.script_enabled) {
//         return;
//     }

//     const now = new Date();
//     if (now - last_fetch > fetch_interval) {
//         app.fetchSimBrief();
//     }
// });

exit(() => {
    app.msg_offline();
    console.log("RouteBot exited");
});

app.fetchSimBrief = (forceMessage, reply_prefix) => {
    const id = app.store.simbrief_id;

    if (!id) {
        console.log("No SimBrief id/username set.");
        return;
    }

    const id_type = isNaN(id) ? "username" : "userid";
    const url = 'https://www.simbrief.com/api/xml.fetcher.php?' + id_type + '=' + id + '&json=1';

    last_fetch = new Date();
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (isEmpty(data) || isEmpty(data.general)) {
                console.log("Failed to get data from SimBrief - check username/id");
            } else {
                app.handleRoute(data, forceMessage, reply_prefix);
            }

        })
        .catch((e) => console.log("Error: " + e));
}

app.handleRoute = (data, forceMessage, reply_prefix) => {
    route = route_prefix
        + data.origin.icao_code + '/' + data.origin.plan_rwy + ' '
        + data.general.route + ' '
        + data.destination.icao_code + '/' + data.destination.plan_rwy;

    if (route != app.store.route) {
        console.log(route);
        app.store.route = route;
        app.$api.datastore.export(app.store);

        if (app.store.script_enabled && app.store.update_message) {
            app.$api.twitch.send_message("New " + route, reply_prefix);
        }
    } else {
        console.log("No route change");

        if (app.store.script_enabled && forceMessage) {
            app.$api.twitch.send_message(route, reply_prefix);
        }
    }
}

function isEmptyObject(object) {
    return Object.keys(object).length === 0;
}

function isEmpty(str) {
    return (str === null || str === '' || str === undefined || isEmptyObject(str));
}

app.init();