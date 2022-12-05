const { readdir, readFile, writeFile, readFileSync, writeFileSync, mkdirSync } = require('fs');
const Scenes = require('../../scenes');

const { ceil, floor, round, abs, atan2, min, max, sin, cos } = Math;

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

function getTilePath() {
    let p = current_working_data.path.split('/');
    p.pop();
    p = p.join('/');
    try {
        mkdirSync(`${p}/img/tiles`);
    } catch(e){

    }
    return `${p}/img/tiles`;
}
function initializeTiles() {

    rd(`${getTilePath()}`, (err, files) => {
        if (err) {
            alert('something went wrong lol');
        }

        let sub = 0;
        files.forEach((file, i) => {
            rd(`${getTilePath()}/${file}`, (err, files2) => {
                if (err) throw err;
                layers[file] = [];
                try {
                    layerConf[file] = require(`${process.cwd()}/www/img/tiles/${file}/config.json`);
                } catch (e) {
                    layerConf[file] = {
                        "layer_z": 0,
                        "modeTrigger": "wall",
                        "collision": [false, false, false, false]
                    }
                }
                files2.forEach((file2, i2) => {
                    if (file2.endsWith('.png')) {
                        const img = document.createElement('img');
                        img.src = `${getTilePath()}/${file}/${file2}`;

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
var tileContainer;
var collisionContainer;

var layerTool = 0;
var layerToolArray = [];
var isFlag = false;
var isHeight = false;
(() => {
    let item = document.createElement('button');
    item.innerText = "Tiles";
    item.onclick = function () {
        layerToolArray[0].classList.add('selected');
        layerToolArray[1].classList.remove('selected');
        layerToolArray[2].classList.remove('selected');
        layerToolArray[3].classList.remove('selected');
        collisionContainer.style.display = 'none';
        tileContainer.style.display = 'block';
        flagContainer.style.display = 'none';
        heightContainer.style.display = 'none';
        isCollision = false;
        isFlag = false;
        isHeight = false;
    }
    layerToolArray.push(item);
})();

(() => {
    let item = document.createElement('button');
    item.innerText = "Collision";
    item.onclick = function () {
        layerToolArray[0].classList.remove('selected');
        layerToolArray[1].classList.add('selected');
        layerToolArray[2].classList.remove('selected');
        layerToolArray[3].classList.remove('selected');
        collisionContainer.style.display = 'block';
        tileContainer.style.display = 'none';
        flagContainer.style.display = 'none';
        heightContainer.style.display = 'none';
        isCollision = true;
        isFlag = false;
        isHeight = false;
    }
    layerToolArray.push(item);
})();

(() => {
    let item = document.createElement('button');
    item.innerText = "Flags";
    item.onclick = function () {
        layerToolArray[0].classList.remove('selected');
        layerToolArray[1].classList.remove('selected');
        layerToolArray[2].classList.add('selected');
        layerToolArray[3].classList.remove('selected');
        collisionContainer.style.display = 'none';
        tileContainer.style.display = 'none';
        flagContainer.style.display = 'block';
        heightContainer.style.display = 'none';
        isCollision = false;
        isFlag = true;
        isHeight = false;
    }
    layerToolArray.push(item);
})();

(() => {
    let item = document.createElement('button');
    item.innerText = "Height";
    item.onclick = function () {
        layerToolArray[0].classList.remove('selected');
        layerToolArray[1].classList.remove('selected');
        layerToolArray[2].classList.remove('selected');
        layerToolArray[3].classList.add('selected');
        collisionContainer.style.display = 'none';
        tileContainer.style.display = 'none';
        flagContainer.style.display = 'none';
        heightContainer.style.display = 'block';
        isCollision = false;
        isFlag = false;
        isHeight = true;
    }
    layerToolArray.push(item);
})();

(() => {
    let item = document.createElement('button');
    item.innerText = "Back";
    item.onclick = function () {
        const Scenes = require('../../scenes');
        Scenes.MapSelect.run(current_working_data);
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
        }
    }
    layerToolArray.push(item);
})();

var LOADED_EVENT_POSITIONS = [];


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

    tileContainer = document.createElement('div');
    tileContainer.classList.add('coreTileContainer');

    collisionContainer = document.createElement('div');
    collisionContainer.classList.add('coreTileContainer', 'hide');

    flagContainer = document.createElement('div');
    flagContainer.classList.add('coreTileContainer', 'hide');

    heightContainer = document.createElement('div');
    heightContainer.classList.add('coreTileContainer', 'hide');

    createCollisionSection();
    createFlagSection();
    createHeightSection();

    document.querySelector('.sidebar').appendChild(layerContainer);
    document.querySelector('.sidebar').appendChild(tileContainer);
    document.querySelector('.sidebar').appendChild(collisionContainer);
    document.querySelector('.sidebar').appendChild(flagContainer);
    document.querySelector('.sidebar').appendChild(heightContainer);
    for (let z in lconfValues) {
        let i = lconfValues[z].title;
        const container = document.createElement('div');
        const label = document.createElement('div');
        container.classList.add('tile_container');
        label.innerHTML = `<code>${i}</code><hr>`;

        tileContainer.appendChild(label);
        tileContainer.appendChild(container);
        for (let j = 0; j < layers[i].length; j++) {
            container.appendChild(layers[i][j].img);
            try {
            } catch (e) {
            }
        }
    }
}

var COLLISION_SELECTION = [
    false,
    false,
    false,
    false,
]

var FLAG_SECTION = [
]

var FLAG_CHILDREN = [

];

var HEIGHT_SECTION = [
]


var HEIGHT_CHILDREN = [

];

function createCollisionSection() {


    const buttonUp = document.createElement('button');
    const buttonDown = document.createElement('button');
    const buttonLeft = document.createElement('button');
    const buttonRight = document.createElement('button');

    buttonUp.innerHTML = `↖`
    buttonDown.innerHTML = `↘`
    buttonLeft.innerHTML = `↙`
    buttonRight.innerHTML = `↗`
    buttonUp.classList.add('icon');
    buttonDown.classList.add('icon');
    buttonLeft.classList.add('icon');
    buttonRight.classList.add('icon');

    buttonUp.addEventListener('click', () => {
        if (COLLISION_SELECTION[0]) {
            buttonUp.classList.remove('selected');
            COLLISION_SELECTION[0] = false;
        } else {
            buttonUp.classList.add('selected');
            COLLISION_SELECTION[0] = true;
        }
    })

    buttonLeft.addEventListener('click', () => {
        if (COLLISION_SELECTION[1]) {
            buttonLeft.classList.remove('selected');
            COLLISION_SELECTION[1] = false;
        } else {
            buttonLeft.classList.add('selected');
            COLLISION_SELECTION[1] = true;
        }
    })

    buttonDown.addEventListener('click', () => {
        if (COLLISION_SELECTION[2]) {
            buttonDown.classList.remove('selected');
            COLLISION_SELECTION[2] = false;
        } else {
            buttonDown.classList.add('selected');
            COLLISION_SELECTION[2] = true;
        }
    })

    buttonRight.addEventListener('click', () => {
        if (COLLISION_SELECTION[3]) {
            buttonRight.classList.remove('selected');
            COLLISION_SELECTION[3] = false;
        } else {
            buttonRight.classList.add('selected');
            COLLISION_SELECTION[3] = true;
        }
    })

    const bu_container = document.createElement('div');

    bu_container.appendChild(buttonUp);
    bu_container.appendChild(buttonLeft);
    bu_container.appendChild(buttonDown);
    bu_container.appendChild(buttonRight);

    collisionContainer.appendChild(bu_container);

}


const flagList = [
    "Stairs",
    "Ladder",
    "Water",
    "Rock",
    "Wood",
    "Metal",
    "Glass"
]
function createFlagSection() {
    for (let i = 0; i < 50; i++) {
        const item = document.createElement('button');
        item.classList.add('icon');
        item.innerHTML = `${i}`

        item.addEventListener('click', () => {
            if (item.classList.contains('selected')) {
                item.classList.remove('selected');
            } else {
                item.classList.add('selected');
            }
        })

        flagContainer.appendChild(item);
        FLAG_CHILDREN.push(item);
    }
}

function createHeightSection() {
    for (let i = 0; i < 50; i++) {
        const item = document.createElement('button');
        item.classList.add('icon');
        item.innerHTML = `${i}`

        item.addEventListener('click', () => {
            HEIGHT_CHILDREN.forEach(c => c.classList.remove('selected'));
            item.classList.add('selected');
        })

        heightContainer.appendChild(item);
        HEIGHT_CHILDREN.push(item);
    }
}

var camera = {
    x: 320,
    y: 240,
    z: 3
}

var PREVIEW = false;

function drawIsoGrid() {
    drawMapTiles();
    if (!current_map.tiles[DRAW_LAYER]) current_map.tiles[DRAW_LAYER] = {};
    DRAW_LAYER = parseInt(layerInput.value);
    // mapCanvas.width = window.innerWidth - 224;
    // mapCanvas.height = window.innerHeight = 32;
    mapCtx.imageSmoothingEnabled = false;
    mapCtx.beginPath();
    mapCtx.strokeStyle = 'rgba(155, 155, 155, 0.5)';
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

    const posx = -16 + xmouse - floor((camera.x % 32));
    const posy = -32 + ymouse - floor((camera.y % 16));

    if (NOW_DRAWING.img) mapCtx.drawImage(NOW_DRAWING.img, posx, posy);
    mapCtx.drawImage(gridSelector, posx, -16 + ymouse - camera.y % 16);
    const tilex = (posx + ((camera.x / 32) * 32));
    const tiley = (posy + ((camera.y / 16) * 16));

    mouse.tileX = floor((ceil(xmouse / 32) * 32 + camera.x) / 32);
    mouse.tileY = floor((ceil(ymouse / 16) * 16 + camera.y) / 16);
    document.getElementById(`footer_text`).innerHTML = `Position: x: ${mouse.tileX}, y:${mouse.tileY}`

    if (current_map.mode == "draw") {
        if (!current_map.tiles[DRAW_LAYER]) current_map.tiles[DRAW_LAYER] = {};
        switch (layerTool) {
            //Pen
            case 0:
                current_map.tiles[DRAW_LAYER][`${tilex}x${tiley}`] = {
                    tile: NOW_DRAWING,
                    x: tilex,
                    y: tiley
                }
                break;
        }
    }

    if (current_map.mode == "flags") {
        if (!current_map.flags[DRAW_LAYER]) current_map.flags[DRAW_LAYER] = {};
        switch (layerTool) {
            //Pen
            case 0:
                current_map.flags[DRAW_LAYER][`${tilex}x${tiley}`] = {
                    x: tilex,
                    y: tiley,
                    data: FLAG_SECTION.join(':')
                };
                break;
        }
    }

    if (current_map.mode == "collision") {
        if (!current_map.collisionData[DRAW_LAYER]) current_map.collisionData[DRAW_LAYER] = {};
        switch (layerTool) {
            //Pen
            case 0:
                current_map.collisionData[DRAW_LAYER][`${tilex}x${tiley}`] = {
                    nw: COLLISION_SELECTION[0],
                    sw: COLLISION_SELECTION[1],
                    se: COLLISION_SELECTION[2],
                    ne: COLLISION_SELECTION[3],
                }
                break;
        }
    }

    if (current_map.mode == "height") {
        if (!current_map.heightData[DRAW_LAYER]) current_map.heightData[DRAW_LAYER] = {};
        switch (layerTool) {
            //Pen
            case 0:
                current_map.heightData[DRAW_LAYER][`${tilex}x${tiley}`] = {
                    x: tilex,
                    y: tiley,
                    data: HEIGHT_SECTION.join(':')
                };
                break;
        }
    }

    if (current_map.mode == "erase") {
        if (!current_map.tiles[DRAW_LAYER]) current_map.tiles[DRAW_LAYER] = {};
        if (isCollision) {
            switch (layerTool) {
                case 0:
                    delete current_map.collisionData[DRAW_LAYER][`${tilex}x${tiley}`];
                    break;
            }
        } else if (isFlag) {
            delete current_map.flags[DRAW_LAYER][`${tilex}x${tiley}`];
        } else if (isHeight) {
            delete current_map.heightData[DRAW_LAYER][`${tilex}x${tiley}`];
        } else {
            switch (layerTool) {
                case 0:
                    delete current_map.tiles[DRAW_LAYER][`${tilex}x${tiley}`];
                    break;
            }
        }
    }

}
var isCollision = false;
const collisionIcon = new Image();
collisionIcon.src = `${process.cwd()}/www/img/collision_icon.png`
function drawMapTiles() {
    for (let i in current_map.tiles) {
        if (Number(i) != DRAW_LAYER && !PREVIEW && !isCollision && !isFlag && !isHeight) {
            mapCtx.globalAlpha = 0.5;
        } else {
            mapCtx.globalAlpha = 1;
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
                    current_map.tiles[i][j].tile.img.src = `${current_working_data.path.replace('/data', '')}/${current_map.tiles[i][j].tile.file}`
                    mapCtx.drawImage(current_map.tiles[i][j].tile.img, x, y);

                } catch (e) {
                }
            }
        }
    }
    mapCtx.globalAlpha = 1;

    for (let i in current_map.collisionData) {
        if (Number(i) != DRAW_LAYER && !PREVIEW) {
            mapCtx.globalAlpha = 0.5;
        }
        if (!isCollision) {
            mapCtx.globalAlpha = 0.25;
        }
        for (let j in current_map.collisionData[i]) {
            const xy = j.split('x').map(m => parseInt(m))
            let x = xy[0] - camera.x;
            let y = xy[1] - camera.y;
            try {

                mapCtx.drawImage(collisionIcon, x, y);
                y += 16;
                mapCtx.font = `16px Monospace`;
                if (current_map.collisionData[i][j].nw) {
                    mapCtx.strokeStyle = '#00ff00';
                } else {
                    mapCtx.strokeStyle = '#ff0000';
                }
                mapCtx.beginPath();
                mapCtx.moveTo(x + 16, y + 8);
                mapCtx.lineTo(x + 8, y + 4);
                mapCtx.stroke();

                if (current_map.collisionData[i][j].sw) {
                    mapCtx.strokeStyle = '#00ff00';
                } else {
                    mapCtx.strokeStyle = '#ff0000';
                }
                mapCtx.beginPath();
                mapCtx.moveTo(x + 16, y + 8);
                mapCtx.lineTo(x + 8, y + 12);
                mapCtx.stroke();

                if (current_map.collisionData[i][j].se) {
                    mapCtx.strokeStyle = '#00ff00';
                } else {
                    mapCtx.strokeStyle = '#ff0000';
                }
                mapCtx.beginPath();
                mapCtx.moveTo(x + 16, y + 8);
                mapCtx.lineTo(x + 24, y + 12);
                mapCtx.stroke();

                if (current_map.collisionData[i][j].ne) {
                    mapCtx.strokeStyle = '#00ff00';
                } else {
                    mapCtx.strokeStyle = '#ff0000';
                }
                mapCtx.beginPath();
                mapCtx.moveTo(x + 16, y + 8);
                mapCtx.lineTo(x + 24, y + 4);
                mapCtx.stroke();

            } catch (e) {

            }
        }
    }
    mapCtx.globalAlpha = 1;

    for (let i = 0; i < FLAG_CHILDREN.length; i++) {
        if (FLAG_CHILDREN[i].classList.contains("selected")) {
            FLAG_SECTION[i] = true;
        } else {
            delete FLAG_SECTION[i];
        }
    }

    for (let i = 0; i < HEIGHT_CHILDREN.length; i++) {
        if (HEIGHT_CHILDREN[i].classList.contains("selected")) {
            HEIGHT_SECTION[i] = true;
        } else {
            delete HEIGHT_SECTION[i];
        }
    }
    for (let i in current_map.heightData) {
        if (Number(i) != DRAW_LAYER && !PREVIEW) {
            mapCtx.globalAlpha = 0.5;
        } else {
            mapCtx.globalAlpha = 1;
        }
        if (!isHeight) {
            mapCtx.globalAlpha = 0.25;
        }
        for (let j in current_map.heightData[i]) {
            const xy = j.split('x').map(m => parseInt(m))
            let x = xy[0] - camera.x;
            let y = xy[1] - camera.y;
            mapCtx.drawImage(collisionIcon, x, y);
            mapCtx.font = `8px monospace`;
            let list = [];
            let str = current_map.heightData[i][j].data.split(':');
            str.forEach((a, b) => {
                if (a) {
                    list.push(`${b}`)
                }
            });
            list.forEach((l, ind) => {
                let _x = (x + 16) + (ind * 16);
                mapCtx.strokeStyle = '#004fff';
                mapCtx.beginPath();
                mapCtx.moveTo(_x + 8, y + 16);
                mapCtx.lineTo(x + 16, y + 24);
                mapCtx.stroke();
                mapCtx.strokeStyle = '#ffffff';
                mapCtx.fillStyle = '#ffff00';
                mapCtx.fillRect(_x - 2, y + 6, 22, 12);
                mapCtx.fillStyle = '#000000';
                mapCtx.strokeText(`^ ${l}`, _x, y + 16);
                mapCtx.fillText(`^ ${l}`, _x, y + 16);
            })
        }
    }
    mapCtx.globalAlpha = 1;
    for (let i in current_map.flags) {
        if (Number(i) != DRAW_LAYER && !PREVIEW) {
            mapCtx.globalAlpha = 0.5;
        }else {
            mapCtx.globalAlpha = 1;
        }
        if (!isFlag) {
            mapCtx.globalAlpha = 0.25;
        }
        for (let j in current_map.flags[i]) {
            const xy = j.split('x').map(m => parseInt(m))
            let x = xy[0] - camera.x;
            let y = xy[1] - camera.y;
            mapCtx.drawImage(collisionIcon, x, y);
            mapCtx.font = `8px monospace`;
            let list = [];
            let str = current_map.flags[i][j].data.split(':');
            str.forEach((a, b) => {
                if (a) {
                    list.push(`${b}`)
                }
            });
            list.forEach((l, ind) => {
                let _x = (x + 16) + (ind * 16);
                mapCtx.strokeStyle = '#004fff';
                mapCtx.beginPath();
                mapCtx.moveTo(_x + 8, y + 16);
                mapCtx.lineTo(x + 16, y + 24);
                mapCtx.stroke();
                mapCtx.strokeStyle = '#ffffff';
                mapCtx.fillStyle = '#990099';
                mapCtx.fillRect(_x - 2, y + 6, 10, 12);
                mapCtx.fillStyle = '#000000';
                mapCtx.strokeText(`${l}`, _x, y + 16);
                mapCtx.fillText(`${l}`, _x, y + 16);
            })
        }
    }
    mapCtx.globalAlpha = 1;
}

function drawCanvasContents() {
    drawIsoGrid();
}

function updateCanvasSize() {
    if (busy) return;
    if (shouldClear) {
        shouldClear = false;

        mapCanvas.width = mapCanvas.getBoundingClientRect().width / camera.z;
        mapCanvas.height = mapCanvas.getBoundingClientRect().height / camera.z;

        tileCanvas.width = tileCanvas.width;
        drawCanvasContents();
    }
}
var KEYPRESS = {};
var CAMERA_SPEED = 3;
function loop() {

    if (KEYPRESS['shift']) {
        CAMERA_SPEED = max(5 / camera.z, 3);
    } else {
        CAMERA_SPEED = max(3 / camera.z, 3);
    }
    if (KEYPRESS['w']) {
        shouldClear = true;
        camera.y -= CAMERA_SPEED;
    }

    if (KEYPRESS['s']) {
        shouldClear = true;
        camera.y += CAMERA_SPEED;
    }

    if (KEYPRESS['a']) {
        shouldClear = true;
        camera.x -= CAMERA_SPEED;
    }

    if (KEYPRESS['d']) {
        shouldClear = true;
        camera.x += CAMERA_SPEED;
    }

    if (KEYPRESS['tab']) {
        PREVIEW = true;
    } else {
        PREVIEW = false;
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

        mapCanvas.addEventListener('keydown', (e) => {
            if (e.key == 'Tab') {
                e.preventDefault();
            }
        })
        mapCanvas.addEventListener('mousedown', (e) => {
            shouldClear = true;
            mouse.editorClickX = (mapCanvas.width / mapCanvas.getBoundingClientRect().width) * e.layerX;
            mouse.editorClickY = (mapCanvas.height / mapCanvas.getBoundingClientRect().height) * e.layerY;
            mouse.leftPressed = e.button == 0 ? true : mouse.leftPressed;
            mouse.currentlyDragging = null;

            switch (e.button) {
                case 0:
                    current_map.mode = isCollision ? "collision" : isFlag ? "flags" : "draw";
                    if(isHeight) current_map.mode = "height";
                    break;

                case 2:
                    current_map.mode = "erase";
                    break;
            }
        });

        mapCanvas.addEventListener('wheel', e => {
            const { deltaY } = e;
            if (deltaY < 0) {
                camera.z += 0.25;
            }
            if (deltaY > 0) {
                camera.z -= 0.25;
            }
            camera.z = min(max(camera.z, 0.5), 4);
            shouldClear = true;
        })

        mapCanvas.addEventListener('mouseup', (e) => {
            current_map.mode = "none";
            mouse.leftPressed = e.button == 0 ? false : mouse.leftPressed;
            mouse.editorClickReleaseX = (mapCanvas.width / mapCanvas.getBoundingClientRect().width) * e.layerX;
            mouse.editorClickReleaseY = (mapCanvas.height / mapCanvas.getBoundingClientRect().height) * e.layerY;
        });
        mapCanvas.addEventListener('mousemove', e => {
            mouse.editorX = (mapCanvas.width / mapCanvas.getBoundingClientRect().width) * (e.layerX - 8);
            mouse.editorY = (mapCanvas.height / mapCanvas.getBoundingClientRect().height) * (e.layerY + 16);
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

        window.addEventListener('keyup', e => {
            KEYPRESS[e.key.toLowerCase()] = false;
        })
        window.addEventListener('keydown', e => {
            if (busy) return;
            KEYPRESS[e.key.toLowerCase()] = true;
            if (e.key == 'Tab') {
                e.preventDefault();
            }
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
    clearCanvas() {
        mapCanvas.width = 1;
    },
    drawCurrentTiles
};