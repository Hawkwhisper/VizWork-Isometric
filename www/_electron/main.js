const { ipcRenderer } = require('electron')
const {readdir, readFile, writeFile, readFileSync, writeFileSync} = require('fs');

const rd = readdir;

const wf = writeFile;
const wfs = writeFileSync;

const rf = readFile;
const rfs = readFileSync;

var current_working_data = {
    path: "",
    files: [],

    editMode: "mapSelect",
}

const canvas = document.createElement('canvas');
const render = canvas.getContext('2d');

ipcRenderer.on('proj', (event, dir) => {
    let path = dir.filePaths[0];
    rd(path, (err, files1) => {
        if(err) {
            throw err;
        }

        rd(`${path}/data`, (err, files2) => {
            if(err) alert(`No data folder found.`)
            current_working_data.path = `${path}/data`;
            current_working_data.files = files2;

            console.log(current_working_data);

            document.querySelector(`.editSection`).style.display = 'grid';
            document.querySelector('.infoOverlay').innerHTML = "Select a map";

            document.getElementById('canvas_container').appendChild(canvas);
            setInterval(loop, 1000/60);
        });

    })
});

function updateCanvasSize() {
    canvas.width = document.querySelector('.infoOverlay').getBoundingClientRect().width;
    canvas.height = document.querySelector('.infoOverlay').getBoundingClientRect().height;
    drawCanvasContents();
}

function drawCanvasContents() {};

function loop() {
    updateCanvasSize();
}