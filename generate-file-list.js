const fs = require('fs');
const path = require('path');

const libraryDir = path.join(__dirname, 'txt_library');
const outputFile = path.join(__dirname, 'file-list.json');

function getDirectoryStructure(dirPath) {
    const items = fs.readdirSync(dirPath);
    const structure = [];

    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            structure.push({
                name: item,
                type: 'directory',
                children: getDirectoryStructure(itemPath)
            });
        } else if (item.endsWith('.txt')) {
            structure.push({
                name: item,
                type: 'file'
            });
        }
    }

    return structure;
}

const fileList = getDirectoryStructure(libraryDir);
fs.writeFileSync(outputFile, JSON.stringify(fileList, null, 2));

console.log('File list generated successfully.');
