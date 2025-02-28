const RPC = require('discord-rpc');

const clientId = '1214462475123167262'; 
const rpc = new RPC.Client({ transport: 'ipc' });

async function setActivity(saladInfo) {
    if (!rpc || !saladInfo) return;

    const choppingState = saladInfo.runningState === "true" ? "Chopping" : "Paused";
    const smallImageKey = saladInfo.runningState === "true" ? "chop" : "Paused";
    const balanceStatus = `Balance: $${saladInfo.walletCurrent} Status: ${choppingState}`;
    const next24Earnings = saladInfo.walletPredicted > 0 ? `Next 24 earnings: $${saladInfo.walletPredicted}` : "";
    
    rpc.setActivity({
        details: balanceStatus,
        state: `${next24Earnings} Using ${saladInfo.gpuName}`.trim(),
        startTimestamp: new Date(),
        largeImageKey: 'saladlogo', 
        smallImageKey: smallImageKey, 
        instance: false,
        buttons: [
            { label: "Join Discord", url: "https://discord.gg/salad" },
            { label: "Download Salad", url: "https://salad.com/download" }
        ]
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
