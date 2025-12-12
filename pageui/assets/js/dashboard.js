/* ==========================================
   GLOBAL STATE
========================================== */
let devices = JSON.parse(sessionStorage.getItem("devices")) || [];
let currentPage = 1;
const perPage = 10;

/* ==========================================
   PAGE LOADER
========================================== */
function openLicenseModal() {
    window.licenseWindow.open();
}

function loadPage(page) {
    document.querySelectorAll(".sidebar-item").forEach(i =>
        i.classList.remove("active")
    );
    const activeSidebar = document.querySelector(`.sidebar-item[data-page="${page}"]`);
    if (activeSidebar) activeSidebar.classList.add("active");
    switch (page) {
        case "devices":
            loadDevicePage();
            break;

        case "like":
            loadFormPage("form-like.html", page, "Dashboard / Auto Like");
            break;

        case "comment":
            loadFormPage("form-comment.html", page, "Dashboard / Auto Komentar");
            break;

        case "follow":
            loadFormPage("form-follow.html", page, "Dashboard / Auto Follow");
            break;
        case "report":
            loadReportPage();
            break;
        case "deleteFollowers":
            loadFormPage("form-delete-followers.html", page, "Dashboard / Delete Followers");
            break;

        default:
            loadDevicePage();
            break;
    }
}

function loadFormPage(component, page, breadcrumb) {
    setBreadcrumb(breadcrumb);
    highlightSidebar(page);
    loadComponent(component).then(() => bindFormEvents());
}

async function loadComponent(file) {
    const html = await (await fetch(`components/${file}`)).text();
    document.getElementById("pageContainer").innerHTML = html;
}

function loadDevicePage() {
    setBreadcrumb("Dashboard / Device");

    const html = `
        <div class="table-container">
            <div class="d-flex justify-content-between mb-3 align-items-center">
                <h4>📱 Device Terdeteksi (${devices.length})</h4>

                <div class="btn-group">
                    <button class="btn btn-success" onclick="exportExcel()">📥 Export Excel</button>
                    <button class="btn btn-primary" onclick="scanAllAgain()">🔄 Scan Semua</button>
                </div>
            </div>

            <table class="table table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>No</th>
                        <th>ID Device</th>
                        <th>Nama HP</th>
                        <th>Username IG</th>
                        <th>Status Login</th>
                        <th>Scan</th>
                    </tr>
                </thead>
                <tbody>${renderDeviceRows()}</tbody>
            </table>

            ${pagination()}
        </div>
    `;

    document.getElementById("pageContainer").innerHTML = html;
}

function renderDeviceRows() {
    if (!devices || devices.length === 0) {
        return `
            <tr>
                <td colspan="5" class="text-center py-5" style="font-size:16px;">
                    <div class="text-muted">
                        <div style="font-size: 32px;">📵</div>
                        <strong>Tidak ada device ditemukan</strong><br>
                        <small>Silakan klik <b>“Scan Semua”</b> untuk mendeteksi device.</small>
                    </div>
                </td>
            </tr>
        `;
    }
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;

    return devices.slice(start, end).map((d, i) => `
    <tr>
        <td>${start + i + 1}</td>
        <td>${d.device}</td>
        <td>${d.brand} ${d.model}</td>
        <td>${d.username ?? "-"}</td>
        <td>
            <span class="badge ${d.loginScreen ? "bg-danger" : "bg-success"}">
                ${d.loginScreen ? "LOGIN SCREEN" : "LOGGED IN"}
            </span>
        </td>
        <td>
            <button class="btn btn-sm btn-outline-primary" onclick="scanOne('${d.device}')">🔄 Scan</button>
        </td>
    </tr>
`).join("");

}

async function exportExcel() {
    const result = await window.api.exportDevicesExcel(devices);

    if (result.success) {
        notify("success", "📁 File Excel berhasil dibuat:<br>" + result.path);
    } else {
        notify("failed", "❌ Gagal export: " + result.error);
    }
}

function pagination() {
    const totalPages = Math.ceil(devices.length / perPage);
    let buttons = "";

    for (let i = 1; i <= totalPages; i++) {
        buttons += `
            <button class="btn btn-sm ${i === currentPage ? "btn-primary" : "btn-outline-primary"}"
                onclick="changePage(${i})">${i}</button>
        `;
    }

    return `<div class="mt-3">${buttons}</div>`;
}

function changePage(page) {
    currentPage = page;
    loadDevicePage();
}

async function scanOne(id) {
    const btn = document.querySelector(`button[onclick="scanOne('${id}')"]`);
    const row = btn.closest("tr");

    row.innerHTML = `
        <td><div class="skeleton skel-small"></div></td>
        <td><div class="skeleton skel-line"></div></td>
        <td><div class="skeleton skel-line"></div></td>
        <td><div class="skeleton skel-status"></div></td>
        <td><div class="skeleton skel-btn"></div></td>
    `;

    const res = await window.api.scanOne(id);

    const idx = devices.findIndex(x => x.device === id);
    if (idx !== -1) devices[idx] = res;

    sessionStorage.setItem("devices", JSON.stringify(devices));

    loadDevicePage();
}


async function scanAllAgain() {
    const container = document.getElementById("pageContainer");
    const btn = document.querySelector("button[onclick='scanAllAgain()']");

    btn.disabled = true;
    btn.innerHTML = "⏳ Scanning...";
    container.innerHTML = generateSkeletonTable(10);

    const result = await window.api.scanFull();

    devices = result;
    sessionStorage.setItem("devices", JSON.stringify(result));

    btn.disabled = false;
    btn.innerHTML = "🔄 Scan Semua";

    loadDevicePage();
}

function generateSkeletonTable(rows = 5) {
    let html = `
        <div class="table-container">
            <div class="d-flex justify-content-between mb-3">
                <h4>📱 Device Terdeteksi (loading...)</h4>
                <button class="btn btn-secondary" disabled>⏳ Loading...</button>
            </div>

            <table class="table">
                <thead class="table-dark">
                    <tr>
                        <th>No</th><th>Nama HP</th><th>Username IG</th><th>Status Login</th><th>Scan</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (let i = 0; i < rows; i++) {
        html += `
            <tr>
                <td><div class="skeleton skel-small"></div></td>
                <td><div class="skeleton skel-line"></div></td>
                <td><div class="skeleton skel-line"></div></td>
                <td><div class="skeleton skel-status"></div></td>
                <td><div class="skeleton skel-btn"></div></td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    return html;
}

function setBreadcrumb(text) {
    document.getElementById("breadcrumb").innerText = text;
}

function highlightSidebar(page) {
    document.querySelectorAll(".sidebar-item").forEach(i =>
        i.classList.remove("active")
    );
    const el = document.querySelector(`.sidebar-item[data-page="${page}"]`);
    if (el) el.classList.add("active");
}

function bindFormEvents() {
    const page = document.querySelector("#pageContainer");
    if (page.querySelector("#submitLike")) {
        const inputCount = page.querySelector("#count");
        if (inputCount) {
            const totalDevices = devices.length || 0;
            inputCount.max = totalDevices;
            inputCount.placeholder = `Max ${totalDevices}`;
        }
        page.querySelector("#submitLike").onclick = async () => {
            const url = page.querySelector("#url").value.trim();
            const count = Number(page.querySelector("#count").value);
            const delay = Number(page.querySelector("#delay").value);
            const random = Number(page.querySelector("#random").value);
            const status = page.querySelector("#status");
            if (count > devices.length) {
                notify("warning", `Jumlah Like melebihi jumlah device (${devices.length})`);
                return;
            }

            status.innerHTML = "⏳ Menjalankan LIKE...";
            const isValid = await window.license.validate();

            if (!isValid.success) {
                notify("failed", "❌ Lisensi tidak valid / expired!");
                openLicenseModal();
                return;
            }
            const results = await window.api.likeMultiple(url, count, delay, random);
            const successCount = results.filter(r => r.status === "SUCCESS").length;
            const alreadyCount = results.filter(r => r.status === "ALREADY").length;
            const failedCount = results.filter(r => r.status === "FAILED").length;
            if (successCount > 0) {
                notify("success", `❤️ Berhasil LIKE di ${successCount} device`);
            }
            if (alreadyCount > 0) {
                notify("warning", `⚠️ Postingan sudah pernah dilike di ${alreadyCount} device`);
            }
            if (failedCount > 0) {
                notify("failed", `❌ LIKE gagal di ${failedCount} device`);
            }

            status.innerHTML = "";
        };

    }

    if (page.querySelector("#submitComment")) {
        const inputCount = page.querySelector("#count");
        if (inputCount) {
            const totalDevices = devices.length || 0;
            inputCount.max = totalDevices;
            inputCount.placeholder = `Max ${totalDevices}`;
        }
        page.querySelector("#submitComment").onclick = async () => {
            const url = page.querySelector("#url").value.trim();
            const raw = page.querySelector("#comments").value.trim();
            const comments = raw.split("\n").map(x => x.trim()).filter(x => x);

            const count = Number(page.querySelector("#count").value);
            const delay = Number(page.querySelector("#delay").value);
            const random = Number(page.querySelector("#random").value);
            const status = page.querySelector("#status");
            if (count > devices.length) {
                notify("warning", `Jumlah Komentar melebihi jumlah device (${devices.length})`);
                return;
            }
            status.innerHTML = "⏳ Mengirim komentar...";
            const isValid = await window.license.validate();

            if (!isValid.success) {
                notify("failed", "❌ Lisensi tidak valid / expired!");
                openLicenseModal();
                return;
            }
            const results = await window.api.commentMultiple(url, comments, count, delay, random);
            const successCount = results.filter(r => r.status === "SUCCESS").length;
            const alreadyCount = results.filter(r => r.status === "ALREADY").length;
            const failedCount = results.filter(r => r.status === "FAILED").length;
            if (successCount > 0) {
                notify("success", `❤️ Berhasil Comment di ${successCount} device`);
            }
            if (alreadyCount > 0) {
                notify("warning", `⚠️ Postingan sudah pernah Comment di ${alreadyCount} device`);
            }
            if (failedCount > 0) {
                notify("failed", `❌ Comment gagal di ${failedCount} device`);
            }

            status.innerHTML = "";
        };
    }

    if (page.querySelector("#submitFollow")) {
        const inputCount = page.querySelector("#count");
        if (inputCount) {
            const totalDevices = devices.length || 0;
            inputCount.max = totalDevices;
            inputCount.placeholder = `Max ${totalDevices}`;
        }
        page.querySelector("#submitFollow").onclick = async () => {
            const url = page.querySelector("#url").value.trim();
            const count = Number(page.querySelector("#count").value);
            const delay = Number(page.querySelector("#delay").value);
            const random = Number(page.querySelector("#random").value);
            const status = page.querySelector("#status");
            if (count > devices.length) {
                notify("warning", `Jumlah Follow melebihi jumlah device (${devices.length})`);
                return;
            }
            status.innerHTML = "⏳ Menjalankan FOLLOW...";
            const isValid = await window.license.validate();

            if (!isValid.success) {
                notify("failed", "❌ Lisensi tidak valid / expired!");
                openLicenseModal();
                return;
            }
            const results = await window.api.followMultiple(url, count, delay, random);
            const successCount = results.filter(r => r.status === "SUCCESS").length;
            const alreadyCount = results.filter(r => r.status === "ALREADY").length;
            const failedCount = results.filter(r => r.status === "FAILED").length;
            if (successCount > 0) {
                notify("success", `❤️ Berhasil Follow di ${successCount} device`);
            }
            if (alreadyCount > 0) {
                notify("warning", `⚠️ Sudah pernah Follow di ${alreadyCount} device`);
            }
            if (failedCount > 0) {
                notify("failed", `❌ Follow gagal di ${failedCount} device`);
            }

            status.innerHTML = "";
        };
    }
}

async function loadReportPage() {
    setBreadcrumb("Dashboard / Report Log");
    highlightSidebar("report");
    await loadComponent("report.html");
    const logs = await window.api.getLogData();

    const tbody = document.getElementById("reportRows");

    if (!logs || logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    Tidak ada log aktivitas.
                </td>
            </tr>
        `;
        return;
    }
    let rows = logs.slice().reverse().map((l, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${l.time}</td>
            <td>${l.identity}</td>
            <td>${l.action}</td>
            <td>
                <span class="badge ${l.status === "SUCCESS"
            ? "bg-success"
            : l.status === "FAILED"
                ? "bg-danger"
                : "bg-secondary"
        }">${l.status}</span>
            </td>
            <td>
                <a href="${l.url}" class="btn btn-sm btn-primary" target="_blank">
                    Lihat Postingan
                </a>
            </td>
        </tr>
    `).join("");

    tbody.innerHTML = rows;
}


function notify(type, message) {
    const container = document.getElementById("notifyContainer");

    const box = document.createElement("div");
    box.className = `notify-box notify-${type}`;
    box.innerHTML = message;

    container.appendChild(box);

    setTimeout(() => {
        box.remove();
    }, 6000);
}

loadPage("devices");
