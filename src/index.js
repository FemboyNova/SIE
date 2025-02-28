const { getSaladInfo } = require('./logReader');
const { updateDiscordRPC } = require('./discordRPC');
const Systray = require('systray').default;
const path = require('path');
const fs = require('fs');
const { exec } = require("child_process");

// ✅ Hide console window on Windows
if (process.platform === "win32") {
    exec("powershell -windowstyle hidden -command \"\"");
}

// ✅ Load the tray icon
const iconPath = path.join(__dirname, "icon.ico");

if (!fs.existsSync(iconPath)) {
    console.error("Error: icon.ico not found. Ensure it is in the same folder as index.js.");
    process.exit(1);
}

const iconData = fs.readFileSync(iconPath).toString('base64');

// ✅ Create system tray menu
const systray = new Systray({
    menu: {
        icon: iconData, // Load icon
        title: "Salad Helper",
        tooltip: "Salad Helper is running",
        items: [
            { title: "Show Status", tooltip: "Show current earnings", checked: false, enabled: true },
            { title: "Exit", tooltip: "Close Salad Helper", checked: false, enabled: true }
        ]
    },
    debug: false,
    copyDir: true
});

// ✅ Handle tray menu actions
systray.onClick(async (action) => {
    if (action.item.title === "Show Status") {
        const saladInfo = await getSaladInfo();
        const message = `Balance: $${saladInfo.walletCurrent} | Status: ${saladInfo.runningState === "true" ? "Chopping" : "Paused"} | GPU: ${saladInfo.gpuName}`;
        console.log(message);
    } else if (action.item.title === "Exit") {
        systray.kill();
        process.exit();
    }
});

// ✅ Start updating Discord RPC
async function startApp() {
    console.log("Salad Helper is running in the background...");

    setInterval(async () => {
        const saladInfo = await getSaladInfo();
        if (saladInfo) {
            updateDiscordRPC(saladInfo);
        }
    }, 5000);
}

startApp();
