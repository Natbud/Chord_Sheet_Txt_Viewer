# Text File Reader/Editor

This is a simple web-based text file reader and editor that allows you to browse and edit text files from a local `txt_library` directory.

## Features

*   Browse a library of text files and subdirectories.
*   View and edit the contents of `.txt` files.
*   Download a copy of the edited file.

## How to Use

1.  **Add your text files:** Place any `.txt` files you want to access into the `txt_library` directory. You can also create subdirectories to organize your files.

2.  **Generate the file list:** Before running the application, you need to generate a list of the available files. Run the following command in your terminal:

    ```bash
    node generate-file-list.js
    ```

    This will create or update the `file-list.json` file, which the application uses to display the file browser. **You must run this script each time you add, remove, or rename files in the `txt_library` directory.**

3.  **Open the application:** Open the `index.html` file in your web browser. You should now see the list of your files on the left-hand side.

## Development

This project is built with plain HTML, CSS, and JavaScript. To get started, you can run a simple local web server to serve the files. For example, using Python:

```bash
python -m http.server
```

Then, open your browser to `http://localhost:8000`.
