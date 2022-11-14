const { ipcRenderer } = require('electron')
const Scenes = require('../scenes');
const { readdir, readFile, writeFile, readFileSync, writeFileSync } = require('fs');
const { setCanvas, loop, setBusy } = require('../modules/canvas');
setBusy(true);
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
function main() {

    const tileCanvas = document.createElement('canvas');
    const mapCanvas = document.createElement('canvas');
    mapCanvas.classList.add('full');

    var interval = "";

    rf(`./save.json`, 'utf-8', (err, data) => {
        if (err) return;
        data = JSON.parse(data);
        const path = data.current_dir;
        rd(`${path}/data`, (err, files) => {
            if (err) throw err;
            current_working_data.path = `${path}/data`;
            current_working_data.files = files;

            console.log(current_working_data);

            document.querySelector(`.editSection`).style.display = 'grid';
            document.querySelector('.infoOverlay').innerHTML = "Select a map";

            document.getElementById('canvas_container').appendChild(tileCanvas);
                        document.getElementById('canvas_container').appendChild(mapCanvas);
            try {
                clearInterval(interval);
            } catch (e) {

            }
            setCanvas(tileCanvas, mapCanvas);
            interval = setInterval(loop, 1000 / 60);
            Scenes.MapSelect.run(current_working_data);
        })
    });

    ipcRenderer.on('proj', (event, dir) => {
        let path = dir.filePaths[0];
        rd(path, (err, files1) => {
            if (err) {
                throw err;
            }

            rd(`${path}/data`, (err, files2) => {
                if (err) alert(`No data folder found.`);
                current_working_data.path = `${path}/data`;
                current_working_data.files = files2;

                console.log(current_working_data);

                document.querySelector(`.editSection`).style.display = 'grid';
                document.querySelector('.infoOverlay').innerHTML = "Select a map";

                document.getElementById('canvas_container').appendChild(tileCanvas);
                                document.getElementById('canvas_container').appendChild(mapCanvas);
                try {
                    clearInterval(interval);
                } catch (e) {

                }
                setCanvas(tileCanvas, mapCanvas);
                interval = setInterval(loop, 1000 / 60);
                Scenes.MapSelect.run(current_working_data);

                wfs(`./save.json`, JSON.stringify({
                    current_dir: `${path}`
                }));
            });

        })
    });

    
}
function showPopup(title) {
    document.querySelector('.popup').style.display = "block";
    document.getElementById('pop_title').innerHTML = title;
}

function hidePopup() {
    document.querySelector('.popup').style.display = "none";
}

function processNewMap() {
    const name = document.getElementById('nm_name').value;
    const width = Number(document.getElementById('nm_dx').value);
    const height = Number(document.getElementById('nm_dy').value);
    wf(`${current_working_data.path}/${name}.hwiso.json`, JSON.stringify({
        tiles: [],
        width, height
    }), err => {
        if (err) throw err;
        hidePopup();
        current_working_data.files.push(`${name}.hwiso.json`)
        Scenes.MapSelect.run(current_working_data);
    });
}
module.exports = {
    showPopup,
    hidePopup,
    processNewMap,
    current_working_data,
    main
}