const Menu = require('../../modules/menu');
const {readdir, readFile, writeFile, readFileSync, writeFileSync} = require('fs');
const rd = readdir;
const wf = writeFile;
const wfs = writeFileSync;
const rf = readFile;
const rfs = readFileSync;
const Scene = new class {

    initialize(current_working_data) {
        this.sidebar = document.querySelector('.sidebar');
        this.sidebar.innerHTML = "";
        this.menu = new Menu();
        this.menu.run(current_working_data, this);

        this._createItems(current_working_data);
        this.sidebar.appendChild(this.menu.container);
    }

    _createItems(current_working_data) {
            document.querySelector('.infoOverlay').innerHTML = "Select a map";
            const newitem = document.createElement('button');
        newitem.innerHTML = `New Map`;
        newitem.onclick = function() {
            showPopup("Create a new map");
        document.getElementById('img_slicer').style.display = 'none';
        document.getElementById('new_map').style.display = 'block';
        }
        newitem.classList.add('newmap');
        this.sidebar.appendChild(newitem);
        for(let i in current_working_data.files) {
            if(current_working_data.files[i].endsWith(".hwiso.json")) {
                this.menu.addItem({
                    label: `${current_working_data.files[i].substr(0, current_working_data.files[i].length-11)}`,
                    file: `${current_working_data.path}/${current_working_data.files[i]}`
                });
            }
        }
    }

    run(current_working_data) {
        this.initialize(current_working_data);
    }
}

module.exports = Scene;