const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const { execSync } = require("child_process");

function getDeviceID() {
    let machineGuid = "UNKNOWN";
    let motherboard = "UNKNOWN";
    let disk = "UNKNOWN";

    try {
        const mg = execSync(
            'reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid',
            { encoding: "utf8" }
        );
        const match = mg.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9-]+)/);
        if (match) machineGuid = match[1].trim();
    } catch { }

    try {
        const mb = execSync("wmic baseboard get serialnumber", { encoding: "utf8" })
            .split("\n")[1].trim();
        if (mb) motherboard = mb;
    } catch { }

    try {
        const dk = execSync("wmic diskdrive get serialnumber", { encoding: "utf8" })
            .split("\n")[1].trim();
        if (dk) disk = dk;
    } catch { }

    const raw = `${machineGuid}${motherboard}${disk}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
}

const DEVICE_ID = getDeviceID();
console.log("DEVICE ID:", DEVICE_ID);

const LICENSE_FILE = path.join(
    process.env.APPDATA || process.cwd(),
    "adb_license.json"
);

const API_BASE = "https://ptbcwk.web.id/api/v1/license";

async function checkLicenseOnStartup() {
    if (!fs.existsSync(LICENSE_FILE)) {
        console.log("License file not found.");
        return false;
    }

    try {
        const data = JSON.parse(fs.readFileSync(LICENSE_FILE, "utf8"));
        const token = data.token;
        const deviceId = data.device_id || DEVICE_ID;

        if (!token) {
            console.log("No token in license file, need activation.");
            return false;
        }

        console.log("Validating saved token...");
        const result = await validateToken(token, deviceId);

        return result.success === true;

    } catch (e) {
        console.error("Error reading license file:", e);
        return false;
    }
}

async function activateLicense(licenseKey) {
    try {
        console.log("Activating license:", licenseKey);

        const res = await axios.post(
            `${API_BASE}/activate`,
            {
                license_key: licenseKey,
                device_id: DEVICE_ID
            },
            { timeout: 8000 }
        );

        console.log("ACTIVATE RESPONSE:", res.data);

        if (res.data.success === true) {
            const token = res.data.data?.token;

            saveLicense(licenseKey, token, DEVICE_ID);

            return {
                success: true,
                message: res.data.message || "License activated successfully"
            };
        }

        return {
            success: false,
            message: res.data.message || "Activation failed"
        };

    } catch (e) {
        console.error("ACTIVATE ERROR:", e.message);
        return { success: false, message: "Cannot reach license server" };
    }
}

async function validateToken(token, deviceId) {
    try {
        const res = await axios.post(
            `${API_BASE}/validate`,
            {
                token: token,
                device_id: deviceId
            },
            { timeout: 8000 }
        );

        console.log("VALIDATE RESPONSE:", res.data);

        if (res.data.success === true) {
            return {
                success: true,
                message: res.data.message || "License valid"
            };
        }

        return {
            success: false,
            message: res.data.message || "License invalid"
        };

    } catch (e) {
        console.error("VALIDATE ERROR:", e.message);
        return { success: false, message: "Cannot reach license server" };
    }
}

function saveLicense(licenseKey, token, deviceId) {
    const data = {
        license_key: licenseKey,
        token: token,
        device_id: deviceId
    };

    fs.writeFileSync(LICENSE_FILE, JSON.stringify(data, null, 2), "utf8");
    console.log("License saved:", data);
}

async function validateTokenFromFile() {
    if (!fs.existsSync(LICENSE_FILE)) {
        return { success: false, message: "License file missing" };
    }

    const data = JSON.parse(fs.readFileSync(LICENSE_FILE, "utf8"));
    const token = data.token;
    const deviceId = data.device_id || DEVICE_ID;

    return await validateToken(token, deviceId);
}


module.exports = {
    checkLicenseOnStartup,
    activateLicense,
    validateTokenFromFile,
    DEVICE_ID
};

