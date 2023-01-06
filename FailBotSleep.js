let isSleeping = null;

run(() => {
    this.$api.command.script_message_send("failbot", "toggle_sleep", () => { });
});

state(() => {
    this.$api.command.script_message_send("failbot", "sleeping", (sleeping) => {
        isSleeping = sleeping;
    });

    if(isSleeping === null){
        return;
    }

    return isSleeping ? "mdi:sleep" : "mdi:checkbox-marked-circle-outline";
});

info(() => {
    if(isSleeping === null){
        return;
    }

    return isSleeping ? "Failures Disabled" : "Failures Enabled";
});

style(() => {
    if(isSleeping === null){
        return;
    }
    return isSleeping  ? null : "active";
});
