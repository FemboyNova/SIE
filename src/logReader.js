const fs = require('fs');
const path = require('path');
const si = require('systeminformation'); 

const LOG_DIR = "C:\\ProgramData\\Salad\\logs";

function getLatestLogFile() {
    const files = fs.readdirSync(LOG_DIR)
        .filter(file => file.startsWith('log-') && file.endsWith('.txt'))
        .sort((a, b) => b.localeCompare(a)); 

    return files.length > 0 ? path.join(LOG_DIR, files[0]) : null;
}

function parseLogFile(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return null;
    
    const logData = fs.readFileSync(filePath, 'utf8');
    const logLines = logData.trim().split('\n').reverse();
    
    let runningState = null;
    let walletCurrent = null;
    let walletPredicted = null;

    for (const line of logLines) {
        if (runningState === null) {
            const runningMatch = line.match(/Running State: (true|false)/);
            if (runningMatch) runningState = runningMatch[1];
        }
        if (walletCurrent === null || walletPredicted === null) {
            const walletMatch = line.match(/Wallet: Current\(([-0-9.]+)\), Predicted\(([-0-9.]+)\)/);
            if (walletMatch) {
                walletCurrent = parseFloat(walletMatch[1]);
                walletPredicted = parseFloat(walletMatch[2]);
            }
        }
        if (runningState !== null && walletCurrent !== null && walletPredicted !== null) {
            break;
        }
    }

    return {
        runningState,
        walletCurrent,
        walletPredicted
    };
}

let cachedGpuName = "Unknown GPU"; 

async function preloadGPUName() {
    try {
        const graphics = await si.graphics();
        const nvidiaGpu = graphics.controllers.find(gpu => gpu.vendor.toLowerCase().includes("nvidia"));
        if (nvidiaGpu) {
            // Extract only the relevant GPU model name (e.g., "RTX 3090")
            cachedGpuName = nvidiaGpu.model.replace(/NVIDIA GeForce /i, "").trim();
        } else {
            cachedGpuName = "Unknown GPU";
        }
    } catch (error) {
        console.error("Error getting GPU information:", error);
    }
}

async function getSaladInfo() {
    const latestLog = getLatestLogFile();
    const saladInfo = parseLogFile(latestLog);
    return { ...saladInfo, gpuName: cachedGpuName }; 
}

preloadGPUName();

module.exports = { getSaladInfo };
