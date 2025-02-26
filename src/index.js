const { getSaladInfo } = require('./logReader');
const { updateDiscordRPC } = require('./discordRPC');

function startApp() {
    console.log("Salad Helper is starting...");

    setInterval(() => {
        const saladInfo = getSaladInfo();
        console.log("Current Salad Info:", saladInfo);

        if (saladInfo) {
            updateDiscordRPC(saladInfo);
        }
    }, 5000); // Update every 5 seconds
}

startApp();
