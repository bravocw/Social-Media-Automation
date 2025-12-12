const {
    ADB,
    adbCmd,
    run,
    delay,
    deviceUsernames,
    extractInstagramUsername,
    getDeviceLayout,
    setDeviceLayout
} = require("./core");

const {
    dumpUI,
    swipeDown,
    tapInstagramProfile,
    hasBottomTabBar,
    findProfileTab,
    ensureHomeWithBottomBar,
} = require("./ui");

async function getDevices() {
    const output = await run(adbCmd("devices"));
    return output
        .split("\n")
        .slice(1)
        .filter(line => line.trim().endsWith("device"))
        .map(line => line.split("\t")[0]);
}

async function getDeviceInfo(deviceId) {
    const brand = await run(adbCmd(`-s ${deviceId} shell getprop ro.product.brand`));
    const model = await run(adbCmd(`-s ${deviceId} shell getprop ro.product.model`));
    const device = await run(adbCmd(`-s ${deviceId} shell getprop ro.product.device`));

    return {
        brand: brand.trim(),
        model: model.trim(),
        device: device.trim()
    };
}

function detectLoginScreen(xml) {
    const loginKeywords = ["Log in", "Sign in", "Masuk", "Password", "Forgot"];
    return loginKeywords.some(key => xml.includes(key));
}

async function tryGetUsername(deviceId, retries = 2) {
    for (let i = 1; i <= retries; i++) {
        console.log(`🔁 Percobaan ${i} mengambil username...`);

        const xml = await dumpUI(deviceId);
        const username = extractInstagramUsername(xml);

        if (username) return username;

        await swipeDown(deviceId);
    }

    return null;
}

async function backNTimes(deviceId, n, delayMs = 300) {
    for (let i = 0; i < n; i++) {
        await run(adbCmd(`-s ${deviceId} shell input keyevent 4`));
        await delay(delayMs);
    }
}

async function scanOneDevice(deviceId) {
    const info = await getDeviceInfo(deviceId);

    // await run(
    //     adbCmd(`-s ${deviceId} shell am start -n com.instagram.android/com.instagram.mainactivity.MainTabActivity`)
    // );
    // await delay(1500);

    let xml = await ensureHomeWithBottomBar(deviceId);
    let profileBtn = findProfileTab(xml);

    if (profileBtn) {
        console.log(`👤 Tap PROFILE (${profileBtn.x}, ${profileBtn.y})`);
        setDeviceLayout(deviceId, { profileTab: profileBtn });

        await run(adbCmd(`-s ${deviceId} shell input tap ${profileBtn.x} ${profileBtn.y}`));
        await delay(1000);
    } else {
        console.log("⚠️ Tidak ditemukan tombol PROFILE. Fallback hardcode.");
        await tapInstagramProfile(deviceId);
    }

    xml = await dumpUI(deviceId);

    const loginScreen = detectLoginScreen(xml);

    let username = null;
    if (!loginScreen) {
        username = await tryGetUsername(deviceId, 2);
    }

    if (username) {
        deviceUsernames[deviceId] = username;
    }

    return {
        device: deviceId,
        brand: info.brand,
        model: info.model,
        deviceName: info.device,
        loginScreen,
        username
    };
}

async function scanFullOLD() {
    const devices = await getDevices();
    if (devices.length === 0) return [];

    const results = [];

    for (const dev of devices) {
        console.log(`📱 Menyiapkan device ${dev}...`);

        try {
            await run(adbCmd(`-s ${dev} shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n com.instagram.android/.activity.MainTabActivity`));
            await delay(1200);
            await ensureHomeWithBottomBar(dev);
            const info = await scanOneDevice(dev);

            results.push(info);

        } catch (err) {
            console.log(`❌ Gagal scan device ${dev}:`, err);
            results.push({
                device: dev,
                brand: "-",
                model: "-",
                deviceName: "-",
                loginScreen: true,
                username: null,
                error: true
            });
        }
        await delay(500);
    }

    return results;
}

async function restartInstagram(deviceId) {
    try {
        // Force stop IG
        await run(adbCmd(`-s ${deviceId} shell am force-stop com.instagram.android`));
        await delay(500);

        // Start IG normal
        await run(adbCmd(
            `-s ${deviceId} shell am start -a android.intent.action.MAIN -c android.intent.category.LAUNCHER -n com.instagram.android/.activity.MainTabActivity`
        ));

        await delay(1500); // beri waktu IG membuka
    } catch (e) {
        console.log(`❌ Gagal restart IG di device ${deviceId}`, e);
    }
}


async function scanFull() {
    const devices = await getDevices();
    if (devices.length === 0) return [];

    const BATCH_SIZE = 10; // aman untuk 100 device
    const results = [];

    // bagi menjadi beberapa batch
    for (let i = 0; i < devices.length; i += BATCH_SIZE) {
        const batch = devices.slice(i, i + BATCH_SIZE);
        console.log(`🚀 Memproses batch ${i / BATCH_SIZE + 1} (${batch.length} device)...`);

        // jalankan paralel untuk batch ini
        const batchResults = await Promise.all(
            batch.map(dev => safeScanDevice(dev))
        );

        results.push(...batchResults);

        // beri jeda ringan antar batch agar ADB tidak overload
        await delay(500);
    }

    return results;
}

async function safeScanDevice(dev) {
    try {
        // Restart IG dulu
        await restartInstagram(dev);

        // Jalankan scan detail
        return await scanOneDevice(dev);

    } catch (err) {
        console.log(`❌ Error pada device ${dev}:`, err);
        return {
            device: dev,
            brand: "-",
            model: "-",
            deviceName: "-",
            loginScreen: true,
            username: null,
            error: true
        };
    }
}


module.exports = {
    getDevices,
    getDeviceInfo,
    detectLoginScreen,
    tryGetUsername,
    backNTimes,
    scanOneDevice,
    scanFull,
};
