document.addEventListener('DOMContentLoaded', () => {
    let allFiles = [];
    let allSetLists = {};
    let allTags = [];

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
    const importFilesBtn = document.getElementById('import-files-btn');
    const fileInput = document.getElementById('file-input');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const fileBrowser = document.getElementById('file-browser');
    const resizer = document.getElementById('resizer');
    const editorContainer = document.querySelector('.editor-container');

    toggleSidebarBtn.addEventListener('click', () => {
        fileBrowser.classList.toggle('collapsed');
    });

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
        });
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const newWidth = e.clientX;
        if (newWidth > 100 && newWidth < 500) {
            document.documentElement.style.setProperty('--file-browser-width', `${newWidth}px`);
            if (fileBrowser.classList.contains('collapsed')) {
                fileBrowser.classList.remove('collapsed');
            }
        }
    }

    let currentFileId = null;
    let currentSetListIndex = -1;

    const backBtn = document.getElementById('back-btn');
    const forwardBtn = document.getElementById('forward-btn');

    backBtn.addEventListener('click', () => {
        navigateSetList(-1);
    });

    forwardBtn.addEventListener('click', () => {
        navigateSetList(1);
    });

    function navigateSetList(direction) {
        const selectedSetListName = setListSelect.value;
        if (!selectedSetListName || !allSetLists[selectedSetListName]) {
            return;
        }

        const currentSetList = allSetLists[selectedSetListName];
        if (currentSetList.length === 0) {
            return;
        }

        if (currentSetListIndex === -1) {
            currentSetListIndex = currentSetList.findIndex(file => file.id === currentFileId);
        }

        currentSetListIndex += direction;

        if (currentSetListIndex < 0) {
            currentSetListIndex = currentSetList.length - 1;
        } else if (currentSetListIndex >= currentSetList.length) {
            currentSetListIndex = 0;
        }

        const nextFile = currentSetList[currentSetListIndex];
        if (nextFile) {
            loadFile(nextFile.id);
        }
    }

    importFilesBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            openAssignTagsModal(null, async (tags) => {
                for (const file of files) {
                    try {
                        await uploadFile(file, tags);
                    } catch (error) {
                        console.error('Error uploading file:', error);
                        alert(`Error uploading file: ${file.name}`);
                    }
                }
                alert('Files imported successfully!');
                [allFiles, allTags] = await Promise.all([getFiles(), getTags()]);
                renderFileList();
                renderTagsList();
                populateTagFilter();
            });
        }
    });

    function truncateFilename(name, maxLength = 20) {
        if (name.length <= maxLength) {
            return name;
        }
        const startLength = Math.floor((maxLength - 3) / 2);
        const endLength = Math.ceil((maxLength - 3) / 2);
        return name.substring(0, startLength) + '...' + name.substring(name.length - endLength);
    }

    function createFileListItem(file) {
        const listItem = document.createElement('li');

        const assignBtn = document.createElement('button');
        assignBtn.textContent = 'T';
        assignBtn.classList.add('assign-tags-btn-small');
        assignBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openAssignTagsModal(file.id);
        });
        listItem.appendChild(assignBtn);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.fileId = file.id;
        checkbox.dataset.fileName = file.name;
        checkbox.addEventListener('click', (e) => e.stopPropagation());
        listItem.appendChild(checkbox);

        const label = document.createElement('span');
        const truncatedName = truncateFilename(file.name);
        label.textContent = truncatedName;

        let titleText = file.name;
        if (file.tags && file.tags.length > 0) {
            titleText += `\nTags: ${file.tags.join(', ')}`;
        }
        label.title = titleText;

        listItem.appendChild(label);

        listItem.classList.add('file');
        listItem.dataset.fileId = file.id;
        listItem.addEventListener('click', async (event) => {
            event.stopPropagation();
            await loadFile(file.id);
        });

        return listItem;
    }

    function renderFileList(tagFilter = '') {
        try {
            let filteredFiles = allFiles;
            if (tagFilter) {
                filteredFiles = allFiles.filter(file => file.tags && file.tags.includes(tagFilter));
            }
            fileListContainer.innerHTML = '';
            const ul = document.createElement('ul');
            filteredFiles.forEach(file => {
                ul.appendChild(createFileListItem(file));
            });
            fileListContainer.appendChild(ul);
        } catch (error) {
            console.error('Error rendering file list:', error);
        }
    }


    async function loadFile(fileId) {
        try {
            const content = await getFileContent(fileId);
            editor.value = content;
            currentFileId = fileId;
            const selectedSetListName = setListSelect.value;
            if (selectedSetListName && allSetLists[selectedSetListName]) {
                currentSetListIndex = allSetLists[selectedSetListName].findIndex(file => file.id === fileId);
            } else {
                currentSetListIndex = -1;
            }
        } catch (error) {
            console.error('Error loading file:', error);
            editor.value = `Error loading file: ${fileId}`;
        }
    }

    saveBtn.addEventListener('click', async () => {
        if (!currentFileId) {
            alert('Please select a file to save.');
            return;
        }
        try {
            await saveFileContent(currentFileId, editor.value);
            alert('File saved successfully!');
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Error saving file. See console for details.');
        }
    });

    const exportSongBtn = document.getElementById('export-song-btn');
    exportSongBtn.addEventListener('click', () => {
        if (!currentFileId) {
            alert('No song is currently loaded to export.');
            return;
        }

        const currentFile = allFiles.find(f => f.id === currentFileId);
        if (!currentFile) {
            console.error('Could not find file info for currentFileId:', currentFileId);
            alert('An error occurred. Could not find file name for the current song.');
            return;
        }
        const fileName = currentFile.name;
        const content = editor.value;

        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        } catch (error) {
            console.error('Error exporting song:', error);
            alert('An error occurred while trying to export the song.');
        }
    });

    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
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
    const addToSetListModal = document.getElementById('add-to-set-list-modal');
    const modalAddToSetListBtn = document.getElementById('modal-add-to-set-list-btn');
    const addToSetListModalCloseBtn = addToSetListModal.querySelector('.close-button');
    const manageSetListsBtn = document.getElementById('manage-set-lists-btn');
    const manageSetListsModal = document.getElementById('manage-set-lists-modal');
    const manageSetListsModalCloseBtn = manageSetListsModal.querySelector('.close-button');
    const deleteSetListSelect = document.getElementById('delete-set-list-select');
    const deleteSetListBtn = document.getElementById('delete-set-list-btn');
    const setListFilesContainer = document.getElementById('set-list-files');
    const setListCheckAllBtn = document.getElementById('set-list-check-all-btn');
    const setListUncheckAllBtn = document.getElementById('set-list-uncheck-all-btn');
    const setListDeleteSelectedBtn = document.getElementById('set-list-delete-selected-btn');

    function renderSelectedSetListFiles() {
        const selectedSetListName = setListSelect.value;
        const files = allSetLists[selectedSetListName] || [];
        setListFilesContainer.innerHTML = '';
        if (files.length === 0) {
            const li = document.createElement('li');
            li.textContent = '(No files in this set list)';
            li.classList.add('empty-set-list');
            setListFilesContainer.appendChild(li);
        } else {
            files.forEach((file, index) => {
                const li = document.createElement('li');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.fileIndex = index;
                checkbox.addEventListener('click', (e) => e.stopPropagation());
                li.appendChild(checkbox);

                const label = document.createElement('span');
                label.textContent = truncateFilename(file.name);
                if (truncateFilename(file.name) !== file.name) {
                    label.title = file.name;
                }
                li.appendChild(label);

                li.classList.add('file');
                li.dataset.fileId = file.id;
                li.draggable = true;
                li.addEventListener('click', async () => {
                    await loadFile(file.id);
                });

                setListFilesContainer.appendChild(li);
            });
        }
    }
    setListSelect.addEventListener('change', renderSelectedSetListFiles);

    let draggedItem = null;

    setListFilesContainer.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    });

    setListFilesContainer.addEventListener('dragend', (e) => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
        }
    });

    setListFilesContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(setListFilesContainer, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (dragging) {
            if (afterElement == null) {
                setListFilesContainer.appendChild(dragging);
            } else {
                setListFilesContainer.insertBefore(dragging, afterElement);
            }
        }
    });

    setListFilesContainer.addEventListener('drop', async (e) => {
        e.preventDefault();
        const selectedSetListName = setListSelect.value;
        const files = allSetLists[selectedSetListName] || [];
        const newFiles = [];
        const children = Array.from(setListFilesContainer.children);
        children.forEach(child => {
            const fileId = child.dataset.fileId;
            const file = files.find(f => f.id === fileId);
            if (file) {
                newFiles.push(file);
            }
        });
        await saveSetList(selectedSetListName, newFiles);
        allSetLists[selectedSetListName] = newFiles;
        renderSelectedSetListFiles();
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

    setListCheckAllBtn.addEventListener('click', () => {
        setListFilesContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    });

    setListUncheckAllBtn.addEventListener('click', () => {
        setListFilesContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    });

    setListDeleteSelectedBtn.addEventListener('click', async () => {
        const selectedSetListName = setListSelect.value;
        if (!selectedSetListName) {
            alert('Please select a set list.');
            return;
        }

        const checkedBoxes = setListFilesContainer.querySelectorAll('input[type="checkbox"]:checked');
        if (checkedBoxes.length === 0) {
            alert('Please select files to delete.');
            return;
        }

        if (!confirm(`Are you sure you want to remove ${checkedBoxes.length} file(s) from this set list?`)) {
            return;
        }

        const indicesToRemove = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.fileIndex, 10));

        // Sort indices in descending order to avoid issues with splicing
        indicesToRemove.sort((a, b) => b - a);

        const currentSetList = allSetLists[selectedSetListName];
        for (const index of indicesToRemove) {
            currentSetList.splice(index, 1);
        }

        await saveSetList(selectedSetListName, currentSetList);
        allSetLists[selectedSetListName] = currentSetList;
        renderSelectedSetListFiles();
        alert('Selected files removed from the set list.');
    });

    function populateSetListSelects(listToSelect = null) {
        const currentSetList = setListSelect.value;
        addToSetListSelect.innerHTML = '';
        setListSelect.innerHTML = '';
        deleteSetListSelect.innerHTML = '';

        const noListOptionForAdd = document.createElement('option');
        noListOptionForAdd.value = "";
        noListOptionForAdd.textContent = "Select a set list";
        addToSetListSelect.appendChild(noListOptionForAdd);
        if (Object.keys(allSetLists).length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No set lists created';
            option.disabled = true;
            setListSelect.appendChild(option);
        } else {
            for (const name in allSetLists) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                addToSetListSelect.appendChild(option.cloneNode(true));
                setListSelect.appendChild(option.cloneNode(true));
                deleteSetListSelect.appendChild(option);
            }
        }
        if (listToSelect) {
            setListSelect.value = listToSelect;
        } else {
            setListSelect.value = currentSetList;
        }
    }

    async function updateUI() {
        await populateSetListSelects();
        await renderSelectedSetListFiles();
    }

    createSetListBtn.addEventListener('click', async () => {
        const name = setListNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for the set list.');
            return;
        }
        if (allSetLists[name]) {
            alert('A set list with this name already exists.');
            return;
        }
        await saveSetList(name, []);
        allSetLists[name] = [];
        setListNameInput.value = '';
        populateSetListSelects(name);
        renderSelectedSetListFiles();
        alert('Set list created!');
        manageSetListsModal.style.display = 'none';
    });

    manageSetListsBtn.addEventListener('click', () => {
        manageSetListsModal.style.display = 'block';
    });

    manageSetListsModalCloseBtn.addEventListener('click', () => {
        manageSetListsModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == manageSetListsModal) {
            manageSetListsModal.style.display = 'none';
        }
    });

    addToSetListBtn.addEventListener('click', () => {
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('li input[type="checkbox"]:checked');
        if (selectedFilesCheckboxes.length === 0) {
            alert('Please select at least one file to add.');
            return;
        }
        addToSetListModal.style.display = 'block';
    });

    modalAddToSetListBtn.addEventListener('click', async () => {
        const selectedSetListName = addToSetListSelect.value;
        if (!selectedSetListName) {
            alert('Please select a set list to add files to.');
            return;
        }
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('li input[type="checkbox"]:checked');
        const targetSetList = allSetLists[selectedSetListName] || [];
        selectedFilesCheckboxes.forEach(checkbox => {
            const file = {
                id: checkbox.dataset.fileId,
                name: checkbox.dataset.fileName
            };
            if (!targetSetList.some(f => f.id === file.id)) {
                targetSetList.push(file);
            }
            checkbox.checked = false;
        });
        await saveSetList(selectedSetListName, targetSetList);
        allSetLists[selectedSetListName] = targetSetList;
        if (setListSelect.value === selectedSetListName) {
            renderSelectedSetListFiles();
        }
        addToSetListModal.style.display = 'none';
        alert(`Added ${selectedFilesCheckboxes.length} file(s) to ${selectedSetListName}.`);
    });

    addToSetListModalCloseBtn.addEventListener('click', () => {
        addToSetListModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == addToSetListModal) {
            addToSetListModal.style.display = 'none';
        }
    });

    deleteSetListBtn.addEventListener('click', async () => {
        const name = deleteSetListSelect.value;
        if (!name) {
            alert('Please select a set list to delete.');
            return;
        }
        if (!confirm(`Are you sure you want to delete the set list "${name}"?`)) {
            return;
        }
        await deleteSetList(name);
        delete allSetLists[name];
        populateSetListSelects();
        renderSelectedSetListFiles();
        alert('Set list deleted!');
        manageSetListsModal.style.display = 'none';
    });

    async function initializeApp() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    [allFiles, allSetLists, allTags] = await Promise.all([
                        getFiles(),
                        getSetLists(),
                        getTags()
                    ]);

                    renderFileList();
                    populateSetListSelects();
                    renderSelectedSetListFiles();
                    renderTagsList();
                    populateTagFilter();
                } catch (error) {
                    console.error("Error during app initialization:", error);
                }
            } else {
                firebase.auth().signInAnonymously().catch((error) => {
                    console.error("Error signing in anonymously:", error);
                });
            }
        });
    }

    initializeApp();

    const tagFilterSelect = document.getElementById('tag-filter-select');
    tagFilterSelect.addEventListener('change', () => {
        renderFileList(tagFilterSelect.value);
    });

    function populateTagFilter() {
        const currentFilter = tagFilterSelect.value;
        tagFilterSelect.innerHTML = '<option value="">All Tags</option>';
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilterSelect.appendChild(option);
        });
        tagFilterSelect.value = currentFilter;
    }

    const selectAllBtn = document.getElementById('select-all-btn');
    const selectNoneBtn = document.getElementById('select-none-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    const manageTagsBtn = document.getElementById('manage-tags-btn');
    const exportSelectedBtn = document.getElementById('export-selected-btn');

    exportSelectedBtn.addEventListener('click', async () => {
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('li input[type="checkbox"]:checked');
        if (selectedFilesCheckboxes.length === 0) {
            alert('Please select at least one file to export.');
            return;
        }

        if (selectedFilesCheckboxes.length === 1) {
            // If only one file is selected, download it directly
            const checkbox = selectedFilesCheckboxes[0];
            const fileId = checkbox.dataset.fileId;
            const fileName = checkbox.dataset.fileName;
            try {
                const content = await getFileContent(fileId);
                const blob = new Blob([content], {
                    type: 'text/plain'
                });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            } catch (error) {
                console.error(`Error exporting file ${fileName}:`, error);
                alert(`Could not export ${fileName}. See console for details.`);
            }
        } else {
            // If multiple files are selected, create a zip
            const zip = new JSZip();
            for (const checkbox of selectedFilesCheckboxes) {
                const fileId = checkbox.dataset.fileId;
                const fileName = checkbox.dataset.fileName;
                try {
                    const content = await getFileContent(fileId);
                    zip.file(fileName, content);
                } catch (error) {
                    console.error(`Error adding file ${fileName} to zip:`, error);
                    alert(`Could not add ${fileName} to the zip file. See console for details.`);
                }
            }

            try {
                const zipContent = await zip.generateAsync({
                    type: "blob"
                });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(zipContent);
                a.download = 'exported_files.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            } catch (error) {
                console.error('Error generating zip file:', error);
                alert('Could not generate the zip file. See console for details.');
            }
        }
    });

    manageTagsBtn.addEventListener('click', () => {
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('li input[type="checkbox"]:checked');
        if (selectedFilesCheckboxes.length === 0) {
            alert('Please select at least one file to manage tags.');
            return;
        }
        const fileIds = Array.from(selectedFilesCheckboxes).map(cb => cb.dataset.fileId);
        openAssignTagsModal(fileIds);
    });

    selectAllBtn.addEventListener('click', () => {
        fileListContainer.querySelectorAll('li input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    });

    selectNoneBtn.addEventListener('click', () => {
        fileListContainer.querySelectorAll('li input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    });

    deleteSelectedBtn.addEventListener('click', async () => {
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('li input[type="checkbox"]:checked');
        if (selectedFilesCheckboxes.length === 0) {
            alert('Please select at least one file to delete.');
            return;
        }
        if (!confirm(`Are you sure you want to delete ${selectedFilesCheckboxes.length} file(s)?`)) {
            return;
        }
        for (const checkbox of selectedFilesCheckboxes) {
            try {
                await deleteFile(checkbox.dataset.fileId);
            } catch (error) {
                console.error('Error deleting file:', error);
                alert(`Error deleting file: ${checkbox.dataset.fileName}`);
            }
        }
        alert('Selected files deleted successfully!');
        allFiles = await getFiles();
        renderFileList();
    });

    const tagsListContainer = document.getElementById('tags-list');
    const tagCheckAllBtn = document.getElementById('tag-check-all-btn');
    const tagUncheckAllBtn = document.getElementById('tag-uncheck-all-btn');
    const tagDeleteSelectedBtn = document.getElementById('tag-delete-selected-btn');

    function renderTagsList() {
        tagsListContainer.innerHTML = '';
        allTags.forEach(tag => {
            const li = document.createElement('li');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.tagName = tag;
            checkbox.addEventListener('click', (e) => e.stopPropagation());
            li.appendChild(checkbox);

            const label = document.createElement('span');
            label.textContent = tag;
            li.appendChild(label);

            tagsListContainer.appendChild(li);
        });
    }

    tagCheckAllBtn.addEventListener('click', () => {
        tagsListContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
    });

    tagUncheckAllBtn.addEventListener('click', () => {
        tagsListContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    });

    const createNewTagBtn = document.getElementById('create-new-tag-btn');
    const newTagNameInput = document.getElementById('new-tag-name');

    createNewTagBtn.addEventListener('click', () => {
        const newTagName = newTagNameInput.value.trim();
        if (newTagName) {
            if (!allTags.includes(newTagName)) {
                allTags.push(newTagName);
                allTags.sort();
                renderTagsList();
                populateTagFilter();
                newTagNameInput.value = '';
            } else {
                alert('Tag already exists.');
            }
        }
    });

    tagDeleteSelectedBtn.addEventListener('click', async () => {
        const checkedBoxes = tagsListContainer.querySelectorAll('input[type="checkbox"]:checked');
        if (checkedBoxes.length === 0) {
            alert('Please select at least one tag to delete.');
            return;
        }

        const tagsToDelete = Array.from(checkedBoxes).map(cb => cb.dataset.tagName);

        // Safety check: ensure none of the selected tags are in use
        const files = await getFiles();
        const tagsInUse = new Set();
        files.forEach(file => {
            if (file.tags) {
                file.tags.forEach(tag => tagsInUse.add(tag));
            }
        });

        const deletableTags = [];
        const protectedTags = [];
        tagsToDelete.forEach(tag => {
            if (tagsInUse.has(tag)) {
                protectedTags.push(tag);
            } else {
                deletableTags.push(tag);
            }
        });

        if (protectedTags.length > 0) {
            alert(`The following tags are currently in use and cannot be deleted:\n\n- ${protectedTags.join('\n- ')}`);
        }

        if (deletableTags.length === 0) {
            return;
        }

        if (!confirm(`Are you sure you want to delete the following ${deletableTags.length} tag(s)?\n\n- ${deletableTags.join('\n- ')}`)) {
            return;
        }

        // Filter out the tags to be deleted from the global list
        allTags = allTags.filter(tag => !deletableTags.includes(tag));

        // Note: Since we've confirmed these tags aren't in use, we don't need to iterate through all files to remove them.
        // They only exist in the `allTags` array.

        renderTagsList();
        populateTagFilter(); // Refresh the filter dropdown
        alert('Selected tags deleted successfully!');
    });

    const assignTagsModal = document.getElementById('assign-tags-modal');
    const modalTagsList = document.getElementById('modal-tags-list');
    const modalNewTagInput = document.getElementById('modal-new-tag');
    const modalAddTagBtn = document.getElementById('modal-add-tag-btn');
    const modalAddTagsBtn = document.getElementById('modal-add-tags-btn');
    const modalRemoveTagsBtn = document.getElementById('modal-remove-tags-btn');
    const modalCloseTagsBtn = document.getElementById('modal-close-tags-btn');
    const modalCloseBtn = assignTagsModal.querySelector('.close-button');

    let currentFileIdsForTags = [];
    let onSaveCallback = null;

    async function openAssignTagsModal(fileIds, onSave = null) {
        if (!Array.isArray(fileIds)) {
            currentFileIdsForTags = [fileIds];
        } else {
            currentFileIdsForTags = fileIds;
        }
        onSaveCallback = onSave;
        let fileTags = [];

        if (currentFileIdsForTags.length > 0) {
            const selectedFiles = allFiles.filter(f => currentFileIdsForTags.includes(f.id));

            if (selectedFiles.length > 0) {
                // Find intersection of tags for multiple files
                fileTags = selectedFiles.reduce((acc, file) => {
                    return acc.filter(tag => file.tags && file.tags.includes(tag));
                }, selectedFiles[0].tags || []);
            }
        }


        modalTagsList.innerHTML = '';
        allTags.forEach(tag => {
            const tagEl = document.createElement('div');
            tagEl.textContent = tag;
            tagEl.classList.add('tag');
            if (fileTags.includes(tag)) {
                tagEl.classList.add('selected');
            }
            tagEl.addEventListener('click', () => {
                tagEl.classList.toggle('selected');
            });
            modalTagsList.appendChild(tagEl);
        });
        assignTagsModal.style.display = 'block';
    }

    function closeAssignTagsModal() {
        assignTagsModal.style.display = 'none';
        modalNewTagInput.value = '';
    }

    modalAddTagBtn.addEventListener('click', () => {
        const newTagName = modalNewTagInput.value.trim();
        if (newTagName && !Array.from(modalTagsList.children).some(el => el.textContent === newTagName)) {
            const tagEl = document.createElement('div');
            tagEl.textContent = newTagName;
            tagEl.classList.add('tag', 'selected');
            tagEl.addEventListener('click', () => {
                tagEl.classList.toggle('selected');
            });
            modalTagsList.appendChild(tagEl);
            modalNewTagInput.value = '';
        }
    });

    async function handleTaggingLogic(add) {
        const selectedTags = Array.from(modalTagsList.querySelectorAll('.tag.selected')).map(el => el.textContent);
        if (onSaveCallback) {
            onSaveCallback(selectedTags);
        } else if (currentFileIdsForTags && currentFileIdsForTags.length > 0) {
            for (const fileId of currentFileIdsForTags) {
                const file = allFiles.find(f => f.id === fileId);
                if (file) {
                    let newTags;
                    if (add) {
                        newTags = [...new Set([...(file.tags || []), ...selectedTags])];
                    } else {
                        newTags = (file.tags || []).filter(tag => !selectedTags.includes(tag));
                    }
                    await updateFileTags(fileId, newTags);
                    file.tags = newTags;
                }
            }
            allTags = [...new Set([...allTags, ...selectedTags])];
            renderFileList();
            renderTagsList();
            populateTagFilter();
        }
        closeAssignTagsModal();
    }

    modalAddTagsBtn.addEventListener('click', () => handleTaggingLogic(true));
    modalRemoveTagsBtn.addEventListener('click', () => handleTaggingLogic(false));
    modalCloseTagsBtn.addEventListener('click', closeAssignTagsModal);
    modalCloseBtn.addEventListener('click', closeAssignTagsModal);
});
