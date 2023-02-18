const fetch_interval_seconds = 60;
const route_message = 'Route: ';
let route_data = "Not loaded from simbrief yet";

let last_fetch = null;

const app = this;

app.store = {
    script_enabled: true,
    intro_message: false,
    outro_message: false,
    simbrief_id: null,
}

const persisted = app.$api.datastore.import();
app.store = persisted ? persisted : app.store;

app.msg_online = () => (app.store.intro_message ? app.$api.twitch.send_message('/me RouteBot is online and ' + (app.store.script_enabled ? 'active' : 'disabled') + '!') : null);
app.msg_offline = () => (app.store.outro_message ? app.$api.twitch.send_message('/me RouteBot is going offline!') : null);

if (app.$api.twitch.is_connected()) app.msg_online();

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

twitch_message((message) => {
    if (app.store.script_enabled && message.parameters) {
        if (message.tags ? message.tags["display-name"] : false) {
            let reply_prefix = "@reply-parent-msg-id=" + message.tags["id"];
            let msg_params = message.parameters.split(" ");

            switch (msg_params[0].toLowerCase()) {
                case '!route': {
                    app.$api.twitch.send_message(route_data, reply_prefix);
                    break;
                }
            }
        }
    }
});

loop_1hz(() => {
    if (!app.store.script_enabled) {
        return;
    }

    const now = new Date();
    if (now - last_fetch > fetch_interval_seconds * 1000) {
        app.fetchSimBrief();
    }
});

app.fetchSimBrief = () => {
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
                app.setRoute(data);
                console.log(route_data);
            }

        })
        .catch((e) => console.log("Error: " + e));
}

app.setRoute = (data) => {
    route_data = route_message
        + data.origin.icao_code + '/' + data.origin.plan_rwy + ' '
        + data.general.route + ' '
        + data.destination.icao_code + '/' + data.destination.plan_rwy;

    app.$api.twitch.send_message(route_data);
}

function isEmptyObject(object) {
    return Object.keys(object).length === 0;
}

function isEmpty(str) {
    return (str === null || str === '' || str === undefined || isEmptyObject(str));
}
