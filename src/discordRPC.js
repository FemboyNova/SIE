const RPC = require('discord-rpc');

const clientId = '1239059803096219678';
const rpc = new RPC.Client({ transport: 'ipc' });

async function setActivity(saladInfo) {
    if (!rpc || !saladInfo) return;

    const choppingState = saladInfo.runningState === "true" ? "Chopping" : "Paused";
    
    rpc.setActivity({
        details: `${choppingState}`,
        state: `Balance: ${saladInfo.walletCurrent}`,
        startTimestamp: new Date(),
        largeImageKey: 'salad_logo',
        instance: false,
    });
}

rpc.on('ready', () => {
    console.log("Discord RPC is ready!");
});

rpc.login({ clientId }).catch(console.error);

function updateDiscordRPC(saladInfo) {
    setActivity(saladInfo);
}

module.exports = { updateDiscordRPC };
