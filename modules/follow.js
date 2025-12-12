const fs = require("fs");
const {
    ADB,
    run,
    delay,
    appendLog
} = require("./core");

const {
    dumpUI,
    getBoundsByResourceId
} = require("./ui");

const { getDevices, backNTimes } = require("./device");


function generateFinalDelay(delaySec, randomSec) {
    const min = delaySec;
    const max = delaySec + randomSec;

    const finalSec = Math.floor(Math.random() * (max - min + 1)) + min;

    return finalSec * 1000;
}

function isAlreadyFollowing(xml) {
    try {
        fs.writeFileSync("debug_follow.xml", xml, "utf8");
    } catch { }

    const textMatch = xml.match(
        /resource-id="com\.instagram\.android:id\/profile_header_follow_button"[^>]*text="([^"]*)"/
    );
    const btnText = textMatch ? textMatch[1].trim().toLowerCase() : "";

    const descMatch = xml.match(
        /resource-id="com\.instagram\.android:id\/profile_header_follow_button"[^>]*content-desc="([^"]*)"/
    );
    const desc = descMatch ? descMatch[1].trim().toLowerCase() : "";

    console.log("🔍 text tombol:", btnText);
    console.log("🔍 content-desc:", desc);

    if (btnText.includes("mengikuti") || desc.includes("mengikuti")) return true;
    if (btnText.includes("following") || desc.includes("following")) return true;
    if (btnText.includes("requested") || desc.includes("requested")) return true;

    if (btnText.includes("ikuti") || desc.includes("ikuti")) return false;
    if (btnText.includes("follow back") || desc.includes("follow back")) return false;
    if (btnText.includes("follow") || desc.includes("follow")) return false;

    return false;
}

async function openProfileURL(deviceId, url) {
    console.log(`🔗 Membuka profil di ${deviceId}: ${url}`);
    await run(`"${ADB}" -s ${deviceId} shell am start -a android.intent.action.VIEW -d "${url}"`);
    await delay(1500);
}

function findFollowButtonBounds(xml) {
    const ids = [
        "com.instagram.android:id/profile_header_follow_button",
        "com.instagram.android:id/button_text"
    ];

    for (let id of ids) {
        const found = getBoundsByResourceId(xml, id);
        if (found) return found;
    }

    const regex =
        /text="(Ikuti|Follow|Follow Back)"[\s\S]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/;
    const match = xml.match(regex);

    if (match) {
        return {
            x: Math.floor((parseInt(match[2], 10) + parseInt(match[4], 10)) / 2),
            y: Math.floor((parseInt(match[3], 10) + parseInt(match[5], 10)) / 2)
        };
    }

    return null;
}

async function followUser(deviceId, xmlInitial) {
    let xml = xmlInitial || (await dumpUI(deviceId));

    if (isAlreadyFollowing(xml)) {
        console.log("🟢 Sudah mengikuti — tidak perlu klik.");
        return "ALREADY";
    }
    const pos = findFollowButtonBounds(xml);

    if (!pos) {
        console.log("❌ Tombol FOLLOW tidak ditemukan di XML realtime!");
        return false;
    }

    console.log(`➕ Tap FOLLOW realtime pada (${pos.x}, ${pos.y})`);
    await run(`"${ADB}" -s ${deviceId} shell input tap ${pos.x} ${pos.y}`);
    await delay(700);

    const xmlAfter = await dumpUI(deviceId);
    if (isAlreadyFollowing(xmlAfter)) {
        return true;
    }

    return false;
}

function normalizeInstagramURL(input) {
    if (!input) return "";
    if (input.startsWith("http://") || input.startsWith("https://")) {
        return input.endsWith("/") ? input : input + "/";
    }
    const username = input.replace("@", "").trim();

    return `https://www.instagram.com/${username}/`;
}

async function followOne(deviceId, url, options = {}) {
    const { openDelayMs = 1500 } = options;

    console.log(`=== FOLLOW (${deviceId}) ===`);

    const finalURL = normalizeInstagramURL(url);
    await openProfileURL(deviceId, finalURL);

    await delay(openDelayMs);

    let xml = await dumpUI(deviceId);

    if (isAlreadyFollowing(xml)) {
        console.log("✅ Akun sudah di-FOLLOW sebelumnya.");
        appendLog(deviceId, "FOLLOW", "ALREADY", url);
        await backNTimes(deviceId, 1);
        return { deviceId, action: "FOLLOW", status: "ALREADY" };
    }

    const success = await followUser(deviceId, xml);

    await backNTimes(deviceId, 1);

    if (success === "ALREADY") {
        appendLog(deviceId, "FOLLOW", "ALREADY", url);
    } else if (success) {
        appendLog(deviceId, "FOLLOW", "SUCCESS", url);
    } else {
        appendLog(deviceId, "FOLLOW", "FAILED", url);
    }

    return {
        deviceId,
        action: "FOLLOW",
        status: success === true ? "SUCCESS" : success === "ALREADY" ? "ALREADY" : "FAILED"
    };
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function followMultiple(url, count, delaySec, randomSec) {
    let devices = await getDevices();
    devices = shuffle(devices);
    const selected = devices.slice(0, count);

    if (selected.length === 0) return [];

    const finalURL = normalizeInstagramURL(url);

    const jobs = selected.map((dev, idx) => (async () => {
        if (idx === 0) {
            console.log(`Device ${dev} mulai langsung`);
            return followOne(dev, finalURL);
        }
        const finalDelayMs = generateFinalDelay(delaySec, randomSec);
        console.log(`Device ${dev} delay start: ${finalDelayMs / 1000} detik`);

        await delay(finalDelayMs);
        return followOne(dev, finalURL);

    })());

    return Promise.all(jobs);
}

module.exports = {
    isAlreadyFollowing,
    openProfileURL,
    findFollowButtonBounds,
    followUser,
    followOne,
    followMultiple,
};
