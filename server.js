const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;
const txtLibraryPath = path.join(__dirname, 'txt_library');

// Ensure the txt_library directory exists
if (!fs.existsSync(txtLibraryPath)) {
    fs.mkdirSync(txtLibraryPath);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, txtLibraryPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

const sanitizeFilename = (req, res, next) => {
    const { filename } = req.params;
    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
        return res.status(400).send('Invalid filename.');
    }
    req.sanitizedFilename = sanitizedFilename;
    next();
};

app.use(express.static(__dirname));
app.use(express.json());

// API to list files
app.get('/api/files', (req, res) => {
    fs.readdir(txtLibraryPath, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        const textFiles = files.filter(file => path.extname(file).toLowerCase() === '.txt');
        res.send(textFiles);
    });
});

// API to get file content
app.get('/api/files/:filename', sanitizeFilename, (req, res) => {
    const filePath = path.join(txtLibraryPath, req.sanitizedFilename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading file: ' + err);
        }
        res.send(data);
    });
});

// API to save file content
app.post('/api/files/:filename', sanitizeFilename, (req, res) => {
    const filePath = path.join(txtLibraryPath, req.sanitizedFilename);

    fs.writeFile(filePath, req.body.content, 'utf8', (err) => {
        if (err) {
            return res.status(500).send('Error writing file: ' + err);
        }
        res.send({ message: 'File saved successfully' });
    });
});

// API for file upload
app.post('/api/upload', upload.array('file'), (req, res) => {
    res.send({
        message: `${req.files.length} files uploaded successfully`
    });
});

// API for file download
app.get('/api/download/:filename', sanitizeFilename, (req, res) => {
    const filePath = path.join(txtLibraryPath, req.sanitizedFilename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    res.download(filePath, req.sanitizedFilename, (err) => {
        if (err) {
            res.status(500).send('Error downloading file: ' + err);
        }
    });
});

// API for file deletion
app.delete('/api/files/:filename', sanitizeFilename, (req, res) => {
    const filePath = path.join(txtLibraryPath, req.sanitizedFilename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).send('Error deleting file: ' + err);
        }
        res.send({ message: 'File deleted successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
