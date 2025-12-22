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
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const fileBrowser = document.getElementById('file-browser');
    const importFileBtn = document.getElementById('import-file-btn');
    const fileUploadInput = document.getElementById('file-upload-input');
    const exportFilesBtn = document.getElementById('export-files-btn');
    const deleteFilesBtn = document.getElementById('delete-files-btn');

    let currentFileName = null;

    toggleSidebarBtn.addEventListener('click', () => {
        fileBrowser.classList.toggle('collapsed');
    });

    function truncateFilename(name, maxLength = 20) {
        if (name.length <= maxLength) {
            return name;
        }
        const startLength = Math.floor((maxLength - 3) / 2);
        const endLength = Math.ceil((maxLength - 3) / 2);
        return name.substring(0, startLength) + '...' + name.substring(name.length - endLength);
    }

    function createFileListItem(filename) {
        const listItem = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.filename = filename;
        listItem.appendChild(checkbox);
        const label = document.createElement('span');
        const truncatedName = truncateFilename(filename);
        label.textContent = truncatedName;
        if (truncatedName !== filename) {
            label.title = filename;
        }
        listItem.appendChild(label);
        listItem.classList.add('file');
        listItem.dataset.filename = filename;
        listItem.addEventListener('click', async (event) => {
            event.stopPropagation();
            await loadFile(filename);
        });

        const downloadIcon = document.createElement('span');
        downloadIcon.textContent = '📥';
        downloadIcon.classList.add('download-icon');
        downloadIcon.title = 'Download File';
        downloadIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            window.location.href = `/api/download/${filename}`;
        });
        listItem.appendChild(downloadIcon);

        return listItem;
    }

    async function renderFileList() {
        try {
            const response = await fetch('/api/files');
            const files = await response.json();
            fileListContainer.innerHTML = '';
            files.forEach(filename => {
                fileListContainer.appendChild(createFileListItem(filename));
            });
        } catch (error) {
            console.error('Error fetching file list:', error);
        }
    }

    async function loadFile(filename) {
        try {
            const response = await fetch(`/api/files/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const contents = await response.text();
            editor.value = contents;
            currentFileName = filename;
            saveBtn.textContent = 'Save File';
        } catch (error) {
            console.error('Error loading file:', error);
            editor.value = `Error loading file: ${filename}`;
        }
    }

    saveBtn.addEventListener('click', async () => {
        if (!currentFileName) {
            alert('Please select a file to save.');
            return;
        }
        try {
            const response = await fetch(`/api/files/${currentFileName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: editor.value
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            alert('File saved successfully!');
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file. See console for details.');
        }
    });

    importFileBtn.addEventListener('click', () => {
        fileUploadInput.click();
    });

    fileUploadInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length === 0) return;

        const formData = new FormData();
        for (const file of files) {
            formData.append('file', file);
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            await renderFileList();
            alert('File(s) uploaded successfully!');
        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Error uploading files. See console for details.');
        }
        // Reset the input
        fileUploadInput.value = '';
    });

    exportFilesBtn.addEventListener('click', () => {
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('input[type="checkbox"]:checked');
        if (selectedFilesCheckboxes.length === 0) {
            alert('Please select at least one file to export.');
            return;
        }
        selectedFilesCheckboxes.forEach(checkbox => {
            const filename = checkbox.dataset.filename;
            window.open(`/api/download/${filename}`, '_blank');
        });
    });

    deleteFilesBtn.addEventListener('click', async () => {
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('input[type="checkbox"]:checked');
        if (selectedFilesCheckboxes.length === 0) {
            alert('Please select at least one file to delete.');
            return;
        }

        if (!confirm('Are you sure you want to delete the selected files?')) {
            return;
        }

        const promises = [];
        selectedFilesCheckboxes.forEach(checkbox => {
            const filename = checkbox.dataset.filename;
            promises.push(fetch(`/api/files/${filename}`, {
                method: 'DELETE'
            }));
        });

        try {
            const responses = await Promise.all(promises);
            const success = responses.every(res => res.ok);
            if (success) {
                await renderFileList();
                alert('Selected files deleted successfully.');
            } else {
                alert('Some files could not be deleted. Please check the console for details.');
            }
        } catch (error) {
            console.error('Error deleting files:', error);
            alert('An error occurred while deleting files.');
        }
    });

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
                li.dataset.filename = file.name;
                li.addEventListener('click', async () => {
                    await loadFile(file.name);
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
                name: checkbox.dataset.filename
            };
            if (!targetSetList.some(f => f.name === file.name)) {
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

    renderFileList();
    updateUI();
});