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
        body.style.fontFamily = fontSelect.value;
        localStorage.setItem('font', fontSelect.value);
    });

    // Load settings from localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const font = localStorage.getItem('font');

    if (darkMode) {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    if (font) {
        body.style.fontFamily = font;
        fontSelect.value = font;
    }

    const fileListContainer = document.getElementById('file-list');
    const selectDirBtn = document.getElementById('select-dir-btn');

    let currentFileHandle = null;

    async function renderFileList(directoryHandle, parentElement) {
        const list = document.createElement('ul');

        for await (const entry of directoryHandle.values()) {
            const listItem = document.createElement('li');
            listItem.textContent = entry.name;

            if (entry.kind === 'directory') {
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
});