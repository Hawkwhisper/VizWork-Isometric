const args = process.argv.slice(2, process.argv.length).join(' ').split(',').map(a=>a.split('='));
console.log(args);