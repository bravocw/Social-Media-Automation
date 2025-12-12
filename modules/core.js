
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const isDev = !app.isPackaged;
const USER_DIR = app.getPath("userData");

if (!fs.existsSync(USER_DIR)) {
    fs.mkdirSync(USER_DIR, { recursive: true });
}

const ADB = isDev
    ? path.join(__dirname, "..", "adb.exe")
    : path.join(process.resourcesPath, "adb.exe");

const LOG_FILE = path.join(process.cwd(), "activity_log.txt");
const LAYOUT_FILE = path.join(USER_DIR, "layout_cache.json");

const deviceUsernames = {};

let layoutCache = {};
if (fs.existsSync(LAYOUT_FILE)) {
    try {
        layoutCache = JSON.parse(fs.readFileSync(LAYOUT_FILE, "utf8"));
    } catch (e) {
        console.error("⚠️ Gagal parse layout_cache.json:", e.message);
        layoutCache = {};
    }
}

function saveLayoutCache() {
    try {
        fs.writeFileSync(LAYOUT_FILE, JSON.stringify(layoutCache, null, 4), "utf8");
    } catch (e) {
        console.error("⚠️ Gagal menulis layout_cache.json:", e.message);
    }
}

function getDeviceLayout(deviceId) {
    if (!layoutCache[deviceId]) layoutCache[deviceId] = {};
    return layoutCache[deviceId];
}

function setDeviceLayout(deviceId, partialLayout) {
    layoutCache[deviceId] = { ...layoutCache[deviceId], ...partialLayout };
    saveLayoutCache();
}

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function formatTimestamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
        + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function getLogIdentity(deviceId) {
    const username = deviceUsernames[deviceId];
    return username ? `${username} (${deviceId})` : deviceId;
}

function appendLog(deviceId, action, status, url) {
    console.log("MENULIS LOG:", deviceId, action, status, url);

    const line = `${formatTimestamp()} | ${getLogIdentity(deviceId)} `
        + `| ${action}=${status} | url=${url}\n`;

    try {
        fs.appendFileSync(LOG_FILE, line, "utf8");
    } catch (e) {
        console.error("❌ Gagal menulis log:", e.message);
    }
}

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error("CMD FAILED:", cmd);
                console.error(stderr || err);
                reject(stderr || err);
            } else {
                resolve(stdout);
            }
        });
    });
}

function adbCmd(args) {
    return `"${ADB}" ${args}`;
}

function extractInstagramUsername(xml) {
    let regexA = /(?:resource-id="com\.instagram\.android:id\/action_bar_title"[^>]*?text="([^"]+)"|text="([^"]+)"[^>]*?resource-id="com\.instagram\.android:id\/action_bar_title")/s;
    let matchA = xml.match(regexA);

    if (matchA) {
        let candidate = matchA[1] || matchA[2];
        let cleaned = candidate.trim().replace(/ /g, "");
        if (/^[A-Za-z0-9._'-]+$/.test(cleaned)) return cleaned;
    }

    let regexB2 = /resource-id="com\.instagram\.android:id\/profile_header_banner_item_title"[^>]*?text="([^"]+)"/;
    let matchB2 = xml.match(regexB2);

    if (matchB2) {
        let cleaned = matchB2[1].trim().replace(/ /g, "");
        if (/^[A-Za-z0-9._'-]+$/.test(cleaned)) return cleaned;
    }

    let regexC = /content-desc="(?:Cerita|Cerita sorotan)[^"]*?([A-Za-z0-9._'-]{2,30})/;
    let matchC = xml.match(regexC);

    if (matchC) {
        return matchC[1].trim();
    }

    let regexD = />\s*([A-Za-z0-9._'-]{2,30})\s*</g;
    let matchD;

    while ((matchD = regexD.exec(xml)) !== null) {
        let candidate = matchD[1];

        if (!isNaN(candidate)) continue;
        if (candidate.length < 2 || candidate.length > 30) continue;

        return candidate;
    }

    return null;
}

function saveXMLLog(deviceId, stage, xml) {
    const safeStage = stage.replace(/[^a-zA-Z0-9_-]/g, "");
    const filename = path.join(USER_DIR, `xml_${deviceId}_${safeStage}.xml`);

    try {
        fs.writeFileSync(filename, xml, "utf8");
        console.log(`📄 XML (${stage}) disimpan: ${filename}`);
    } catch (e) {
        console.error("❌ Gagal simpan XML:", e.message);
    }
}

module.exports = {
    ADB,
    deviceUsernames,
    layoutCache,
    getDeviceLayout,
    setDeviceLayout,
    run,
    delay,
    appendLog,
    extractInstagramUsername,
    saveXMLLog,
    adbCmd
};
