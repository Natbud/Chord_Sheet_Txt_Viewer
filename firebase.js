// This file will contain all the Firebase-related code.

/**
 * Uploads a file to the Firebase Realtime Database.
 * @param {File} file - The file to upload.
 * @param {string[]} tags - The tags to assign to the file.
 * @returns {Promise<void>} A promise that resolves when the file is uploaded.
 */
function uploadFile(file, tags = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const fileName = file.name;
      const fileRef = firebase.database().ref('files/' + fileName.replace(/\.txt$/, ''));
      fileRef.set({
        name: fileName,
        content: content,
        tags: tags
      }).then(resolve).catch(reject);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Gets a list of all files from the Firebase Realtime Database.
 * @returns {Promise<Object[]>} A promise that resolves with an array of file objects.
 */
function getFiles() {
    const filesRef = firebase.database().ref('files');
    return filesRef.once('value').then((snapshot) => {
        const files = [];
        snapshot.forEach((childSnapshot) => {
            const fileData = childSnapshot.val();
            if (fileData && typeof fileData === 'object' && fileData.name) {
                files.push({
                    id: childSnapshot.key,
                    ...fileData
                });
            }
        });
        return files;
    });
}

/**
 * Gets the content of a specific file from the Firebase Realtime Database.
 * @param {string} fileId - The ID of the file to get the content for.
 * @returns {Promise<string>} A promise that resolves with the content of the file.
 */
function getFileContent(fileId) {
  const fileRef = firebase.database().ref('files/' + fileId);
  return fileRef.once('value').then((snapshot) => {
    return snapshot.val().content;
  });
}

/**
 * Updates the content of a file in the Firebase Realtime Database.
 * @param {string} fileId - The ID of the file to update.
 * @param {string} content - The new content of the file.
 * @returns {Promise<void>} A promise that resolves when the file content is updated.
 */
function saveFileContent(fileId, content) {
  const fileRef = firebase.database().ref('files/' + fileId + '/content');
  return fileRef.set(content);
}

/**
 * Deletes a file from the Firebase Realtime Database.
 * @param {string} fileId - The ID of the file to delete.
 * @returns {Promise<void>} A promise that resolves when the file is deleted.
 */
function deleteFile(fileId) {
  const fileRef = firebase.database().ref('files/' + fileId);
  return fileRef.remove();
}

/**
 * Gets a list of all unique tags from Firebase.
 * @returns {Promise<string[]>} A promise that resolves with an array of unique tags.
 */
async function getTags() {
    const files = await getFiles();
    const allTags = new Set();
    files.forEach(file => {
        if (file.tags) {
            file.tags.forEach(tag => allTags.add(tag));
        }
    });
    return Array.from(allTags).sort();
}

async function getSetLists() {
    const snapshot = await firebase.database().ref('setlists').once('value');
    return snapshot.val() || {};
}

async function saveSetList(name, files) {
    await firebase.database().ref(`setlists/${name}`).set(files);
}

async function deleteSetList(name) {
    await firebase.database().ref(`setlists/${name}`).remove();
}

/**
 * Updates the tags for a specific file.
 * @param {string} fileId - The ID of the file to update.
 * @param {string[]} tags - The new array of tags for the file.
 * @returns {Promise<void>} A promise that resolves when the tags are updated.
 */
function updateFileTags(fileId, tags) {
    const tagsRef = firebase.database().ref('files/' + fileId + '/tags');
    return tagsRef.set(tags);
}
