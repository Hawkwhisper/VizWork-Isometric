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

    ipcRenderer.on(`img_export`, (event, dir3) => {
        let lowest_point_x = 0;
        let lowest_point_y = 0;

        let highest_point_x = 0;
        let highest_point_y = 0;

        let xbump = 0;
        let ybump = 0;

        current_map.tiles.forEach(layer => {
            for (let i in layer) {
                const xy = i.split('x').map(m => parseInt(m));
                xy[0] -= layer[i].tile.img.width;
                xy[1] -= layer[i].tile.img.height;

                if (layer[i].tile.img.width > xbump) xbump = layer[i].tile.img.width;
                if (layer[i].tile.img.height > ybump) ybump = layer[i].tile.img.height;

                if (xy[0] < lowest_point_x) lowest_point_x = xy[0];
                if (xy[1] < lowest_point_y) lowest_point_y = xy[1];

                if (xy[0] + (layer[i].tile.img.width * 2) > highest_point_x) highest_point_x = xy[0];
                if (xy[1] + (layer[i].tile.img.height * 2) > highest_point_y) highest_point_y = xy[1];
            }
        })
        const width = Math.abs(lowest_point_x) + Math.abs(highest_point_x) + 32;
        const height = Math.abs(lowest_point_y) + Math.abs(highest_point_y) + 32;


        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        const tempCanvas2 = document.createElement('canvas');
        const tempCtx2 = tempCanvas2.getContext('2d');

        tempCanvas2.width = width;
        tempCanvas2.height = height;

        current_map.tiles.forEach((layer, lid) => {
            tempCanvas.width = width;
            tempCanvas.height = height;
            for (let i in layer) {
                const xy = i.split('x').map(m => parseInt(m));
                if (xy[0] < lowest_point_x) lowest_point_x = xy[0];
                if (xy[1] < lowest_point_y) lowest_point_y = xy[1];

                if (xy[0] > highest_point_x) highest_point_x = xy[0];
                if (xy[1] > highest_point_y) highest_point_y = xy[1];
                try {
                    tempCtx.drawImage(layer[i].tile.img, xbump + xy[0], ybump + xy[1]);
                    tempCtx2.drawImage(layer[i].tile.img, xbump + xy[0], ybump + xy[1]);
                } catch (e) {
                }
            }
            const img_data = tempCanvas.toDataURL();
            const tempImg = new Image();
            tempImg.src = img_data;
            const tpath = `${require('os').homedir()}/${current_working_data.currentFile.split('/').pop()}_${lid}.png`;
            wf(tpath, Buffer.from(img_data.replace(/data\:image\/png\;base64\,/gm, ''), 'base64'), err3 => {
                if (err3) throw err3;
                console.log(`Saved at ${tpath}`);
            });
        })

        const img_data2 = tempCanvas2.toDataURL();
        const tempImg2 = new Image();
        tempImg2.src = img_data2;
        const tpath2 = `${require('os').homedir()}/${current_working_data.currentFile.split('/').pop()}_full.png`;
        wf(tpath2, Buffer.from(img_data2.replace(/data\:image\/png\;base64\,/gm, ''), 'base64'), err3 => {
            if (err3) throw err3;
            alert(`Image saved to ${require('os').homedir()}/ as ${tpath2}`);
        });
    })

    ipcRenderer.on('img_slc', (event, dir2) => {
        let path = dir2.filePaths[0];
        let fname = path.split('/').pop();
        let dir = path.split('/');
        dir.pop();
        dir = dir.join('/');
        showPopup("Processing Image...");
        document.getElementById('new_map').style.display = 'none';
        document.getElementById('img_slicer').style.display = 'block';
        const img = new Image();
        img.src = path;
        const canvas = document.getElementById('img_slice_canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0)
            let tx = 0;
            let ty = 0;
            let index = 0;
            let iv = setInterval(() => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 32;
                tempCanvas.height = 32;
                const tempCtx = tempCanvas.getContext('2d');

                tempCtx.drawImage(canvas, tx, ty, 32, 32, 0, 0, 32, 32);
                const img_data = tempCanvas.toDataURL();
                const tempImg = new Image();
                tempImg.src = img_data;
                wf(`${dir}/${fname}_${index}.png`, Buffer.from(img_data.replace(/data\:image\/png\;base64\,/gm, ''), 'base64'), err3 => {
                    if (err3) throw err3;
                    console.log(`Saved`)
                    tx += 32;
                    index++;
                    if (tx > img.width) {
                        tx = 0;
                        ty += 32;
                        if (ty > img.height) {
                            clearInterval(iv);
                            setTimeout(hidePopup, 1000);
                        }
                    }
                    document.getElementById('img_slice_prev').appendChild(tempImg);
                });

            }, 1000 / 60);
        }

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
        eventPositions: [],
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