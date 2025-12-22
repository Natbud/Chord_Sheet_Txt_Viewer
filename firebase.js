// This file will contain all the Firebase-related code.

/**
 * Uploads a file to the Firebase Realtime Database.
 * @param {File} file - The file to upload.
 * @returns {Promise<void>} A promise that resolves when the file is uploaded.
 */
function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const fileName = file.name;
      const fileRef = firebase.database().ref('files/' + fileName.replace(/\.txt$/, ''));
      fileRef.set({
        name: fileName,
        content: content
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
      files.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
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
