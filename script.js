const openBtn = document.getElementById('open-btn');
const saveBtn = document.getElementById('save-btn');
const editor = document.getElementById('editor');

let fileHandle;

openBtn.addEventListener('click', async () => {
    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [
                {
                    description: 'Text Files',
                    accept: {
                        'text/plain': ['.txt'],
                    },
                },
            ],
        });
        const file = await fileHandle.getFile();
        const contents = await file.text();
        editor.value = contents;
    } catch (error) {
        console.error('Error opening file:', error);
    }
});

saveBtn.addEventListener('click', async () => {
    try {
        if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
                types: [
                    {
                        description: 'Text Files',
                        accept: {
                            'text/plain': ['.txt'],
                        },
                    },
                ],
            });
        }
        const writable = await fileHandle.createWritable();
        await writable.write(editor.value);
        await writable.close();
        alert('File saved successfully!');
    } catch (error) {
        console.error('Error saving file:', error);
    }
});