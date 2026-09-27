let activeWindow = null;
let highestZ = 10;


/* BOOT */

window.addEventListener("load", function () {
    let boot = document.getElementById("boot-screen");
    let desktop = document.getElementById("desktop");

    boot.style.display = "flex";
    desktop.style.display = "none";

    setTimeout(function () {
        boot.style.display = "none";
        desktop.style.display = "block";
    }, 2000);
});


/* APPS */

const apps = {
    files: "files-window",
    terminal: "terminal-window",
    browser: "browser-window",
    notes: "notes-window",
    calculator: "calculator-window",
    settings: "settings-window"
};


document.querySelectorAll("[data-app]").forEach(function (item) {
    item.addEventListener("dblclick", function () {
        openApp(item.dataset.app);
    });
});


function openApp(appName){
    const windowId=apps[appName];
    if(!windowId)return;

    const win=document.getElementById(windowId);
    win.style.display="block";

    highestZ++;
    win.style.zIndex=highestZ;
    activeWindow=win;

    addTaskbarApp(appName);
}


/* START MENU */

let startButton = document.getElementById("start-button");
let startMenu = document.getElementById("start-menu");

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


/* WINDOW BUTTONS */

document.querySelectorAll(".window").forEach(function (win) {

    let buttons = win.querySelectorAll(".window-buttons button");

    // close
    buttons[0].addEventListener("click", function () {
        win.style.display = "none";
    });

    // maximize
    buttons[1].addEventListener("click", function () {
        if (win.classList.contains("maximized")) {
            win.classList.remove("maximized");
        } else {
            win.classList.add("maximized");
        }
    });

    // close and remove from taskbar
    buttons[2].addEventListener("click", function () {
        win.style.display = "none";
        removeTaskbarApp(win.id);
    });

    // bring window to front
    win.addEventListener("mousedown", function () {
        highestZ++;
        win.style.zIndex = highestZ;
        activeWindow = win;
    });
});


/* TASKBAR */

function addTaskbarApp(name){
    let id=apps[name];

    if(document.querySelector('[data-task="'+id+'"]'))return;

    let icons={
        files:"icon/icons8-file-128.png",
        calculator:"icon/icons8-calculator-48.png",
        terminal:"icon/icons8-terminal-50.png",
        settings:"icon/icons8-setting-50.png",
        browser:"icon/icons8-browser-50.png",
        notes:"icon/icons8-note-50.png"
    };

    let button=document.createElement("button");
    button.className="taskbar-app";
    button.dataset.task=id;

    let img=document.createElement("img");
    img.src=icons[name];
    img.alt=name;

    button.appendChild(img);

    button.addEventListener("click",function(){
        let win=document.getElementById(id);

        if(win.style.display==="none"){
            win.style.display="block";
            highestZ++;
            win.style.zIndex=highestZ;
        }else{
            win.style.display="none";
        }
    });

    document.getElementById("taskbar-apps").appendChild(button);
}


function removeTaskbarApp(id) {
    let button = document.querySelector('[data-task="' + id + '"]');

    if (button) {
        button.remove();
    }
}


/* DRAG WINDOWS */

document.querySelectorAll(".window").forEach(function (win) {

    let title = win.querySelector(".window-title");

    let dragging = false;
    let mouseX = 0;
    let mouseY = 0;

    title.addEventListener("mousedown", function (event) {

        if (event.target.tagName === "BUTTON") {
            return;
        }

        if (win.classList.contains("maximized")) {
            return;
        }

        dragging = true;

        mouseX = event.clientX - win.offsetLeft;
        mouseY = event.clientY - win.offsetTop;

        highestZ++;
        win.style.zIndex = highestZ;
    });


    document.addEventListener("mousemove", function (event) {

        if (!dragging) {
            return;
        }

        let x = event.clientX - mouseX;
        let y = event.clientY - mouseY;

        if (x < 0) {
            x = 0;
        }

        if (y < 0) {
            y = 0;
        }

        let maxX = window.innerWidth - win.offsetWidth;
        let maxY = window.innerHeight - 60 - win.offsetHeight;

        if (x > maxX) {
            x = maxX;
        }

        if (y > maxY) {
            y = maxY;
        }

        win.style.left = x + "px";
        win.style.top = y + "px";
    });


    document.addEventListener("mouseup", function () {
        dragging = false;
    });
});


/* CLOCK */

function updateClock() {

    let clock = document.getElementById("clock");
    let now = new Date();

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


/* TERMINAL */

let terminalInput = document.getElementById("terminal-input");
let terminalOutput = document.getElementById("terminal-output");
let terminalBody = document.querySelector(".terminal-body");

let history = [];
let historyIndex = -1;


terminalInput.addEventListener("keydown", function (event) {

    // previous command
    if (event.key === "ArrowUp") {

        event.preventDefault();

        if (history.length === 0) {
            return;
        }

        if (historyIndex === -1) {
            historyIndex = history.length - 1;
        } else if (historyIndex > 0) {
            historyIndex--;
        }

        terminalInput.value = history[historyIndex];

        return;
    }


    // next command
    if (event.key === "ArrowDown") {

        event.preventDefault();

        if (historyIndex === -1) {
            return;
        }

        if (historyIndex < history.length - 1) {
            historyIndex++;
            terminalInput.value = history[historyIndex];
        } else {
            historyIndex = -1;
            terminalInput.value = "";
        }

        return;
    }


    // enter
    if (event.key !== "Enter") {
        return;
    }

    let text = terminalInput.value.trim();

    if (text === "") {
        return;
    }

    printTerminal("AKASH@KIOOS> " + text);

    history.push(text);
    historyIndex = -1;

    runCommand(text.toLowerCase());

    terminalInput.value = "";
});


document.getElementById("terminal-window").addEventListener("mousedown", function () {
    setTimeout(function () {
        terminalInput.focus();
    }, 0);
});


function printTerminal(text) {

    let line = document.createElement("div");

    line.textContent = text;

    terminalOutput.appendChild(line);

    terminalBody.scrollTop = terminalBody.scrollHeight;
}


function runCommand(text) {

    let parts = text.split(" ");
    let command = parts[0];
    let args = parts.slice(1);


    if (command === "help") {

        printTerminal("");
        printTerminal("KioOS COMMANDS");
        printTerminal("----------------");
        printTerminal("help       show commands");
        printTerminal("clear      clear terminal");
        printTerminal("date       show date");
        printTerminal("time       show time");
        printTerminal("whoami     show user");
        printTerminal("version    show version");
        printTerminal("about      about KioOS");
        printTerminal("ls         list files");
        printTerminal("cd         change folder");
        printTerminal("pwd        show folder");
        printTerminal("cat        read file");
        printTerminal("echo       print text");
        printTerminal("calc       calculator");
        printTerminal("open       open app");
        printTerminal("neofetch   system info");
        printTerminal("history    command history");
        printTerminal("reboot     restart KioOS");

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
        printTerminal("Made with HTML, CSS and JavaScript.");

    } else if (command === "ls") {

        listFiles();

    } else if (command === "cd") {

        changeFolder(args[0]);

    } else if (command === "pwd") {

        printTerminal("/" + pathName(currentPath));

    } else if (command === "cat") {

        readFile(args.join(" "));

    } else if (command === "echo") {

        printTerminal(args.join(" "));

    } else if (command === "calc") {

        calculateTerminal(args.join(" "));

    } else if (command === "open") {

        if (args[0] && apps[args[0]]) {
            openApp(args[0]);
            printTerminal("Opening " + args[0].toUpperCase());
        } else {
            printTerminal("Use: open files");
        }

    } else if (command === "neofetch") {

        printTerminal("");
        printTerminal("KioOS");
        printTerminal("user: AKASH");
        printTerminal("version: 0.1");
        printTerminal("shell: kiosh");
        printTerminal("uptime: " + Math.floor(performance.now() / 1000) + "s");

    } else if (command === "history") {

        if (history.length === 0) {
            printTerminal("No commands yet");
        } else {
            history.forEach(function (item, index) {
                printTerminal(index + 1 + "  " + item);
            });
        }

    } else if (command === "reboot") {

        printTerminal("Rebooting KioOS...");

        setTimeout(function () {
            location.reload();
        }, 700);

    } else {

        printTerminal("COMMAND NOT FOUND: " + command);
    }
}


/* FILE SYSTEM */

const defaultFS = {
    type: "folder",

    children: {

        DOCUMENTS: {
            type: "folder",
            children: {}
        },

        PICTURES: {
            type: "folder",
            children: {}
        },

        DOWNLOADS: {
            type: "folder",
            children: {}
        },

        "README.TXT": {
            type: "file",

            content:
                "Welcome to KioOS.\n\n" +
                "This is a personal web OS.\n" +
                "Use FILES to manage files.\n" +
                "Use NOTES to write text."
        }
    }
};


function loadFiles() {

    let saved = localStorage.getItem("kioos-fs");

    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            console.log("Could not load files");
        }
    }

    return JSON.parse(JSON.stringify(defaultFS));
}


function saveFiles() {

    try {
        localStorage.setItem(
            "kioos-fs",
            JSON.stringify(fileSystem)
        );
    } catch {
        console.log("Could not save files");
    }
}


let fileSystem = loadFiles();
let currentPath = [];
let selectedName = null;


function getNode(path) {

    let node = fileSystem;

    for (let part of path) {

        if (!node.children || !node.children[part]) {
            return null;
        }

        node = node.children[part];
    }

    return node;
}


function pathName(path) {

    if (path.length === 0) {
        return "HOME";
    }

    return "HOME/" + path.join("/");
}


/* TERMINAL FILE COMMANDS */

function listFiles() {

    let node = getNode(currentPath);

    if (!node) {
        return;
    }

    let names = Object.keys(node.children || {});

    if (names.length === 0) {
        printTerminal("(empty folder)");
        return;
    }

    names.sort();

    names.forEach(function (name) {

        let item = node.children[name];

        if (item.type === "folder") {
            printTerminal(name + "/");
        } else {
            printTerminal(name);
        }
    });
}


function changeFolder(name) {

    if (!name || name === "~") {
        currentPath = [];
        renderFiles();
        return;
    }

    if (name === "..") {

        if (currentPath.length > 0) {
            currentPath.pop();
        }

        renderFiles();
        return;
    }

    let node = getNode(currentPath);
    let folder = name.toUpperCase();

    if (node.children[folder] &&
        node.children[folder].type === "folder") {

        currentPath.push(folder);
        renderFiles();

    } else {

        printTerminal("NO SUCH DIRECTORY: " + name);
    }
}


function readFile(name) {

    name = name.trim().toUpperCase();

    if (!name) {
        printTerminal("Use: cat filename");
        return;
    }

    let node = getNode(currentPath);

    if (node.children[name] &&
        node.children[name].type === "file") {

        let text = node.children[name].content;

        text.split("\n").forEach(function (line) {
            printTerminal(line);
        });

    } else {

        printTerminal("FILE NOT FOUND: " + name);
    }
}


function calculateTerminal(expression) {

    if (!expression) {
        printTerminal("Use: calc 5+5");
        return;
    }

    if (!/^[0-9+\-*/. ()]+$/.test(expression)) {
        printTerminal("ERROR: invalid characters");
        return;
    }

    try {

        let answer = Function(
            "return (" + expression + ")"
        )();

        printTerminal(String(answer));

    } catch {

        printTerminal("ERROR");
    }
}


/* FILE MANAGER */

let fileArea = document.getElementById("file-area");
let filePathLabel = document.getElementById("file-path-label");


function renderFiles() {

    let node = getNode(currentPath);

    if (!node) {
        node = fileSystem;
    }

    selectedName = null;

    fileArea.innerHTML = "";

    filePathLabel.textContent = pathName(currentPath);

    let names = Object.keys(node.children || {});


    if (names.length === 0) {

        let empty = document.createElement("div");

        empty.textContent = "(empty folder)";
        empty.style.color = "#555";
        empty.style.padding = "10px";

        fileArea.appendChild(empty);

        return;
    }


    names.sort();


    names.forEach(function (name) {

        let file = node.children[name];

        let item = document.createElement("div");

        item.className = "file-item";
        item.dataset.name = name;


        let icon = document.createElement("div");

        icon.className = "file-icon";

        if (file.type === "folder") {
            icon.textContent = "DIR";
        } else {
            icon.textContent = "TXT";
        }


        let label = document.createElement("span");

        label.textContent = name;


        item.appendChild(icon);
        item.appendChild(label);


        item.addEventListener("click", function () {

            document.querySelectorAll(".file-item").forEach(function (other) {
                other.classList.remove("selected");
            });

            item.classList.add("selected");

            selectedName = name;
        });


        item.addEventListener("dblclick", function () {

            if (file.type === "folder") {

                currentPath.push(name);

                renderFiles();

            } else {

                openFile(name);
            }
        });


        fileArea.appendChild(item);
    });
}


/* FILE SIDEBAR */

document.querySelectorAll(".file-sidebar [data-path]").forEach(function (item) {

    item.addEventListener("click", function () {

        let path = item.dataset.path;

        if (path === "") {
            currentPath = [];
        } else {
            currentPath = path.split("/");
        }

        renderFiles();
    });
});


/* UP BUTTON */

document.getElementById("fm-up").addEventListener("click", function () {

    if (currentPath.length > 0) {
        currentPath.pop();
        renderFiles();
    }
});


/* NEW FOLDER */

document.getElementById("fm-new-folder").addEventListener("click", function () {

    let name = prompt("Folder name:");

    if (!name) {
        return;
    }

    name = name.trim().toUpperCase();

    let node = getNode(currentPath);

    if (node.children[name]) {
        alert("Folder already exists.");
        return;
    }

    node.children[name] = {
        type: "folder",
        children: {}
    };

    saveFiles();
    renderFiles();
});


/* NEW FILE */

document.getElementById("fm-new-file").addEventListener("click", function () {

    let name = prompt("File name:", "UNTITLED.TXT");

    if (!name) {
        return;
    }

    name = name.trim().toUpperCase();

    if (!name.includes(".")) {
        name += ".TXT";
    }

    let node = getNode(currentPath);

    if (node.children[name]) {
        alert("File already exists.");
        return;
    }

    node.children[name] = {
        type: "file",
        content: ""
    };

    saveFiles();
    renderFiles();
});


/* DELETE */

document.getElementById("fm-delete").addEventListener("click", function () {

    if (!selectedName) {
        alert("Select a file first.");
        return;
    }

    if (!confirm("Delete " + selectedName + "?")) {
        return;
    }

    let node = getNode(currentPath);

    delete node.children[selectedName];

    selectedName = null;

    saveFiles();
    renderFiles();
});


renderFiles();


/* NOTES */

let notes = document.getElementById("notes-area");
let fileName = document.getElementById("editor-filename");
let editorStatus = document.getElementById("editor-status");

let editorFolder = [];


function editorMessage(text) {
    editorStatus.textContent = text;
}


function openFile(name) {

    let folder = getNode(currentPath);

    if (!folder || !folder.children[name]) {
        return;
    }

    let file = folder.children[name];

    if (file.type !== "file") {
        return;
    }

    editorFolder = currentPath.slice();

    fileName.value = name;
    notes.value = file.content;

    editorMessage("Opened " + name);

    openApp("notes");
}


/* NEW NOTE */

document.getElementById("editor-new").addEventListener("click", function () {

    notes.value = "";
    fileName.value = "UNTITLED.TXT";

    editorFolder = [];

    editorMessage("New file");
});


/* SAVE NOTE */

document.getElementById("editor-save").addEventListener("click", function () {

    let name = fileName.value.trim().toUpperCase();

    if (!name) {
        alert("Enter a filename.");
        return;
    }

    if (!name.includes(".")) {
        name += ".TXT";
    }

    fileName.value = name;

    let folder = getNode(editorFolder);

    if (!folder) {
        folder = fileSystem;
    }

    folder.children[name] = {
        type: "file",
        content: notes.value
    };

    saveFiles();

    editorMessage("Saved " + name);

    renderFiles();
});


/* DOWNLOAD NOTE */

document.getElementById("editor-download").addEventListener("click", async function () {

    let name = fileName.value.trim().toUpperCase();

    if (!name.includes(".")) {
        name += ".TXT";
    }

    try {

        const downloads = await claude.use("downloads");

        if (!downloads) {
            editorMessage("Download not available");
            return;
        }

        await downloads.save({
            filename: name,
            data: notes.value
        });

        editorMessage("Downloaded " + name);

    } catch {

        editorMessage("Download cancelled");
    }
});


/* CALCULATOR */

let calculator = document.getElementById("calculator-display");

document.querySelectorAll(".calculator-buttons button").forEach(function (button) {

    button.addEventListener("click", function () {

        let value = button.textContent;

        if (value === "C") {

            calculator.value = "";

        } else if (value === "=") {

            calculate();

        } else {

            calculator.value += value;
        }
    });
});


function calculate() {

    let expression = calculator.value;

    if (!expression) {
        return;
    }

    if (!/^[0-9+\-*/. ]+$/.test(expression)) {
        calculator.value = "ERROR";
        return;
    }

    try {

        calculator.value = Function(
            "return " + expression
        )();

    } catch {

        calculator.value = "ERROR";
    }
}


/* BROWSER */

let address = document.getElementById("address");
let browserPage = document.querySelector(".browser-page");


document.querySelector(".address-bar button:last-child")
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

    if (!url.startsWith("http://") &&
        !url.startsWith("https://")) {

        url = "https://" + url;
    }

    browserPage.innerHTML = "Opening " + url + "...";

    window.open(url, "_blank");
}


/* ESC KEY */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        startMenu.style.display = "none";
    }
});