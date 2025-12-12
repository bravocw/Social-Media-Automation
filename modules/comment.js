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

async function tapCommentButton(deviceId) {
    const xml = await dumpUI(deviceId);

    const pos = getBoundsByResourceId(xml, "com.instagram.android:id/row_feed_button_comment");
    if (!pos) {
        console.log("❌ Tombol komentar tidak ditemukan di XML realtime!");
        return false;
    }

    console.log(`💬 Tap tombol komentar realtime pada (${pos.x}, ${pos.y})`);
    await run(`"${ADB}" -s ${deviceId} shell input tap ${pos.x} ${pos.y}`);
    await delay(600);

    return true;
}

async function typeComment(deviceId, text) {
    text = text.replace(/"/g, '\\"').replace(/ /g, "%s");

    console.log(`⌨️ Mengetik komentar: "${text}"`);
    await run(`"${ADB}" -s ${deviceId} shell input text "${text}"`);
    await delay(600);
}

async function submitComment(deviceId) {
    const xml = await dumpUI(deviceId);

    const pos = getBoundsByResourceId(
        xml,
        "com.instagram.android:id/layout_comment_thread_post_button_icon"
    );

    if (!pos) {
        console.log("❌ Tombol kirim komentar tidak ditemukan di XML realtime!");
        return false;
    }

    console.log(`📤 Tap tombol submit komentar realtime pada (${pos.x}, ${pos.y})`);
    await run(`"${ADB}" -s ${deviceId} shell input tap ${pos.x} ${pos.y}`);
    await delay(700);

    return true;
}

async function commentPost(deviceId, url, text, options = {}) {
    const { openDelayMs = 1500 } = options;

    console.log(`=== KOMENTAR POST (${deviceId}) — NO CACHE ===`);

    await run(`"${ADB}" -s ${deviceId} shell am start -a android.intent.action.VIEW -d "${url}"`);
    await delay(openDelayMs);

    const tapped = await tapCommentButton(deviceId);
    if (!tapped) {
        appendLog(deviceId, "COMMENT", "FAILED_OPEN_COMMENT", url);
        await backNTimes(deviceId, 1);
        return {
            deviceId,
            action: "COMMENT",
            status: "FAILED_OPEN_COMMENT",
            comment: text
        };
    }

    await delay(500);

    await typeComment(deviceId, text);
    await delay(500);

    const sent = await submitComment(deviceId);

    await backNTimes(deviceId, 3);

    const status = sent ? "SUCCESS" : "FAILED_SUBMIT";
    appendLog(deviceId, "COMMENT", status, url);

    return {
        deviceId,
        action: "COMMENT",
        status,
        comment: text
    };
}


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function commentMultiple(url, commentsArray, count, delaySec, randomSec) {
    let devices = await getDevices();
    devices = shuffle(devices);

    const selected = devices.slice(0, count);

    if (selected.length === 0) return [];

    const jobs = selected.map((dev, idx) => (async () => {
        const comment = commentsArray[idx % commentsArray.length];
        if (idx === 0) {
            return commentPost(dev, url, comment);
        }
        const finalDelayMs = generateFinalDelay(delaySec, randomSec);
        console.log(`Device ${dev} delay start: ${finalDelayMs / 1000} detik`);

        await delay(finalDelayMs);

        return commentPost(dev, url, comment);

    })());

    return Promise.all(jobs);
}

module.exports = {
    tapCommentButton,
    typeComment,
    submitComment,
    commentPost,
    commentMultiple,
};
