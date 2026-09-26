// KioOS kio speak meow :)

const password = "1234";

let activeWindow = null;
let highestZ = 10;
// STARTUP
window.addEventListener("load", function () {
    const bootScreen = document.getElementById("boot-screen");
    const loginScreen = document.getElementById("login-screen");
    const desktop = document.getElementById("desktop");

    console.log("KioOS: system loaded");

    // Hide desktop while booting
    desktop.style.display = "none";
    loginScreen.style.display = "none";
    bootScreen.style.display = "flex";

    // Finish boot after 2 seconds
    setTimeout(function () {
        console.log("KioOS: boot complete");

        bootScreen.style.display = "none";
        loginScreen.style.display = "flex";

        const password = document.getElementById("password");

        if (password) {
            password.focus();
        }
    }, 2000);
});

// LOGIN

document.getElementById("login-button").addEventListener("click", login);

document.getElementById("password").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        login();
    }
});

function login() {
    const input = document.getElementById("password");
    const error = document.getElementById("login-error");

    if (input.value === password) {
        error.textContent = "";

        document.getElementById("login-screen").style.display = "none";
        document.getElementById("desktop").style.display = "block";

        input.value = "";
    } else {
        error.textContent = "WRONG PASSWORD";

        input.value = "";
        input.focus();
    }
}
// OPEN APPLICATIONS

const appWindows = {
    files: "files-window",
    terminal: "terminal-window",
    browser: "browser-window",
    notes: "notes-window",
    calculator: "calculator-window",
    settings: "settings-window",
};

document.querySelectorAll("[data-app]").forEach(function (element) {
    element.addEventListener("dblclick", function () {
        openApp(element.dataset.app);
    });
});

function openApp(appName) {
    const windowId = appWindows[appName];

    if (!windowId) {
        return;
    }

    const windowElement = document.getElementById(windowId);

    windowElement.style.display = "block";

    highestZ++;
    windowElement.style.zIndex = highestZ;

    activeWindow = windowElement;

    addTaskbarApp(appName);
}
// START MENU

const startButton = document.getElementById("start-button");
const startMenu = document.getElementById("start-menu");

startButton.addEventListener("click", function () {
    if (startMenu.style.display === "block") {
        startMenu.style.display = "none";
    } else {
        startMenu.style.display = "block";
    }
});

document.querySelectorAll("#start-menu [data-app]").forEach(function (button) {
    button.addEventListener("click", function () {
        openApp(button.dataset.app);

        startMenu.style.display = "none";
    });
});

// ------------------------// WINDOW BUTTONS

document.querySelectorAll(".window").forEach(function (windowElement) {
    const buttons = windowElement.querySelectorAll(".window-buttons button");

    // minimize
    buttons[0].addEventListener("click", function () {
        windowElement.style.display = "none";
    });

    // maximize
    buttons[1].addEventListener("click", function () {
        if (windowElement.classList.contains("maximized")) {
            windowElement.classList.remove("maximized");
        } else {
            windowElement.classList.add("maximized");
        }
    });

    // close
    buttons[2].addEventListener("click", function () {
        windowElement.style.display = "none";

        removeTaskbarApp(windowElement.id);
    });

    // click window to bring it forward
    windowElement.addEventListener("mousedown", function () {
        highestZ++;

        windowElement.style.zIndex = highestZ;

        activeWindow = windowElement;
    });
});

// TASKBAR
function addTaskbarApp(appName) {
    const windowId = appWindows[appName];

    if (document.querySelector('[data-task="' + windowId + '"]')) {
        return;
    }

    const button = document.createElement("button");

    button.className = "taskbar-app";

    button.dataset.task = windowId;

    button.textContent = appName.toUpperCase();

    button.addEventListener("click", function () {
        const windowElement = document.getElementById(windowId);

        if (windowElement.style.display === "none") {
            windowElement.style.display = "block";

            highestZ++;
            windowElement.style.zIndex = highestZ;
        } else {
            windowElement.style.display = "none";
        }
    });

    document.getElementById("taskbar-apps").appendChild(button);
}

function removeTaskbarApp(windowId) {
    const button = document.querySelector('[data-task="' + windowId + '"]');

    if (button) {
        button.remove();
    }
}

// MAKE WINDOWS DRAGGABLE

document.querySelectorAll(".window").forEach(function (windowElement) {
    const titleBar = windowElement.querySelector(".window-title");

    let dragging = false;

    let mouseX = 0;
    let mouseY = 0;

    titleBar.addEventListener("mousedown", function (event) {
        // Don't drag when clicking buttons
        if (event.target.tagName === "BUTTON") {
            return;
        }

        if (windowElement.classList.contains("maximized")) {
            return;
        }

        dragging = true;

        mouseX = event.clientX - windowElement.offsetLeft;

        mouseY = event.clientY - windowElement.offsetTop;

        highestZ++;

        windowElement.style.zIndex = highestZ;
    });

    document.addEventListener("mousemove", function (event) {
        if (!dragging) {
            return;
        }

        let newX = event.clientX - mouseX;

        let newY = event.clientY - mouseY;

        // Keep window inside the screen

        if (newX < 0) {
            newX = 0;
        }

        if (newY < 0) {
            newY = 0;
        }

        const maxX = window.innerWidth - windowElement.offsetWidth;

        const maxY = window.innerHeight - 60 - windowElement.offsetHeight;

        if (newX > maxX) {
            newX = maxX;
        }

        if (newY > maxY) {
            newY = maxY;
        }

        windowElement.style.left = newX + "px";
        windowElement.style.top = newY + "px";
    });

    document.addEventListener("mouseup", function () {
        dragging = false;
    });
});

// CLOCK

function updateClock() {
    const clock = document.getElementById("clock");

    const now = new Date();

    let hours = now.getHours();
    let minutes = now.getMinutes();

    if (hours < 10) {
        hours = "0" + hours;
    }

    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    clock.textContent = hours + ":" + minutes;
}

updateClock();

setInterval(updateClock, 1000);
// TERMINAL

const terminalInput = document.getElementById("terminal-input");

const terminalOutput = document.getElementById("terminal-output");

const terminalBody = document.querySelector(".terminal-body");

const commandHistory = [];
let historyIndex = -1;

terminalInput.addEventListener("keydown", function (event) {
    // Recall previous commands with the arrow keys
    if (event.key === "ArrowUp") {
        event.preventDefault();

        if (commandHistory.length === 0) {
            return;
        }

        if (historyIndex === -1) {
            historyIndex = commandHistory.length - 1;
        } else if (historyIndex > 0) {
            historyIndex--;
        }

        terminalInput.value = commandHistory[historyIndex];

        return;
    }

    if (event.key === "ArrowDown") {
        event.preventDefault();

        if (historyIndex === -1) {
            return;
        }

        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            terminalInput.value = commandHistory[historyIndex];
        } else {
            historyIndex = -1;
            terminalInput.value = "";
        }

        return;
    }

    if (event.key !== "Enter") {
        return;
    }

    const rawCommand = terminalInput.value.trim();
    const command = rawCommand.toLowerCase();

    if (command === "") {
        return;
    }

    printTerminal("AKASH@KIOOS> " + rawCommand);

    commandHistory.push(rawCommand);
    historyIndex = -1;

    runCommand(command);

    terminalInput.value = "";
});

// Keep focus on the input, and scroll to the newest line
document.getElementById("terminal-window").addEventListener("mousedown", function () {
    setTimeout(function () {
        terminalInput.focus();
    }, 0);
});

function printTerminal(text) {
    const line = document.createElement("div");

    line.textContent = text;

    terminalOutput.appendChild(line);

    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function runCommand(fullCommand) {
    const parts = fullCommand.split(" ").filter(Boolean);
    const command = parts[0];
    const args = parts.slice(1);

    if (command === "help") {
        printTerminal("");
        printTerminal("AVAILABLE COMMANDS");
        printTerminal("------------------");
        printTerminal("help              show this list");
        printTerminal("clear             clear the screen");
        printTerminal("date              show today's date");
        printTerminal("time              show the current time");
        printTerminal("whoami            show the current user");
        printTerminal("version           show the OS version");
        printTerminal("about             about KioOS");
        printTerminal("ls                list files");
        printTerminal("cd <dir>         change directory (.. for up)");
        printTerminal("pwd               show current directory");
        printTerminal("cat readme.txt    show a file");
        printTerminal("echo <text>       print text back");
        printTerminal("calc <sum>        evaluate a math expression");
        printTerminal("open <app>        open an app (files, terminal,");
        printTerminal("                  browser, notes, calculator,");
        printTerminal("                  settings)");
        printTerminal("neofetch          show system info");
        printTerminal("history           show command history");
        printTerminal("reboot            restart KioOS");
        printTerminal("logout            lock the session");
    } else if (command === "clear") {
        terminalOutput.innerHTML = "";
    } else if (command === "date") {
        printTerminal(new Date().toDateString());
    } else if (command === "time") {
        printTerminal(new Date().toLocaleTimeString());
    } else if (command === "whoami") {
        printTerminal("AKASH");
    } else if (command === "version") {
        printTerminal("KioOS v0.1");
    } else if (command === "about") {
        printTerminal("KioOS personal web operating system.");
        printTerminal("Built with HTML, CSS and JavaScript.");
    } else if (command === "ls") {
        const node = getNode(currentPath) || fileSystem;
        const names = Object.keys(node.children || {}).sort();

        if (names.length === 0) {
            printTerminal("(empty folder)");
        } else {
            names.forEach(function (name) {
                const child = node.children[name];
                printTerminal(name + (child.type === "folder" ? "/" : ""));
            });
        }
    } else if (command === "cd") {
        const target = args[0];

        if (!target || target === "~") {
            currentPath = [];
        } else if (target === "..") {
            currentPath.pop();
        } else {
            const node = getNode(currentPath);
            const clean = target.toUpperCase();

            if (node.children[clean] && node.children[clean].type === "folder") {
                currentPath.push(clean);
            } else {
                printTerminal("NO SUCH DIRECTORY: " + target);
                return;
            }
        }

        renderFileArea();
    } else if (command === "pwd") {
        printTerminal("/" + pathLabel(currentPath));
    } else if (command === "cat") {
        const name = args.join(" ").trim().toUpperCase();
        const node = getNode(currentPath) || fileSystem;

        if (!name) {
            printTerminal("USAGE: cat <filename>");
        } else if (node.children[name] && node.children[name].type === "file") {
            node.children[name].content.split("\n").forEach(function (line) {
                printTerminal(line);
            });
        } else {
            printTerminal("FILE NOT FOUND: " + name);
        }
    } else if (command === "echo") {
        printTerminal(args.join(" "));
    } else if (command === "calc") {
        const expression = args.join(" ");

        if (!expression) {
            printTerminal("USAGE: calc <expression>");
        } else if (!/^[0-9+\-*/. ()]+$/.test(expression)) {
            printTerminal("ERROR: invalid characters");
        } else {
            try {
                printTerminal(String(Function("return (" + expression + ")")()));
            } catch {
                printTerminal("ERROR: could not evaluate");
            }
        }
    } else if (command === "open") {
        const appName = args[0];

        if (appName && appWindows[appName]) {
            openApp(appName);
            printTerminal("Opening " + appName.toUpperCase() + "...");
        } else {
            printTerminal(
                "USAGE: open <files|terminal|browser|notes|calculator|settings>",
            );
        }
    } else if (command === "neofetch") {
        printTerminal("");
        printTerminal("  KioOS   -----------------");
        printTerminal("  user:      AKASH");
        printTerminal("  os:        KioOS v0.1");
        printTerminal("  shell:     kiosh");
        printTerminal("  uptime:    " + Math.floor(performance.now() / 1000) + "s");
        printTerminal("  ----------------------------");
    } else if (command === "history") {
        if (commandHistory.length === 0) {
            printTerminal("(no commands yet)");
        } else {
            commandHistory.forEach(function (entry, index) {
                printTerminal(index + 1 + "  " + entry);
            });
        }
    } else if (command === "reboot") {
        printTerminal("Rebooting KioOS...");

        setTimeout(function () {
            location.reload();
        }, 700);
    } else if (command === "logout") {
        printTerminal("Locking session...");

        setTimeout(function () {
            document.getElementById("desktop").style.display = "none";
            document.getElementById("login-screen").style.display = "flex";

            const passwordField = document.getElementById("password");

            if (passwordField) {
                passwordField.focus();
            }
        }, 400);
    } else {
        printTerminal("COMMAND NOT FOUND: " + command);
    }
}

// VIRTUAL FILE SYSTEM

const defaultFS = {
    type: "folder",
    children: {
        DOCUMENTS: { type: "folder", children: {} },
        PICTURES: { type: "folder", children: {} },
        DOWNLOADS: { type: "folder", children: {} },
        "README.TXT": {
            type: "file",
            content:
                "Welcome to KioOS.\n\n" +
                "This is a personal web OS.\n" +
                "Use FILES to browse and manage files.\n" +
                "Use NOTEPAD to write and save text files.",
        },
    },
};

function loadFS() {
    try {
        const saved = localStorage.getItem("kioos-fs");

        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.log("KioOS: could not load saved files", error);
    }

    return JSON.parse(JSON.stringify(defaultFS));
}

function saveFS() {
    try {
        localStorage.setItem("kioos-fs", JSON.stringify(fileSystem));
    } catch (error) {
        console.log("KioOS: could not save files", error);
    }
}

let fileSystem = loadFS();

// Get the folder node at a path, e.g. ["DOCUMENTS"]
function getNode(path) {
    let node = fileSystem;

    for (const part of path) {
        if (!node.children || !node.children[part]) {
            return null;
        }

        node = node.children[part];
    }

    return node;
}

function pathLabel(path) {
    return path.length === 0 ? "HOME" : "HOME/" + path.join("/");
}

// FILE MANAGER

let currentPath = [];
let selectedName = null;

const fileArea = document.getElementById("file-area");
const filePathLabel = document.getElementById("file-path-label");

function renderFileArea() {
    const node = getNode(currentPath) || fileSystem;

    selectedName = null;
    fileArea.innerHTML = "";
    filePathLabel.textContent = pathLabel(currentPath);

    const names = Object.keys(node.children || {});

    if (names.length === 0) {
        const empty = document.createElement("div");

        empty.style.color = "#477447";
        empty.style.fontSize = "11px";
        empty.style.padding = "10px";

        empty.textContent = "(empty folder)";

        fileArea.appendChild(empty);

        return;
    }

    names.sort();

    names.forEach(function (name) {
        const child = node.children[name];

        const item = document.createElement("div");
        item.className = "file-item";
        item.dataset.name = name;

        const icon = document.createElement("div");
        icon.className = "file-icon";
        icon.textContent = child.type === "folder" ? "DIR" : "TXT";

        const label = document.createElement("span");
        label.textContent = name;

        item.appendChild(icon);
        item.appendChild(label);

        item.addEventListener("click", function () {
            fileArea.querySelectorAll(".file-item").forEach(function (el) {
                el.classList.remove("selected");
            });

            item.classList.add("selected");
            selectedName = name;
        });

        item.addEventListener("dblclick", function () {
            if (child.type === "folder") {
                currentPath.push(name);
                renderFileArea();
            } else {
                openFileInEditor(currentPath.concat(name));
            }
        });

        fileArea.appendChild(item);
    });
}

document.querySelectorAll(".file-sidebar [data-path]").forEach(function (item) {
    item.addEventListener("click", function () {
        const raw = item.dataset.path;

        currentPath = raw === "" ? [] : raw.split("/");

        renderFileArea();
    });
});

document.getElementById("fm-up").addEventListener("click", function () {
    if (currentPath.length > 0) {
        currentPath.pop();
        renderFileArea();
    }
});

document.getElementById("fm-new-folder").addEventListener("click", function () {
    const name = prompt("Folder name:");

    if (!name) {
        return;
    }

    const clean = name.trim().toUpperCase();
    const node = getNode(currentPath);

    if (!clean || node.children[clean]) {
        alert("Enter a unique folder name.");
        return;
    }

    node.children[clean] = { type: "folder", children: {} };

    saveFS();
    renderFileArea();
});

document.getElementById("fm-new-file").addEventListener("click", function () {
    let name = prompt("File name:", "UNTITLED.TXT");

    if (!name) {
        return;
    }

    let clean = name.trim().toUpperCase();

    if (!clean.includes(".")) {
        clean += ".TXT";
    }

    const node = getNode(currentPath);

    if (node.children[clean]) {
        alert("A file with that name already exists.");
        return;
    }

    node.children[clean] = { type: "file", content: "" };

    saveFS();
    renderFileArea();
});

document.getElementById("fm-delete").addEventListener("click", function () {
    if (!selectedName) {
        alert("Select a file or folder first.");
        return;
    }

    if (!confirm("Delete " + selectedName + "?")) {
        return;
    }

    const node = getNode(currentPath);

    delete node.children[selectedName];

    saveFS();
    renderFileArea();
});

renderFileArea();

// NOTES / TEXT EDITOR

const notesArea = document.getElementById("notes-area");

const editorFilenameInput = document.getElementById("editor-filename");

const editorStatus = document.getElementById("editor-status");

let editorFolderPath = [];

function setEditorStatus(text) {
    editorStatus.textContent = text;
}

function openFileInEditor(pathToFile) {
    const folderPath = pathToFile.slice(0, -1);
    const name = pathToFile[pathToFile.length - 1];

    const folder = getNode(folderPath);
    const file = folder && folder.children[name];

    if (!file || file.type !== "file") {
        return;
    }

    editorFolderPath = folderPath;
    editorFilenameInput.value = name;
    notesArea.value = file.content;

    setEditorStatus("Opened " + pathLabel(folderPath) + "/" + name);

    openApp("notes");
}

function saveCurrentFile() {
    let name = editorFilenameInput.value.trim().toUpperCase();

    if (!name) {
        alert("Enter a filename.");
        return;
    }

    if (!name.includes(".")) {
        name += ".TXT";
    }

    editorFilenameInput.value = name;

    const folder = getNode(editorFolderPath) || fileSystem;

    folder.children[name] = {
        type: "file",
        content: notesArea.value,
    };

    saveFS();

    setEditorStatus(
        "Saved " +
            pathLabel(editorFolderPath) +
            "/" +
            name +
            " at " +
            new Date().toLocaleTimeString(),
    );

    // Refresh the file manager if it is showing this folder
    if (currentPath.join("/") === editorFolderPath.join("/")) {
        renderFileArea();
    }
}

document.getElementById("editor-new").addEventListener("click", function () {
    notesArea.value = "";
    editorFilenameInput.value = "UNTITLED.TXT";
    editorFolderPath = [];

    setEditorStatus("New file");
});

document.getElementById("editor-save").addEventListener("click", saveCurrentFile);

document.getElementById("editor-download").addEventListener("click", async function () {
    let name = editorFilenameInput.value.trim().toUpperCase();

    if (!name.includes(".")) {
        name += ".TXT";
    }

    const downloads = await claude.use("downloads");

    if (!downloads) {
        setEditorStatus("Downloads aren't available in this view.");
        return;
    }

    try {
        await downloads.save({
            filename: name,
            data: notesArea.value,
        });

        setEditorStatus("Downloaded " + name);
    } catch (error) {
        setEditorStatus("Download cancelled");
    }
});


const calculatorDisplay = document.getElementById("calculator-display");

const calculatorButtons = document.querySelectorAll(".calculator-buttons button");

calculatorButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        const value = button.textContent;

        if (value === "C") {
            calculatorDisplay.value = "";
        } else if (value === "=") {
            calculateResult();
        } else {
            calculatorDisplay.value += value;
        }
    });
});

function calculateResult() {
    const expression = calculatorDisplay.value;

    if (!expression) {
        return;
    }

    // Only allow calculator characters
    if (!/^[0-9+\-*/. ]+$/.test(expression)) {
        calculatorDisplay.value = "ERROR";

        return;
    }

    try {
        calculatorDisplay.value = Function("return " + expression)();
    } catch {
        calculatorDisplay.value = "ERROR";
    }
}


const address = document.getElementById("address");

const browserPage = document.querySelector(".browser-page");

document
    .querySelector(".address-bar button:last-child")
    .addEventListener("click", function () {
        openWebsite();
    });

address.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        openWebsite();
    }
});

function openWebsite() {
    let url = address.value.trim();

    if (!url) {
        return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }

    browserPage.innerHTML = "Opening " + url + "...";

    // Open website in a new browser tab.
    // Many websites don't allow iframe embedding.

    window.open(url, "_blank");
}

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        startMenu.style.display = "none";
    }
});