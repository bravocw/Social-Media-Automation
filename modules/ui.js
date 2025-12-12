const fs = require("fs");
const {
    ADB,
    run,
    delay,
    getDeviceLayout,
    setDeviceLayout
} = require("./core");

async function dumpUI(deviceId) {
    await run(`"${ADB}" -s ${deviceId} shell uiautomator dump /sdcard/ig.xml`);
    await run(`"${ADB}" -s ${deviceId} pull /sdcard/ig.xml`);
    return fs.readFileSync("ig.xml", "utf8");
}

async function dumpPostUI(deviceId) {
    await run(`"${ADB}" -s ${deviceId} shell uiautomator dump /sdcard/ig_post.xml`);
    await run(`"${ADB}" -s ${deviceId} pull /sdcard/ig_post.xml`);

    const xml = fs.readFileSync("ig_post.xml", "utf8");
    console.log(`📁 XML postingan telah disimpan sebagai: ig_post.xml`);

    return xml;
}

async function dumpCommentUI(deviceId, filename = "ig_comment.xml") {
    await run(`"${ADB}" -s ${deviceId} shell uiautomator dump /sdcard/${filename}`);
    await run(`"${ADB}" -s ${deviceId} pull /sdcard/${filename}`);

    const xml = fs.readFileSync(filename, "utf8");
    console.log(`📄 UI komentar disimpan sebagai: ${filename}`);

    return xml;
}

async function swipeDown(deviceId) {
    const startX = 500;
    const startY = 300;
    const endX = 500;
    const endY = 1200;

    await run(`"${ADB}" -s ${deviceId} shell input swipe ${startX} ${startY} ${endX} ${endY} 300`);
    await delay(300);
}

async function tapInstagramProfile(deviceId) {
    const layout = getDeviceLayout(deviceId);

    if (layout.profileTab) {
        const { x, y } = layout.profileTab;
        console.log(`👤 Tap PROFILE cached (${x}, ${y})`);
        await run(`"${ADB}" -s ${deviceId} shell input tap ${x} ${y}`);
        await delay(800);
        return;
    }
    const x = 950;
    const y = 2350;
    console.log("⚠️ PROFILE tab belum di-cache, pakai hardcode.");
    await run(`"${ADB}" -s ${deviceId} shell input tap ${x} ${y}`);
    await delay(1200);
}

function getBoundsByResourceId(xml, resourceId) {
    const regex = new RegExp(
        `resource-id="${resourceId}"[\\s\\S]*?bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`,
        "m"
    );
    const match = xml.match(regex);

    if (!match) return null;

    const x1 = parseInt(match[1], 10);
    const y1 = parseInt(match[2], 10);
    const x2 = parseInt(match[3], 10);
    const y2 = parseInt(match[4], 10);

    return {
        x: Math.floor((x1 + x2) / 2),
        y: Math.floor((y1 + y2) / 2)
    };
}

function hasBottomTabBar(xml) {
    return xml.includes('resource-id="com.instagram.android:id/tab_bar"');
}

function findProfileTab(xml) {
    return (
        getBoundsByResourceId(xml, "com.instagram.android:id/profile_tab") ||
        getBoundsByResourceId(xml, "com.instagram.android:id/tab_avatar")
    );
}

async function ensureHomeWithBottomBar(deviceId) {
    let attempt = 0;

    while (attempt < 10) {
        const xml = await dumpUI(deviceId);

        if (hasBottomTabBar(xml)) {
            console.log("✅ Bottom bar ditemukan, sudah di HOME.");
            return xml;
        }

        console.log("↩️ Bottom bar hilang → tekan BACK");
        await run(`"${ADB}" -s ${deviceId} shell input keyevent 4`);
        await delay(150);

        attempt++;
    }

    console.log("⚠️ Tidak bisa kembali ke HOME, fallback.");
    return await dumpUI(deviceId);
}

module.exports = {
    swipeDown,
    dumpUI,
    dumpPostUI,
    dumpCommentUI,

    tapInstagramProfile,

    getBoundsByResourceId,
    hasBottomTabBar,
    findProfileTab,
    ensureHomeWithBottomBar,
};
