const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    getUpdateInfo: () => ipcRenderer.invoke("update-info"),
    update: () => ipcRenderer.invoke("update-start"),
    onUpdateProgress: (callback) =>
        ipcRenderer.on("update-progress", (event, progress) => callback(progress)),

    submitLicense: (key) => ipcRenderer.invoke("submit-license", key),


    scanFull: () => ipcRenderer.invoke("scan-full"),

    scanOne: (deviceId) => ipcRenderer.invoke("scan-one", deviceId),

    likeMultiple: (url, count, delayMs) =>
        ipcRenderer.invoke("like-multiple", url, count, delayMs),

    commentMultiple: (url, commentsArray, count, delayMs) =>
        ipcRenderer.invoke("comment-multiple", url, commentsArray, count, delayMs),

    followMultiple: (url, count, delayMs) =>
        ipcRenderer.invoke("follow-multiple", url, count, delayMs),

    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getLogData: () => ipcRenderer.invoke("get-log-data"),
    getAppVersion: () => ipcRenderer.invoke("get-app-version"),
    exportDevicesExcel: (devices) => ipcRenderer.invoke("export-devices-excel", devices)

});

contextBridge.exposeInMainWorld("license", {
    validate: () => ipcRenderer.invoke("validate-license")
});

contextBridge.exposeInMainWorld("licenseWindow", {
    open: () => ipcRenderer.invoke("open-license-window")
});
