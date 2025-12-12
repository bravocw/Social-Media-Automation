const fs = require("fs");
const path = require("path");

const packagePath = path.join(__dirname, "package.json");
const packageData = JSON.parse(fs.readFileSync(packagePath, "utf8"));

function incrementVersion(version) {
    let [major, minor, patch] = version.split(".").map(Number);

    patch++;

    if (patch > 30) {
        patch = 1;
        minor++;

        if (minor > 30) {
            minor = 1;
            major++;
        }
    }

    return `${major}.${minor}.${patch}`;
}

packageData.version = incrementVersion(packageData.version);

fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
console.log("✔ Version updated to:", packageData.version);
