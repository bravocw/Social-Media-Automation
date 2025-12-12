const { app, BrowserWindow, ipcMain } = require("electron");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { dialog } = require("electron");
const pkg = require("./package.json");
const adb = require("./modules");
const updater = require("./modules/updater");
const license = require("./modules/license");
app.setName("Social Media Automation");

function createMainWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.maximize();

    win.loadFile("pageui/dashboard.html");
}

function createLicenseWindow() {
    const win = new BrowserWindow({
        width: 500,
        height: 400,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile("pageui/license_window.html");
}

app.whenReady().then(async () => {
    console.log("Checking for update...");
    const updateInfo = await updater.checkForUpdate();

    if (updateInfo) {
        console.log("Update tersedia → tampilkan window update");
        updater.showUpdateWindow(updateInfo);
        return;
    }

    console.log("Checking saved license...");

    const isValid = await license.checkLicenseOnStartup();

    if (isValid) {
        console.log("✔ License valid → opening main window");
        createMainWindow();
    } else {
        console.log("✖ License invalid → showing license window");
        createLicenseWindow();
    }
});


ipcMain.handle("get-app-name", () => {
    return app.getName();
});

ipcMain.handle("get-app-version", () => {
    return app.getVersion();
});

ipcMain.handle("submit-license", async (event, key) => {
    const result = await license.activateLicense(key);

    if (result.success === true) {
        const windows = BrowserWindow.getAllWindows();
        windows.forEach(w => w.close());
        createMainWindow();
    }

    return result;
});

ipcMain.handle("validate-license", async () => {
    return await license.validateTokenFromFile();
});

ipcMain.handle("open-license-window", () => {
    createLicenseWindow();
});



ipcMain.handle("update-info", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win.updateInfo;
});

ipcMain.handle("update-start", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);

    const ok = await updater.startUpdate(win, (progress) => {
        event.sender.send("update-progress", progress);
    });

    return ok;
});

ipcMain.handle("scan-full", async () => {
    console.log("SCAN FULL REQUEST");
    return await adb.scanFull();
});

ipcMain.handle("scan-one", async (event, deviceId) => {
    console.log("SCAN ONE REQUEST for:", deviceId);
    return await adb.scanOneDevice(deviceId);
});

ipcMain.handle("like-multiple", async (event, url, count, delayMs) => {
    console.log("LIKE REQUEST:", url, count, "delay:", delayMs);
    return await adb.likeMultiple(url, count, delayMs);
});

ipcMain.handle("comment-multiple", async (event, url, comments, count, delayMs) => {
    console.log("COMMENT REQUEST:", url, comments, count, "delay:", delayMs);
    return await adb.commentMultiple(url, comments, count, delayMs);
});

ipcMain.handle("follow-multiple", async (event, url, count, delayMs) => {
    console.log("FOLLOW REQUEST:", url, count, "delay:", delayMs);
    return await adb.followMultiple(url, count, delayMs);
});

ipcMain.handle("get-log-data", async () => {
    const fs = require("fs");
    const path = require("path");

    const LOG_FILE = path.join(process.cwd(), "activity_log.txt");

    if (!fs.existsSync(LOG_FILE)) return [];

    const raw = fs.readFileSync(LOG_FILE, "utf8").trim();
    if (!raw) return [];

    return raw.split("\n").map(line => {
        const parts = line.split("|").map(x => x.trim());

        return {
            time: parts[0],
            identity: parts[1],
            action: parts[2]?.split("=")[0] ?? "",
            status: parts[2]?.split("=")[1] ?? "",
            url: parts[3]?.replace("url=", "") ?? ""
        };
    });
});

ipcMain.handle("export-devices-excel", async (event, deviceList) => {
    try {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: "Export Device Excel Premium",
            defaultPath: "Device_List.xlsx",
            filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }]
        });

        if (canceled || !filePath) return { success: false };

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Device List", {
            views: [{ state: "frozen", ySplit: 1 }]
        });

        // Define columns
        sheet.columns = [
            { header: "No", key: "no", width: 6 },
            { header: "Device ID", key: "device", width: 22 },
            { header: "Brand", key: "brand", width: 15 },
            { header: "Model", key: "model", width: 15 },
            { header: "Username IG", key: "username", width: 22 },
            { header: "Status", key: "status", width: 15 }
        ];

        // HEADER DESIGN
        const header = sheet.getRow(1);
        header.height = 28;

        header.eachCell((cell) => {
            cell.font = {
                bold: true,
                size: 12,
                color: { argb: "FFFFFFFF" },
                name: "Segoe UI"
            };
            cell.fill = {
                type: "gradient",
                gradient: "angle",
                degree: 0,
                stops: [
                    { position: 0, color: { argb: "FF002B5B" } },
                    { position: 1, color: { argb: "FF014F86" } }
                ]
            };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
                top: { style: "medium" },
                left: { style: "medium" },
                bottom: { style: "medium" },
                right: { style: "medium" }
            };
        });

        // BODY DATA
        deviceList.forEach((d, i) => {
            const row = sheet.addRow({
                no: i + 1,
                device: d.device,
                brand: d.brand,
                model: d.model,
                username: d.username || "-",
                status: d.loginScreen ? "LOGIN SCREEN" : "LOGGED IN"
            });

            row.height = 22;

            // Zebra Style
            const zebra = i % 2 === 0 ? "FFF5F5F5" : "FFFFFFFF";

            row.eachCell((cell, colNum) => {
                // Fill background
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: zebra }
                };

                // Base text font
                cell.font = {
                    size: 11,
                    name: "Segoe UI"
                };

                // Alignment
                cell.alignment = {
                    vertical: "middle",
                    horizontal: colNum === 5 || colNum === 6 ? "center" : "left"
                };

                // Border clean thin
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };

                // STATUS COLORING
                if (colNum === 6) {
                    cell.font = {
                        bold: true,
                        size: 11,
                        color: {
                            argb: d.loginScreen ? "FFB00020" : "FF018A0F"
                        },
                        name: "Segoe UI"
                    };
                }
            });
        });

        // Auto filter
        sheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: 6 }
        };

        await workbook.xlsx.writeFile(filePath);

        return { success: true, path: filePath };

    } catch (error) {
        return { success: false, error: error.message };
    }
});



