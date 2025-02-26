// src/logReader.js
const fs = require('fs');
const path = require('path');

const LOG_DIR = "C:\\ProgramData\\Salad\\logs";

function getLatestLogFile() {
    const files = fs.readdirSync(LOG_DIR)
        .filter(file => file.startsWith('log-') && file.endsWith('.txt'))
        .sort((a, b) => b.localeCompare(a)); // Sort in descending order

    return files.length > 0 ? path.join(LOG_DIR, files[0]) : null;
}

function parseLogFile(filePath) {
    if (!filePath || !fs.existsSync(filePath)) return null;
    
    const logData = fs.readFileSync(filePath, 'utf8');
    const logLines = logData.trim().split('\n').reverse(); // Read from bottom to top
    
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
            break; // Stop searching once all needed values are found
        }
    }

    return {
        runningState,
        walletCurrent,
        walletPredicted
    };
}

function getSaladInfo() {
    const latestLog = getLatestLogFile();
    return parseLogFile(latestLog);
}

module.exports = { getSaladInfo };
