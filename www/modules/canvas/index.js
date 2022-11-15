const { readdir, readFile, writeFile, readFileSync, writeFileSync } = require('fs');

const { floor, round, abs, atan2 } = Math;

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
                                file: `img/tiles/${file}/${file2}`,
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
var DRAW_LAYER = 0;

var layerContainer
var layerLabel
var layerInput

var layerTool = 0;
var layerToolArray = [];
(() => {
    let item = document.createElement('button');
    item.innerText = "Back";
    item.onclick = function () {
    }
    layerToolArray.push(item);
})();

(() => {
    let item = document.createElement('button');
    item.innerText = "Save";
    item.onclick = function () {
        try {
            wfs(current_working_data.currentFile, JSON.stringify(current_map));
        } catch (e) {
            console.log(e);
        }
    }
    layerToolArray.push(item);
})();

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

    layerContainer = document.createElement('div');
    layerContainer.classList.add('half');
    layerLabel = document.createElement('span');
    layerLabel.innerHTML = `Layer`;
    layerInput = document.createElement('input');
    layerInput.type = 'number';
    layerInput.value = 0;

    layerContainer.appendChild(layerLabel);
    layerContainer.appendChild(layerInput);

    for (let i = 0; i < layerToolArray.length; i++) {
        layerContainer.appendChild(layerToolArray[i]);
        if (i == layerTool) {
            layerToolArray[i].classList.add('selected');
        } else {
            layerToolArray[i].classList.remove('selected');
        }
    }

    document.querySelector('.sidebar').appendChild(layerContainer);
    for (let z in lconfValues) {
        let i = lconfValues[z].title;
        const container = document.createElement('div');
        container.innerHTML = `<code>${i}</code><hr>`;

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
    if (!current_map.tiles[DRAW_LAYER]) current_map.tiles[DRAW_LAYER] = {};
    DRAW_LAYER = parseInt(layerInput.value);
    // mapCanvas.width = window.innerWidth - 224;
    // mapCanvas.height = window.innerHeight = 32;
    mapCtx.imageSmoothingEnabled = false;
    mapCtx.beginPath();
    mapCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    mapCtx.lineWidth = 1;
    for (let y = 0; y < current_map.height; y++) {
        for (let x = 0; x < current_map.width; x++) {
            let mx = (16 + (x * 32)) - camera.x;
            let my = (y * 16) - camera.y;
            mapCtx.moveTo(mx, my);
            mapCtx.lineTo(mx + 16, my + 8)
            mapCtx.lineTo(mx, my + 16);
            mapCtx.lineTo(mx - 16, my + 8);
            mapCtx.lineTo(mx, my);
        }
    }
    mapCtx.stroke();

    let xmouse = (floor(mouse.editorX / 16) * 16);
    let ybmp = xmouse / 16 % 2 == 1 ? 0 : 8;
    let ymouse = (floor((mouse.editorY + ybmp) / 16) * 16) - ybmp;

    const posx = -16 + xmouse - (camera.x % 32);
    const posy = -32 + ymouse - (camera.y % 16);

    if (NOW_DRAWING.img) mapCtx.drawImage(NOW_DRAWING.img, posx, posy);
    mapCtx.drawImage(gridSelector, posx, -16 + ymouse - camera.y % 16);
    const tilex = floor(posx + ((camera.x/32)*32));
    const tiley = floor(posy + ((camera.y/16)*16));

    if (current_map.mode == "draw") {
        if (!current_map.tiles[DRAW_LAYER]) current_map.tiles[DRAW_LAYER] = {};
        switch (layerTool) {
            //Pen
            case 0:
                current_map.tiles[DRAW_LAYER][`${tilex}x${tiley}`] = {
                    tile: NOW_DRAWING,
                    x: floor(posx + ((camera.x/32)*32)),
                    y: floor(posy + ((camera.y/16)*16))
                }
                break;
        }
    }

    if (current_map.mode == "erase") {
        if (!current_map.tiles[DRAW_LAYER]) current_map.tiles[DRAW_LAYER] = {};
        switch (layerTool) {
            case 0:
                console.log(tilex, tiley, current_map.tiles[DRAW_LAYER], current_map.tiles[DRAW_LAYER][`${tilex}x${tiley}`])
                delete current_map.tiles[DRAW_LAYER][`${tilex}x${tiley}`];
                break;
        }
    }

}
function drawMapTiles() {
    for (let i in current_map.tiles) {
        if(Number(i) != DRAW_LAYER) {
            mapCtx.globalAlpha = 0.5;
        }
        for (let j in current_map.tiles[i]) {
            const xy = j.split('x').map(m => parseInt(m))
            let x = current_map.tiles[i][j].x - camera.x;
            let y = current_map.tiles[i][j].y - camera.y;
            try {
                mapCtx.drawImage(current_map.tiles[i][j].tile.img, x, y);
            } catch (e) {
                try {
                    current_map.tiles[i][j].tile.img = new Image();
                    current_map.tiles[i][j].tile.img.src = `${process.cwd()}/www/${current_map.tiles[i][j].tile.file}`
                    mapCtx.drawImage(current_map.tiles[i][j].tile.img, x, y);
                   
                } catch (e) {
                }
            }
        }
        mapCtx.globalAlpha = 1;
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
var KEYPRESS = {};
function loop() {
    if (KEYPRESS['w']) {
        shouldClear = true;
        camera.y -= 3;
    }

    if (KEYPRESS['s']) {
        shouldClear = true;
        camera.y += 3;
    }

    if (KEYPRESS['a']) {
        shouldClear = true;
        camera.x -= 3;
    }

    if (KEYPRESS['d']) {
        shouldClear = true;
        camera.x += 3;
    }
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
            shouldClear = true;
            mouse.editorClickX = (mapCanvas.width / mapCanvas.getBoundingClientRect().width) * e.layerX;
            mouse.editorClickY = (mapCanvas.height / mapCanvas.getBoundingClientRect().height) * e.layerY;
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
            mouse.editorClickReleaseX = (mapCanvas.width / mapCanvas.getBoundingClientRect().width) * e.layerX;
            mouse.editorClickReleaseY = (mapCanvas.height / mapCanvas.getBoundingClientRect().height) * e.layerY;
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
        })

        window.addEventListener('resize', e => {
            shouldClear = true;
        });

        window.addEventListener('keypress', e => {
            KEYPRESS[e.key] = true;
        });
        window.addEventListener('keyup', e=>{
            KEYPRESS[e.key] = false;
        })
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