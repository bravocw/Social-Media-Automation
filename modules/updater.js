const axios = require("axios");
const fs = require("fs");
const https = require("https");
const path = require("path");
const { app, BrowserWindow } = require("electron");
const { exec } = require("child_process");
const semver = require("semver");

const UPDATE_URL = "https://api.cekin.online/update/check";
const CURRENT_VERSION = app.getVersion();
function getTempInstallerPath() {
    return path.join(app.getPath("userData"), "adbtool_update.exe");
}

async function checkForUpdate() {
    try {
        const res = await axios.get(UPDATE_URL, { timeout: 8000 });
        if (!res.data?.latest || !res.data?.url) return null;

        if (!semver.valid(res.data.latest)) return null;

        if (semver.gt(res.data.latest, CURRENT_VERSION)) {
            return {
                latest: res.data.latest,
                url: res.data.url,
                changelog: res.data.changelog || "",
            };
        }

        return null;
    } catch (e) {
        console.log("❌ Update check failed:", e.message);
        return null;
    }
}

function showUpdateWindow(info) {
    const win = new BrowserWindow({
        width: 460,
        height: 390,
        resizable: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, "..", "preload.js"),
            contextIsolation: true
        }
    });

    win.updateInfo = info;
    win.loadFile(path.join(__dirname, "..", "pageui", "update_popup.html"));

    return win;
}

function downloadUpdate(info, cb) {
    return new Promise((resolve, reject) => {
        const installerPath = getTempInstallerPath();

        if (fs.existsSync(installerPath)) fs.unlinkSync(installerPath);

        const file = fs.createWriteStream(installerPath);

        const request = https.get(info.url, (res) => {
            if (res.statusCode !== 200) return reject("HTTP " + res.statusCode);

            const total = parseInt(res.headers["content-length"] || "0", 10);
            let downloaded = 0;

            res.on("data", (chunk) => {
                file.write(chunk);
                downloaded += chunk.length;

                if (total > 0 && cb) cb(((downloaded / total) * 100).toFixed(2));
            });

            res.on("end", () => {
                file.end();
                resolve(installerPath);
            });
        });

        request.on("error", reject);
        request.setTimeout(15000, () => {
            request.destroy();
            reject("Timeout downloading update.");
        });
    });
}

function runInstallerSilent(installerPath) {
    const silentArg = "/S";

    console.log("🚀 Launching installer silently:", installerPath);
    exec(`"${installerPath}" ${silentArg}`, (err) => {
        if (err) {
            console.log("❌ Installer error:", err);
            return;
        }

        console.log("✔ Installer executed successfully");
    });
    setTimeout(() => {
        console.log("❌ Closing app for update...");
        app.quit();
    }, 500);
}

async function startUpdate(win, cb) {
    try {
        const info = win.updateInfo;
        if (!info) return false;

        const installerPath = await downloadUpdate(info, cb);

        runInstallerSilent(installerPath);

        return true;
    } catch (e) {
        console.log("❌ Update failed:", e);
        return false;
    }
}

module.exports = {
    checkForUpdate,
    showUpdateWindow,
    startUpdate
};
