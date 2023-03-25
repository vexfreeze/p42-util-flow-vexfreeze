this.store = {
    script_enabled: true,
    intro_message: true,
    outro_message: true,
}

const persisted = this.$api.datastore.import();
this.store = persisted ? persisted : this.store;

this.msg_online = () => (this.store.intro_message ? this.$api.twitch.send_message('/me TestBot says hi!') : null);
this.msg_offline = () => (this.store.outro_message ? this.$api.twitch.send_message('/me TestBot is going offline!') : null);

if (this.$api.twitch.is_connected()) this.msg_online();

settings_define({
    intro_message: {
        type: 'checkbox',
        label: 'Send message in chat when TestBot goes online',
        value: this.store.intro_message,
        changed: (value) => {
            this.store.intro_message = value;
            this.$api.datastore.export(this.store);
        }
    },
    outro_message: {
        type: 'checkbox',
        label: 'Send message in chat when TestBot goes offline',
        value: this.store.outro_message,
        changed: (value) => {
            this.store.outro_message = value;
            this.$api.datastore.export(this.store);
        }
    }
})

twitch_connection((state) => {
    if (state) this.msg_online();
})

exit(() => {
    this.msg_offline();
    console.log("TestBot exited");
})

run(() => {
    this.store.script_enabled = !this.store.script_enabled;
    if (this.store.script_enabled) {
        if (this.store.intro_message) {
            this.$api.twitch.send_message('TestBot is now enabled.');
        }
    } else {
        if (this.store.outro_message) {
            this.$api.twitch.send_message('TestBot is now disabled!');
        }
    }
    this.$api.datastore.export(this.store);
    return true;
})

twitch_message((message) => {
    console.log(message);
    
    if (this.store.script_enabled && message.parameters) {
        if (message.tags ? message.tags['display-name'] : false) {

            let reply_prefix = '@reply-parent-msg-id=' + message.tags['id'];
            let msg_params = message.parameters.split(' ');

            switch (msg_params[0]) {

                case '!test': {
                    this.$api.twitch.send_message('TestBot: Hi!', reply_prefix);
                    break;
                }
            }
        }
    }
});

state(() => {
    if (this.$api.twitch.is_connected()) {
        return !this.store.script_enabled ? 'mdi:comment-off-outline:TestBot' : 'mdi:comment:TestBot'
    } else {
        return 'mdi:wifi-strength-off:TestBot';
    }
})

info(() => {
    if (this.$api.twitch.is_connected()) {
        return !this.store.script_enabled ? 'TestBot Disabled' : 'TestBot Enabled';
    } else {
        return 'TestBot Unavailable';
    }
})

style(() => {
    if (this.$api.twitch.is_connected()) {
        return this.store.script_enabled ? 'active' : 'error';
    } else {
        return 'error';
    }
})

console.log("TestBot loaded");