const fs = require('fs');
const { setBusy, setCamera, drawCurrentTiles } = require('../canvas');

class Menu {

    run(current_working_data, core) {
        this.current_working_data = current_working_data;
        this.core = core;
        this.initialize();
        this.createDomElements();
    }

    initialize() {
        this.items = [];
    }

    createDomElements() {
        this.container = document.createElement('ul');
        this.container.classList.add('hw_ul');
    }
    
    /**
     * Add items
     */
    addItem(data={
        label: "",
        file: "",
    }) {
        const {label, file} = data;
        let li = document.createElement('li');
        let div1 = document.createElement('div');
        div1.addEventListener("click", function() {
            current_map = JSON.parse(fs.readFileSync(file, 'utf-8'));
            setBusy(false);
            setCamera(32, 16);
            document.querySelector('.sidebar').innerHTML = '';
            drawCurrentTiles();
            document.querySelector('.editSection').classList.add('tile_select');
            document.querySelector('.infoOverlay').innerHTML = "Editing Map";
            current_working_data.currentFile = file;
        });
        div1.innerHTML = label;
        let div2 = this._createDeleteButtons(file);

        li.appendChild(div1);
        li.appendChild(div2);

        this.container.appendChild(li);

        this.items.push(li);
    }

    _createDeleteButtons(fileLink) {
        let div = document.createElement('div');
        div.classList.add('half');

        let edit = document.createElement('button');
        edit.innerHTML = `⚙`;
        let del = document.createElement('button');
        del.innerHTML = `🗑`;

        div.appendChild(edit);
        div.appendChild(del);

        edit.addEventListener('click', () => {

        });
        del.addEventListener('click', () => {
            if(confirm(`Are you sure you want to delete the map ${fileLink.split('/').pop()}?`)) {
                fs.unlink(`${fileLink}`, (err)=>{
                    if(err) alert(err);
                    this.current_working_data.files = fs.readdirSync(`${this.current_working_data.path}`)
                    this.core.run(this.current_working_data);
                })
            } else {
               
            }
        });

        return div;
    }
}

module.exports = Menu;