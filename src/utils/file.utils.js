const fs = require("fs");
const path = require("path");

function readJson(filePath) {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath));
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readJson, writeJson };
