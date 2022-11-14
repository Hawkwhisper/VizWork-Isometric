const { readdir, readFile, writeFile, readFileSync, writeFileSync } = require('fs');

const { floor, round, abs } = Math;

const rd = readdir;
const wf = writeFile;
const wfs = writeFileSync;
const rf = readFile;
const rfs = readFileSync;

var tileCanvas = null;
var mapCanvas = null;
var tileCtx = null;
var mapCtx = null;
var shouldClear = true;

var tileIndex = 0;

var tiles = [];
var layers = {
};

var layerConf = {
};

var clickableItems = [];

var busy = false;
var mouse = {
    x: 0,
    y: 0
}
var NOW_DRAWING = "";
gridSelector = new Image();
gridSelector.src = `${process.cwd()}/www/img/grid.png`;

function initializeTiles() {
    
    const { current_working_data } = require('../../_electron/main.js');
    rd(`${process.cwd()}/www/img/tiles`, (err, files) => {
        if (err) {
            alert('something went wrong lol');
        }

        let sub = 0;
        files.forEach((file, i) => {
            rd(`${process.cwd()}/www/img/tiles/${file}`, (err, files2) => {
                if (err) throw err;
                layers[file] = [];
                layerConf[file] = require(`${process.cwd()}/www/img/tiles/${file}/config.json`);
                files2.forEach((file2, i2) => {
                    if (file2.endsWith('.png')) {
                        const img = document.createElement('img');
                        img.src = `${process.cwd()}/www/img/tiles/${file}/${file2}`;

                        img.onclick = function () {
                            NOW_DRAWING = {
                                img,
                                file: file2,
                                id: layerConf[file].layer_z
                            }
                        }
                        layers[file].push({
                            path: img.src,
                            index: i - sub,
                            img: img
                        });
                    }
                })
            })
        })
    })
}

function drawCurrentTiles() {
    const lconf = Object.keys(layerConf);

    let lconfValues = [];
    lconf.forEach(l => {
        lconfValues.push({
            title: l,
            data: layerConf[l]
        });
    });

    lconfValues = lconfValues.sort((a, b) => b.layer_z - a.layer_z);
    console.log(lconfValues);
    document.querySelector('.sidebar').innerHTML = "";
    for (let z in lconfValues) {
        let i = lconfValues[z].title;
        const container = document.createElement('div');
        container.innerHTML = `<code>${i}</code><br>Layer ${layerConf[i].layer_z}<hr>`;

        document.querySelector('.sidebar').appendChild(container);
        for (let j = 0; j < layers[i].length; j++) {
            container.appendChild(layers[i][j].img);
            try {
            } catch (e) {
                console.log(layers[i][j].img);
            }
        }
    }
}

var camera = {
    x: 320,
    y: 240
}
function drawIsoGrid() {
    drawMapTiles();

    // mapCanvas.width = window.innerWidth - 224;
    // mapCanvas.height = window.innerHeight = 32;
    mapCtx.imageSmoothingEnabled = false;
    mapCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';

    for (let y = 0; y < current_map.height; y++) {
        for (let x = 0; x < current_map.width; x++) {
            let mx = (16 + (x * 32)) + camera.x;
            let my = (y * 16) + camera.y;
            mapCtx.moveTo(mx, my);
            mapCtx.lineTo(mx + 16, my + 8)
            mapCtx.lineTo(mx, my + 16);
            mapCtx.lineTo(mx - 16, my + 8);
            mapCtx.lineTo(mx, my);
        }
    }
    mapCtx.stroke();

    let xmouse = (round(mouse.editorX / 16) * 16);
    let ybmp = xmouse / 16 % 2 == 1 ? 0 : 8;
    let ymouse = (round(mouse.editorY / 16) * 16) - ybmp;
    if(NOW_DRAWING.img) mapCtx.drawImage(NOW_DRAWING.img, -16 + xmouse + camera.x % 32, -32 + ymouse + camera.y % 16);
    mapCtx.drawImage(gridSelector, -16 + xmouse + camera.x % 32, -16 + ymouse + camera.y % 16);
    const tilex = xmouse / 16;
    const tiley = ymouse / 8;

    if (current_map.mode == "draw") {
        if (!current_map.tiles[NOW_DRAWING.id]) current_map.tiles[NOW_DRAWING.id] = {};
        current_map.tiles[NOW_DRAWING.id][`${tilex}x${tiley}`] = {
            tile: NOW_DRAWING,
            x: -16 + xmouse + camera.x % 32,
            y: -32 + ymouse + camera.y % 16
        }
    }

}
function drawMapTiles() {
    for (let i in current_map.tiles) {
        for (let j in current_map.tiles[i]) {
            const xy = j.split('x').map(m => parseInt(m))
            let x = current_map.tiles[i][j].x;
            let y = current_map.tiles[i][j].y;
            mapCtx.drawImage(current_map.tiles[i][j].tile.img, x, y);
        }
    }
}

function drawCanvasContents() {
    drawIsoGrid();
}

function updateCanvasSize() {
    if (busy) return;
    if (shouldClear) {
        shouldClear = false;

        mapCanvas.width = mapCanvas.getBoundingClientRect().width / 2;
        mapCanvas.height = mapCanvas.getBoundingClientRect().height / 2;

        tileCanvas.width = tileCanvas.width;
        drawCanvasContents();
    }
}

function loop() {
    updateCanvasSize();
}

module.exports = {
    setCanvas: (_tileCanvas, _mapCanvas) => {
        tileCanvas = _tileCanvas;
        mapCanvas = _mapCanvas;
        tileCtx = tileCanvas.getContext('2d');
        mapCtx = mapCanvas.getContext('2d');
        mapCanvas.width = 640;
        mapCanvas.height = 360;

        mapCanvas.addEventListener('mousedown', (e) => {
            console.log(e);
            switch (e.button) {
                case 0:
                    current_map.mode = "draw";
                    break;

                case 2:
                    current_map.mode = "erase";
                    break;
            }
        });

        mapCanvas.addEventListener('mouseup', (e) => {
            current_map.mode = "none";
            console.log(current_map);
        });
        mapCanvas.addEventListener('mousemove', e => {
            mouse.editorX = (mapCanvas.width / mapCanvas.getBoundingClientRect().width) * e.layerX;
            mouse.editorY = (mapCanvas.height / mapCanvas.getBoundingClientRect().height) * e.layerY;
        })

        window.addEventListener('mousemove', (e) => {
            if (busy) return;
            shouldClear = true;
            let mapBounds = mapCanvas.getBoundingClientRect();
            mouse.x = e.clientX;
            mouse.y = e.clientY - 32;

            mouse.rx = (e.clientX + 32 - document.querySelector('.sidebar').getBoundingClientRect().width) / mapBounds.width;
            mouse.ry = (e.clientY + 16 - document.querySelector('footer').getBoundingClientRect().height) / mapBounds.height;

            let xhov = round(mouse.x / 32) * 32;
            let yhov = round(mouse.y / 32) * 32;
            clickableItems.forEach(item => {
                const ixhov = round(item.x / 32) * 32;
                const iyhov = round(item.y / 32) * 32;
                if (ixhov == xhov && iyhov == yhov) {
                    item.mouseOver();
                }
            })
        })

        window.addEventListener('resize', e => {
            shouldClear = true;
        });

        window.addEventListener('keydown', e => {
            if (busy) return;
            shouldClear = true;
            const { key } = e;
            switch (key) {
                case 'ArrowRight':
                    tileIndex++;
                    tileIndex = tileIndex % tiles.length;
                    break;

                case 'ArrowDown':
                    tileIndex += 6;
                    tileIndex = tileIndex % tiles.length;
                    break;

                case 'ArrowLeft':
                    tileIndex--;
                    if (tileIndex == -1) tileIndex += tiles.length;
                    break;

                case 'ArrowUp':
                    tileIndex -= 6;
                    if (tileIndex < 0) tileIndex += tiles.length;
                    break;
            }
        });

        initializeTiles();
    },
    loop,
    setBusy: tf => busy = tf,
    setCamera: (x, y) => {
        camera.x = x;
        camera.y = y;
    },
    drawCurrentTiles
};