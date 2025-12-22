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
    const increaseFontSizeBtn = document.getElementById('increase-font-size-btn');
    const decreaseFontSizeBtn = document.getElementById('decrease-font-size-btn');
    const toggleFullscreenBtn = document.getElementById('toggle-fullscreen-btn');
    const backgroundColorPicker = document.getElementById('background-color-picker');
    const textColorPicker = document.getElementById('text-color-picker');
    const boldBtn = document.getElementById('bold-btn');

    editor.addEventListener('keydown', (event) => {
        if (event.key === 'PageUp') {
            event.preventDefault();
            editor.scrollTop -= editor.clientHeight;
        } else if (event.key === 'PageDown') {
            event.preventDefault();
            editor.scrollTop += editor.clientHeight;
        }
    });

    backgroundColorPicker.addEventListener('input', () => {
        editor.style.backgroundColor = backgroundColorPicker.value;
        localStorage.setItem('editorBackgroundColor', backgroundColorPicker.value);
    });

    textColorPicker.addEventListener('input', () => {
        editor.style.color = textColorPicker.value;
        localStorage.setItem('editorTextColor', textColorPicker.value);
    });

    boldBtn.addEventListener('click', () => {
        const isBold = editor.style.fontWeight === 'bold';
        editor.style.fontWeight = isBold ? 'normal' : 'bold';
        localStorage.setItem('editorBold', !isBold);
    });

    darkModeToggle.addEventListener('change', () => {
        body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
    });

    fontSelect.addEventListener('change', () => {
        editor.style.fontFamily = fontSelect.value;
        localStorage.setItem('editorFont', fontSelect.value);
    });

    let currentFontSize = localStorage.getItem('fontSize') ? parseInt(localStorage.getItem('fontSize')) : 16;
    editor.style.fontSize = `${currentFontSize}px`;

    increaseFontSizeBtn.addEventListener('click', () => {
        currentFontSize += 2;
        editor.style.fontSize = `${currentFontSize}px`;
        localStorage.setItem('fontSize', currentFontSize);
    });

    decreaseFontSizeBtn.addEventListener('click', () => {
        currentFontSize = Math.max(8, currentFontSize - 2);
        editor.style.fontSize = `${currentFontSize}px`;
        localStorage.setItem('fontSize', currentFontSize);
    });

    toggleFullscreenBtn.addEventListener('click', () => {
        const container = document.querySelector('.container');
        container.classList.toggle('fullscreen');
    });

    // Load settings from localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const editorFont = localStorage.getItem('editorFont');
    const editorBackgroundColor = localStorage.getItem('editorBackgroundColor');
    const editorTextColor = localStorage.getItem('editorTextColor');
    const editorBold = localStorage.getItem('editorBold') === 'true';

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

    if (editorBackgroundColor) {
        editor.style.backgroundColor = editorBackgroundColor;
        backgroundColorPicker.value = editorBackgroundColor;
    }

    if (editorTextColor) {
        editor.style.color = editorTextColor;
        textColorPicker.value = editorTextColor;
    }

    if (editorBold) {
        editor.style.fontWeight = 'bold';
    }

    const fileListContainer = document.getElementById('file-list');
    const selectDirBtn = document.getElementById('select-dir-btn');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const fileBrowser = document.getElementById('file-browser');

    toggleSidebarBtn.addEventListener('click', () => {
        fileBrowser.classList.toggle('collapsed');
    });

    let currentFileHandle = null;
    let pathToUlMap = {};

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

    function createFileListItem(entry, relativePath) {
        const listItem = document.createElement('li');
        const truncatedName = truncateFilename(entry.name);
        listItem.textContent = truncatedName;
        if (truncatedName !== entry.name) {
            listItem.title = entry.name;
        }
        listItem.classList.add('file');
        listItem.draggable = true;
        listItem.dataset.filePath = relativePath;
        listItem.addEventListener('click', async (event) => {
            event.stopPropagation();
            await loadFile(entry);
        });
        return listItem;
    }

    async function renderFileList(directoryHandle, listElement, currentPath = '') {
        listElement.innerHTML = '';
        pathToUlMap[currentPath] = listElement;

        for await (const entry of directoryHandle.values()) {
            const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'directory') {
                const listItem = document.createElement('li');
                listItem.textContent = entry.name;
                listItem.classList.add('directory');
                const childrenList = document.createElement('ul');
                childrenList.classList.add('nested');
                listItem.appendChild(childrenList);
                pathToUlMap[newPath] = childrenList;

                listItem.addEventListener('click', async (event) => {
                    event.stopPropagation();
                    if (!childrenList.classList.contains('populated')) {
                        await renderFileList(entry, childrenList, newPath);
                        childrenList.classList.add('populated');
                    }
                    childrenList.classList.toggle('active');
                    listItem.classList.toggle('expanded');
                });
                listElement.appendChild(listItem);
            } else {
                listElement.appendChild(createFileListItem(entry, newPath));
            }
        }
    }

    let draggedItem = null;

    fileListContainer.addEventListener('dragstart', (event) => {
        draggedItem = event.target;
        setTimeout(() => {
            event.target.style.display = 'none';
        }, 0);
    });

    fileListContainer.addEventListener('dragend', (event) => {
        setTimeout(() => {
            draggedItem.style.display = '';
            draggedItem = null;
        }, 0);
    });

    fileListContainer.addEventListener('dragover', (event) => {
        event.preventDefault();
        const container = draggedItem.closest('ul');
        const afterElement = getDragAfterElement(container, event.clientY);
        if (afterElement == null) {
            container.appendChild(draggedItem);
        } else {
            container.insertBefore(draggedItem, afterElement);
        }
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    selectDirBtn.addEventListener('click', async () => {
        try {
            const directoryHandle = await window.showDirectoryPicker();
            await set('directoryHandle', directoryHandle);
            fileListContainer.innerHTML = '';
            pathToUlMap = {};
            const rootUl = document.createElement('ul');
            fileListContainer.appendChild(rootUl);
            await renderFileList(directoryHandle, rootUl);
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
                    pathToUlMap = {};
                    const rootUl = document.createElement('ul');
                    fileListContainer.appendChild(rootUl);
                    await renderFileList(directoryHandle, rootUl);
                }
            }
        } catch (error) {
            console.error('Error loading initial directory:', error);
        }
    }

    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabName = tab.dataset.tab;
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-content`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Set List functionality
    const saveSetListBtn = document.getElementById('save-set-list-btn');
    const setListNameInput = document.getElementById('set-list-name');
    const setListSelect = document.getElementById('set-list-select');
    const loadSetListBtn = document.getElementById('load-set-list-btn');
    const deleteSetListBtn = document.getElementById('delete-set-list-btn');

    function getSetLists() {
        return JSON.parse(localStorage.getItem('setLists')) || {};
    }

    function saveSetLists(setLists) {
        localStorage.setItem('setLists', JSON.stringify(setLists));
    }

    function populateSetLists() {
        const setLists = getSetLists();
        setListSelect.innerHTML = '';
        for (const name in setLists) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            setListSelect.appendChild(option);
        }
    }

    saveSetListBtn.addEventListener('click', () => {
        const name = setListNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for the set list.');
            return;
        }

        const fileOrder = [...fileListContainer.querySelectorAll('li.file')].map(li => li.dataset.filePath);
        const setLists = getSetLists();
        setLists[name] = fileOrder;
        saveSetLists(setLists);
        populateSetLists();
        setListNameInput.value = '';
        alert('Set list saved!');
    });

    async function getFileHandlesRecursive(directoryHandle, path = '') {
        const fileHandles = new Map();
        for await (const entry of directoryHandle.values()) {
            const newPath = path ? `${path}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
                fileHandles.set(newPath, entry);
            } else if (entry.kind === 'directory') {
                const nestedFileHandles = await getFileHandlesRecursive(entry, newPath);
                for (const [nestedPath, handle] of nestedFileHandles.entries()) {
                    fileHandles.set(nestedPath, handle);
                }
            }
        }
        return fileHandles;
    }

    loadSetListBtn.addEventListener('click', async () => {
        const name = setListSelect.value;
        if (!name) {
            alert('Please select a set list to load.');
            return;
        }

        const setLists = getSetLists();
        const fileOrder = setLists[name];

        const fileLiMap = new Map();
        document.querySelectorAll('#file-list li.file').forEach(li => {
            fileLiMap.set(li.dataset.filePath, li);
            li.remove();
        });

        fileOrder.forEach(filePath => {
            const parentPath = filePath.substring(0, filePath.lastIndexOf('/')) || '';
            const ul = pathToUlMap[parentPath];
            const li = fileLiMap.get(filePath);
            if (ul && li) {
                ul.appendChild(li);
                fileLiMap.delete(filePath);
            }
        });

        // Append any remaining files that were not in the set list
        for (const [filePath, li] of fileLiMap.entries()) {
            const parentPath = filePath.substring(0, filePath.lastIndexOf('/')) || '';
            const ul = pathToUlMap[parentPath];
            if (ul) {
                ul.appendChild(li);
            }
        }
    });

    deleteSetListBtn.addEventListener('click', () => {
        const name = setListSelect.value;
        if (!name) {
            alert('Please select a set list to delete.');
            return;
        }

        const setLists = getSetLists();
        delete setLists[name];
        saveSetLists(setLists);
        populateSetLists();
        alert('Set list deleted!');
    });

    loadInitialDirectory();
    populateSetLists();
});