document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-btn');
    const editor = document.getElementById('editor');
    const settingsIcon = document.getElementById('settings-icon');
    const settingsModal = document.getElementById('settings-modal');
    const closeButton = document.querySelector('.close-button');

    settingsIcon.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const fontSelect = document.getElementById('font-select');
    const body = document.body;

    darkModeToggle.addEventListener('change', () => {
        body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
    });

    fontSelect.addEventListener('change', () => {
        editor.style.fontFamily = fontSelect.value;
        localStorage.setItem('editorFont', fontSelect.value);
    });

    // Load settings from localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const editorFont = localStorage.getItem('editorFont');

    if (darkMode) {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    // Set the body font to sans-serif by default
    body.style.fontFamily = 'sans-serif';

    if (editorFont) {
        editor.style.fontFamily = editorFont;
        fontSelect.value = editorFont;
    }

    const fileListContainer = document.getElementById('file-list');
    const selectDirBtn = document.getElementById('select-dir-btn');

    let currentFileHandle = null;

    // IndexedDB helper functions
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('file-reader-db', 1);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function set(key, value) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('handles', 'readwrite');
            const store = transaction.objectStore('handles');
            const request = store.put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async function get(key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction('handles', 'readonly');
            const store = transaction.objectStore('handles');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Function to verify permission for a stored handle
    async function verifyPermission(fileHandle, readWrite) {
        const options = {};
        if (readWrite) {
            options.mode = 'readwrite';
        }
        // Check if permission was already granted. If so, return true.
        if ((await fileHandle.queryPermission(options)) === 'granted') {
            return true;
        }
        // Request permission. If the user grants it, return true.
        if ((await fileHandle.requestPermission(options)) === 'granted') {
            return true;
        }
        // The user didn't grant permission, so return false.
        return false;
    }

    function truncateFilename(name, maxLength = 20) {
        if (name.length <= maxLength) {
            return name;
        }
        const startLength = Math.floor((maxLength - 3) / 2);
        const endLength = Math.ceil((maxLength - 3) / 2);
        return name.substring(0, startLength) + '...' + name.substring(name.length - endLength);
    }

    async function renderFileList(directoryHandle, parentElement) {
        const list = document.createElement('ul');

        for await (const entry of directoryHandle.values()) {
            const listItem = document.createElement('li');

            if (entry.kind === 'directory') {
                listItem.textContent = entry.name;
                listItem.classList.add('directory');
                const childrenList = document.createElement('ul');
                childrenList.classList.add('nested');
                listItem.appendChild(childrenList);

                listItem.addEventListener('click', async (event) => {
                    event.stopPropagation();
                    if (!childrenList.classList.contains('populated')) {
                        await renderFileList(entry, childrenList);
                        childrenList.classList.add('populated');
                    }
                    childrenList.classList.toggle('active');
                    listItem.classList.toggle('expanded');
                });
            } else {
                const truncatedName = truncateFilename(entry.name);
                listItem.textContent = truncatedName;
                if (truncatedName !== entry.name) {
                    listItem.title = entry.name;
                }
                listItem.classList.add('file');
                listItem.addEventListener('click', async (event) => {
                    event.stopPropagation();
                    await loadFile(entry);
                });
            }
            list.appendChild(listItem);
        }
        parentElement.appendChild(list);
    }

    selectDirBtn.addEventListener('click', async () => {
        try {
            const directoryHandle = await window.showDirectoryPicker();
            await set('directoryHandle', directoryHandle);
            fileListContainer.innerHTML = '';
            await renderFileList(directoryHandle, fileListContainer);
        } catch (error) {
            console.error('Error selecting directory:', error);
        }
    });

    async function loadFile(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            const contents = await file.text();
            editor.value = contents;
            currentFileHandle = fileHandle;
            saveBtn.textContent = 'Save File';
        } catch (error) {
            console.error('Error loading file:', error);
            editor.value = `Error loading file: ${fileHandle.name}`;
        }
    }

    saveBtn.addEventListener('click', async () => {
        if (!currentFileHandle) {
            alert('Please select a file to save.');
            return;
        }

        try {
            const writable = await currentFileHandle.createWritable();
            await writable.write(editor.value);
            await writable.close();
            alert('File saved successfully!');
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file. See console for details.');
        }
    });

    async function loadInitialDirectory() {
        try {
            const directoryHandle = await get('directoryHandle');
            if (directoryHandle) {
                const hasPermission = await verifyPermission(directoryHandle);
                if (hasPermission) {
                    fileListContainer.innerHTML = '';
                    await renderFileList(directoryHandle, fileListContainer);
                }
            }
        } catch (error) {
            console.error('Error loading initial directory:', error);
        }
    }

    loadInitialDirectory();
});