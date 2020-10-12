const fs = require('fs');

function readJson (filePath) {
    const fs = require('fs');
    return JSON.parse(
        fs.readFileSync(filePath)
    );
}

exports.readJson = readJson;