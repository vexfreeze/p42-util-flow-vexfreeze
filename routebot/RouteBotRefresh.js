run(() => {
    this.$api.command.script_message_send("routebot", "refresh", () => { });
});

state(() => {
    return "mdi:routes-clock";
});

info(() => {
    return "Refresh<br/>Route";
});
