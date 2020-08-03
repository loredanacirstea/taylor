const KEY = 'luxor';
const getkey = name => KEY + '_' + name;

const set = (name, state) => {
    if (!(state instanceof Object)) return; 
    localStorage.setItem(getkey(name), JSON.stringify(state));
}

const get = name => {
    let data = localStorage.getItem(getkey(name));
    try {
        data = JSON.parse(data);
    } catch(e) {
        console.log(data, e);
        return null;
    }
    return data;
}

export default { set, get };
