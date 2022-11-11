class Menu {
    constructor() {
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
            alert(file)
        });
        div1.innerHTML = label;
        let div2 = this._createDeleteButtons();

        li.appendChild(div1);
        li.appendChild(div2);

        this.container.appendChild(li);

        this.items.push(li);
    }

    _createDeleteButtons() {
        let div = document.createElement('div');
        div.classList.add('half');

        let edit = document.createElement('button');
        edit.innerHTML = `⚙`;
        let del = document.createElement('button');
        del.innerHTML = `🗑`;

        div.appendChild(edit);
        div.appendChild(del);

        edit.addEventListener('click', function() {

        });
        del.addEventListener('click', function() {
            if(confirm(`Are you sure you want to delete this item?`)) {
            } else {
            }
        });

        return div;
    }
}

module.exports = Menu;