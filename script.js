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
            fileBrowser.style.width = `${newWidth}px`;
        }
    }

    let currentFileId = null;

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
                const [files, tags] = await Promise.all([getFiles(), getTags()]);
                renderFileList(files);
                renderTagsList(tags);
                populateTagFilter(tags);
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

    function renderFileList(files, tagFilter = '') {
        try {
            let filteredFiles = files;
            if (tagFilter) {
                filteredFiles = files.filter(file => file.tags && file.tags.includes(tagFilter));
            }
            fileListContainer.innerHTML = '';
            const ul = document.createElement('ul');
            files.forEach(file => {
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
    const deleteSetListBtn = document.getElementById('delete-set-list-btn');
    const setListFilesContainer = document.getElementById('set-list-files');

    function renderSelectedSetListFiles(setLists) {
        const selectedSetListName = setListSelect.value;
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
                li.dataset.fileId = file.id;
                li.draggable = true;
                li.addEventListener('click', async () => {
                    await loadFile(file.id);
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
        const setLists = await getSetLists();
        const files = setLists[selectedSetListName] || [];
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
        await renderSelectedSetListFiles();
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

    async function removeFileFromSetList(setListName, fileIndex) {
        const setLists = await getSetLists();
        if (setLists[setListName]) {
            setLists[setListName].splice(fileIndex, 1);
            await saveSetList(setListName, setLists[setListName]);
            renderSelectedSetListFiles(setLists);
        }
    }

    function populateSetListSelects(setLists, listToSelect = null) {
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
        const setLists = await getSetLists();
        if (setLists[name]) {
            alert('A set list with this name already exists.');
            return;
        }
        await saveSetList(name, []);
        setLists[name] = [];
        setListNameInput.value = '';
        populateSetListSelects(setLists, name);
        renderSelectedSetListFiles(setLists);
        alert('Set list created!');
    });

    addToSetListBtn.addEventListener('click', async () => {
        const selectedSetListName = addToSetListSelect.value;
        if (!selectedSetListName) {
            alert('Please select a set list to add files to.');
            return;
        }
        const selectedFilesCheckboxes = fileListContainer.querySelectorAll('li input[type="checkbox"]:checked');
        if (selectedFilesCheckboxes.length === 0) {
            alert('Please select at least one file to add.');
            return;
        }
        const setLists = await getSetLists();
        const targetSetList = setLists[selectedSetListName] || [];
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
        if (setListSelect.value === selectedSetListName) {
            const setLists = await getSetLists();
            renderSelectedSetListFiles(setLists);
        }
        alert(`Added ${selectedFilesCheckboxes.length} file(s) to ${selectedSetListName}.`);
    });

    deleteSetListBtn.addEventListener('click', async () => {
        const name = setListSelect.value;
        if (!name) {
            alert('Please select a set list to delete.');
            return;
        }
        if (!confirm(`Are you sure you want to delete the set list "${name}"?`)) {
            return;
        }
        await deleteSetList(name);
        const setLists = await getSetLists();
        populateSetListSelects(setLists);
        renderSelectedSetListFiles(setLists);
        alert('Set list deleted!');
    });

    async function initializeApp() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const [files, setLists, tags] = await Promise.all([
                        getFiles(),
                        getSetLists(),
                        getTags()
                    ]);

                    renderFileList(files);
                    populateSetListSelects(setLists);
                    renderSelectedSetListFiles(setLists);
                    renderTagsList(tags);
                    populateTagFilter(tags);
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

    function populateTagFilter(tags) {
        const currentFilter = tagFilterSelect.value;
        tagFilterSelect.innerHTML = '<option value="">All Tags</option>';
        tags.forEach(tag => {
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
        await renderFileList();
    });

    const tagsListContainer = document.getElementById('tags-list');

    async function renderTagsList() {
        const tags = await getTags();
        tagsListContainer.innerHTML = '';
        tags.forEach(tag => {
            const li = document.createElement('li');
            li.textContent = tag;
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.classList.add('delete-tag-btn');
            deleteBtn.addEventListener('click', async () => {
                const files = await getFiles();
                const isTagInUse = files.some(file => file.tags && file.tags.includes(tag));
                if (isTagInUse) {
                    alert(`Tag "${tag}" is currently in use and cannot be deleted.`);
                    return;
                }

                if (confirm(`Are you sure you want to delete the tag "${tag}"? This will remove it from all files.`)) {
                    for (const file of files) {
                        if (file.tags && file.tags.includes(tag)) {
                            const newTags = file.tags.filter(t => t !== tag);
                            await updateFileTags(file.id, newTags);
                        }
                    }
                    await renderTagsList();
                    await renderFileList();
                    await populateTagFilter();
                    alert(`Tag "${tag}" deleted.`);
                }
            });
            li.appendChild(deleteBtn);
            tagsListContainer.appendChild(li);
        });
    }

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
        const allTags = await getTags();
        let fileTags = [];

        if (currentFileIdsForTags.length > 0) {
            const files = await getFiles();
            const selectedFiles = files.filter(f => currentFileIdsForTags.includes(f.id));

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
            const files = await getFiles();
            for (const fileId of currentFileIdsForTags) {
                const file = files.find(f => f.id === fileId);
                if (file) {
                    let newTags;
                    if (add) {
                        newTags = [...new Set([...(file.tags || []), ...selectedTags])];
                    } else {
                        newTags = (file.tags || []).filter(tag => !selectedTags.includes(tag));
                    }
                    await updateFileTags(fileId, newTags);
                }
            }
            await renderFileList();
            await renderTagsList();
            await populateTagFilter();
        }
        closeAssignTagsModal();
    }

    modalAddTagsBtn.addEventListener('click', () => handleTaggingLogic(true));
    modalRemoveTagsBtn.addEventListener('click', () => handleTaggingLogic(false));
    modalCloseTagsBtn.addEventListener('click', closeAssignTagsModal);
    modalCloseBtn.addEventListener('click', closeAssignTagsModal);
});
