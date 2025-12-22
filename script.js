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
    let fileHandlesMap = new Map();

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

    async function verifyPermission(fileHandle, readWrite) {
        const options = {};
        if (readWrite) {
            options.mode = 'readwrite';
        }
        if ((await fileHandle.queryPermission(options)) === 'granted') {
            return true;
        }
        if ((await fileHandle.requestPermission(options)) === 'granted') {
            return true;
        }
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
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.filePath = relativePath;
        checkbox.dataset.fileName = entry.name;
        checkbox.addEventListener('click', (e) => e.stopPropagation());
        listItem.appendChild(checkbox);
        const label = document.createElement('span');
        const truncatedName = truncateFilename(entry.name);
        label.textContent = truncatedName;
        if (truncatedName !== entry.name) {
            label.title = entry.name;
        }
        listItem.appendChild(label);
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
                fileHandlesMap.set(newPath, entry);
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
                return {
                    offset: offset,
                    element: child
                };
            } else {
                return closest;
            }
        }, {
            offset: Number.NEGATIVE_INFINITY
        }).element;
    }

    selectDirBtn.addEventListener('click', async () => {
        try {
            const directoryHandle = await window.showDirectoryPicker();
            await set('directoryHandle', directoryHandle);
            fileListContainer.innerHTML = '';
            pathToUlMap = {};
            fileHandlesMap.clear();
            const rootUl = document.createElement('ul');
            fileListContainer.appendChild(rootUl);
            await renderFileList(directoryHandle, rootUl);
        } catch (error) {
            console.error('Error selecting directory:', error);
        }
    });

    async function loadFile(fileHandleOrPath) {
        let fileHandle;
        if (typeof fileHandleOrPath === 'string') {
            fileHandle = fileHandlesMap.get(fileHandleOrPath);
            if (!fileHandle) {
                console.error(`File handle not found for path: ${fileHandleOrPath}`);
                editor.value = `Error: Could not find the file at path ${fileHandleOrPath}.`;
                return;
            }
        } else {
            fileHandle = fileHandleOrPath;
        }
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
                    fileHandlesMap.clear();
                    const rootUl = document.createElement('ul');
                    fileListContainer.appendChild(rootUl);
                    await renderFileList(directoryHandle, rootUl);
                }
            }
        } catch (error) {
            console.error('Error loading initial directory:', error);
        }
    }

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

    const createSetListBtn = document.getElementById('create-set-list-btn');
    const setListNameInput = document.getElementById('set-list-name');
    const addToSetListSelect = document.getElementById('add-to-set-list-select');
    const addToSetListBtn = document.getElementById('add-to-set-list-btn');
    const setListSelect = document.getElementById('set-list-select');
    const deleteSetListBtn = document.getElementById('delete-set-list-btn');
    const setListFilesContainer = document.getElementById('set-list-files');
    const importSetListsBtn = document.getElementById('import-set-lists-btn');
    const exportSetListsBtn = document.getElementById('export-set-lists-btn');

    function getSetLists() {
        return JSON.parse(localStorage.getItem('setLists')) || {};
    }

    function saveSetLists(setLists) {
        localStorage.setItem('setLists', JSON.stringify(setLists));
    }

    function renderSelectedSetListFiles() {
        const selectedSetListName = setListSelect.value;
        const setLists = getSetLists();
        const files = setLists[selectedSetListName] || [];
        setListFilesContainer.innerHTML = '';
        if (files.length === 0) {
            const li = document.createElement('li');
            li.textContent = '(No files in this set list)';
            li.classList.add('empty-set-list');
            setListFilesContainer.appendChild(li);
        } else {
            files.forEach((file, index) => {
                const li = document.createElement('li');
                li.textContent = truncateFilename(file.name);
                if (truncateFilename(file.name) !== file.name) {
                    li.title = file.name;
                }
                li.classList.add('file');
                li.dataset.filePath = file.path;
                li.addEventListener('click', async () => {
                    await loadFile(file.path);
                });
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'x';
                removeBtn.classList.add('remove-from-set-list-btn');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeFileFromSetList(selectedSetListName, index);
                });
                li.appendChild(removeBtn);
                setListFilesContainer.appendChild(li);
            });
        }
    }
    setListSelect.addEventListener('change', renderSelectedSetListFiles);

    function removeFileFromSetList(setListName, fileIndex) {
        const setLists = getSetLists();
        if (setLists[setListName]) {
            setLists[setListName].splice(fileIndex, 1);
            saveSetLists(setLists);
            renderSelectedSetListFiles();
        }
    }

    function populateSetListSelects() {
        const setLists = getSetLists();
        const currentSetList = setListSelect.value;
        addToSetListSelect.innerHTML = '';
        setListSelect.innerHTML = '';
        const noListOptionForAdd = document.createElement('option');
        noListOptionForAdd.value = "";
        noListOptionForAdd.textContent = "Select a set list";
        addToSetListSelect.appendChild(noListOptionForAdd);
        if (Object.keys(setLists).length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No set lists created';
            option.disabled = true;
            setListSelect.appendChild(option);
        } else {
            for (const name in setLists) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                addToSetListSelect.appendChild(option.cloneNode(true));
                setListSelect.appendChild(option);
            }
        }
        setListSelect.value = currentSetList;
    }

    function updateUI() {
        populateSetListSelects();
        renderSelectedSetListFiles();
    }

    createSetListBtn.addEventListener('click', () => {
        const name = setListNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for the set list.');
            return;
        }
        const setLists = getSetLists();
        if (setLists[name]) {
            alert('A set list with this name already exists.');
            return;
        }
        setLists[name] = [];
        saveSetLists(setLists);
        setListNameInput.value = '';
        populateSetListSelects();
        setListSelect.value = name;
        renderSelectedSetListFiles();
        alert('Set list created!');
    });

    addToSetListBtn.addEventListener('click', () => {
        const selectedSetListName = addToSetListSelect.value;
        if (!selectedSetListName) {
            alert('Please select a set list to add files to.');
            return;
        }
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('input[type="checkbox"]:checked');
        if (selectedFilesCheckboxes.length === 0) {
            alert('Please select at least one file to add.');
            return;
        }
        const setLists = getSetLists();
        const targetSetList = setLists[selectedSetListName];
        selectedFilesCheckboxes.forEach(checkbox => {
            const file = {
                path: checkbox.dataset.filePath,
                name: checkbox.dataset.fileName
            };
            if (!targetSetList.some(f => f.path === file.path)) {
                targetSetList.push(file);
            }
            checkbox.checked = false;
        });
        saveSetLists(setLists);
        if (setListSelect.value === selectedSetListName) {
            renderSelectedSetListFiles();
        }
        alert(`Added ${selectedFilesCheckboxes.length} file(s) to ${selectedSetListName}.`);
    });

    deleteSetListBtn.addEventListener('click', () => {
        const name = setListSelect.value;
        if (!name) {
            alert('Please select a set list to delete.');
            return;
        }
        if (!confirm(`Are you sure you want to delete the set list "${name}"?`)) {
            return;
        }
        const setLists = getSetLists();
        delete setLists[name];
        saveSetLists(setLists);
        updateUI();
        alert('Set list deleted!');
    });

    exportSetListsBtn.addEventListener('click', () => {
        const setLists = getSetLists();
        if (Object.keys(setLists).length === 0) {
            alert('There are no set lists to export.');
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(setLists, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "set-lists.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        alert('Set lists exported successfully!');
    });

    importSetListsBtn.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedSetLists = JSON.parse(e.target.result);
                    const existingSetLists = getSetLists();
                    const mergedSetLists = { ...existingSetLists,
                        ...importedSetLists
                    };
                    saveSetLists(mergedSetLists);
                    updateUI();
                    alert('Set lists imported successfully!');
                } catch (error) {
                    alert('Error importing set lists. Please make sure the file is a valid JSON file.');
                    console.error('Error parsing JSON:', error);
                }
            };
            reader.readAsText(file);
        };
        fileInput.click();
    });
    loadInitialDirectory();
    updateUI();
});