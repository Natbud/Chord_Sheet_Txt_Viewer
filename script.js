const saveBtn = document.getElementById('save-btn');
const editor = document.getElementById('editor');
const fileListContainer = document.getElementById('file-list');

let currentFilePath = '';

function renderFileList(items, parentElement, pathPrefix = '') {
    const list = document.createElement('ul');
    if (pathPrefix) {
        list.classList.add('nested');
    }

    items.forEach(item => {
        const listItem = document.createElement('li');
        const fullPath = pathPrefix ? `${pathPrefix}/${item.name}` : item.name;

        if (item.type === 'directory') {
            listItem.textContent = item.name;
            listItem.classList.add('directory');
            const childrenList = renderFileList(item.children, listItem, fullPath);
            listItem.appendChild(childrenList);

            listItem.addEventListener('click', (event) => {
                event.stopPropagation();
                childrenList.classList.toggle('active');
                listItem.classList.toggle('expanded');
            });
        } else {
            listItem.textContent = item.name;
            listItem.classList.add('file');
            listItem.addEventListener('click', (event) => {
                event.stopPropagation();
                loadFile(fullPath);
            });
        }
        list.appendChild(listItem);
    });
    parentElement.appendChild(list);
    return list;
}

async function displayFileList() {
    try {
        const response = await fetch('file-list.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const files = await response.json();
        fileListContainer.innerHTML = '';
        renderFileList(files, fileListContainer);
    } catch (error) {
        console.error('Error fetching file list:', error);
        fileListContainer.innerHTML = '<li>Error loading file list.</li>';
    }
}

async function loadFile(filePath) {
    try {
        const response = await fetch(`txt_library/${filePath}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contents = await response.text();
        editor.value = contents;
        currentFilePath = filePath;
    } catch (error) {
        console.error('Error loading file:', error);
        editor.value = `Error loading file: ${filePath}`;
    }
}

saveBtn.addEventListener('click', async () => {
    if (!currentFilePath) {
        alert('Please select a file to save.');
        return;
    }

    try {
        const blob = new Blob([editor.value], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        const filename = currentFilePath.split('/').pop();
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        alert('File downloaded successfully!');
    } catch (error) {
        console.error('Error saving file:', error);
    }
});

displayFileList();
