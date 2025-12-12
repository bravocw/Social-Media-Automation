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

function isPostAlreadyLiked(xml) {
    const likeNodeRegex = /resource-id="com\.instagram\.android:id\/row_feed_button_like"[^>]*>/;
    const match = xml.match(likeNodeRegex);
    if (!match) return false;

    const node = match[0];

    if (node.includes('selected="true"')) return true;
    if (node.includes('content-desc="Batalkan Suka"')) return true;
    if (node.toLowerCase().includes('content-desc="liked"')) return true;
    if (node.toLowerCase().includes('content-desc="disukai"')) return true;

    return false;
}

async function openInstagramURL(deviceId, url) {
    console.log(`📨 Membuka URL di ${deviceId}: ${url}`);
    await run(`"${ADB}" -s ${deviceId} shell am start -a android.intent.action.VIEW -d "${url}"`);
    await delay(1500);
}

async function autoLike(deviceId, xml) {
    const pos = getBoundsByResourceId(xml, "com.instagram.android:id/row_feed_button_like");

    if (!pos) {
        console.log("❌ Tombol LIKE tidak ditemukan di XML realtime!");
        return false;
    }

    console.log(`❤️ Tap LIKE realtime pada (${pos.x}, ${pos.y})`);
    await run(`"${ADB}" -s ${deviceId} shell input tap ${pos.x} ${pos.y}`);
    await delay(400);

    return true;
}

async function likePost(deviceId, url, options = {}) {
    const { openDelayMs = 1500 } = options;

    console.log(`=== LIKE POST (${deviceId}) ===`);

    await openInstagramURL(deviceId, url);
    await delay(openDelayMs);

    let xml = await dumpUI(deviceId);

    if (isPostAlreadyLiked(xml)) {
        console.log("✅ Postingan sudah di-LIKE sebelumnya.");
        appendLog(deviceId, "LIKE", "ALREADY", url);
        await backNTimes(deviceId, 1);

        return { deviceId, action: "LIKE", status: "ALREADY" };
    }

    const success = await autoLike(deviceId, xml);

    await backNTimes(deviceId, 1);

    if (success) {
        appendLog(deviceId, "LIKE", "SUCCESS", url);
    } else {
        appendLog(deviceId, "LIKE", "FAILED", url);
    }

    return {
        deviceId,
        action: "LIKE",
        status: success ? "SUCCESS" : "FAILED"
    };
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function likeMultiple(url, count, delaySec, randomSec) {
    let devices = await getDevices();
    devices = shuffle(devices);
    const selected = devices.slice(0, count);

    if (selected.length === 0) return [];

    const jobs = selected.map((dev, idx) => (async () => {
        if (idx === 0) {
            console.log(`Device ${dev} mulai langsung`);
            return likePost(dev, url);
        }
        const finalDelayMs = generateFinalDelay(delaySec, randomSec);
        console.log(`Device ${dev} delay start: ${finalDelayMs / 1000} detik`);

        await delay(finalDelayMs);

        return likePost(dev, url);

    })());

    return Promise.all(jobs);
}

module.exports = {
    isPostAlreadyLiked,
    openInstagramURL,
    autoLike,
    likePost,
    likeMultiple,
};
