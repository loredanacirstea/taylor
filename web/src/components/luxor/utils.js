import taylor from '@pipeos/taylor';
import { WETH_EXAMPLE } from './fixtures.js';

export const MARKER_JS = '=';
export const MARKER_WEB3 = '$';

// A <-> 1, not from 0
export const numberToLetter = ci => String.fromCharCode(64 + ci);
export const letterToNumber = letter => letter.charCodeAt(0) - 64;
export const keyToL = (row, col) => `${numberToLetter(col)}${row}`;
const _lkeyToKey = lkey => {
    if (!lkey) return lkey;
    if (parseInt(lkey)) return `;${lkey}`;
    return letterToNumber(lkey) + _lkeyToKey(lkey.substring(1));
}
export const lkeyToKey = lkey => _lkeyToKey(lkey).split(';').reverse().join(';');

function rightPadArray(value, size, content='') {
    const vsize = value.length;
    if (vsize >= size || !size) return value;
    return JSON.parse(JSON.stringify(
        value.concat([...new Array(size - vsize)].map(_ => content))
    ));
}

function stripNL(source) {
    return source.replace(/\s{1,}/g, ' ');
}

export function luxorTestsData(tests, chainid, rows=50, cols=8) {
    let data = rightPadArray([], 5, rightPadArray([], cols, ''));
    
    const wethex = WETH_EXAMPLE.addresses[chainid];
    if (chainid && wethex) {
        data = data.concat(luxorTestsDataEthCall(wethex, WETH_EXAMPLE.fsigs, 5));
    }
    
    data = data.concat(rightPadArray([], 2, rightPadArray([], cols, '')));

    const header = rightPadArray(
        ['Expression', 'JS Result', 'EVM Result', 'Expected'],
        cols,
        ''
    );
    data.push(header);

    let shown_tests = Object.values(tests);
    shown_tests = shown_tests.slice(0, 5).concat(shown_tests.slice(shown_tests.length - 6));
    shown_tests.forEach(category => category.slice(0, 1).forEach(test => {
        if (!test.skip && !test.prereq) {
            const expression = stripNL(test.test);
            const rowData = [expression, MARKER_JS + expression, MARKER_WEB3 + expression, test.result];
            data.push(rightPadArray(rowData, cols, ''));
        }
    }));
    return rightPadArray(data, rows, []);
}

function luxorTestsDataEthCall(addresses, fsigs, inirow=0, rows=50, cols=8) {
    inirow += 2;
    const header = rightPadArray(
        ['Address', 'Function Sig', 'Arguments', 'JS Result', 'Total Balance'],
        cols,
        ''
    );
    const data = [header];
    
    const { address, users } = addresses;
    users.forEach((useraddr, i) => {
        const row = i + inirow;
        const expression = `=(eth-call A${inirow} B${row} (list C${row} ))`
        const rowData = ['', fsigs.balance, useraddr, expression];
        data.push(rightPadArray(rowData, cols, ''));
    });
    data[1][0] = address;
    data[1][4] = `=(reduce add (list ${
        [...Array(users.length)].map((_, i) => `D${inirow + i}`).join(' ')
    }) 0)`;
    data[2][4] = `=(reduce add (srange D${inirow} D${inirow+users.length-1}) 0)`;
    // data[3][4] = `=(table-rowf "G6" (list (list 1 2 3) (list 5 6 7)))`;
    data[4][4] = `=(table-colf "G9" (list (list 1 (list 2 2 3 3) 3) (list 5 6 7)))`;
    data[3][4] = `=(table-rowf "G6" F9)`;
    // data[4][4] = `=(table-colf "G9" F9)`;
    data[3][5] = {a:1, b:2, c:3, d:4};
    data[5][4] = `=(eth-call! A7 "increase(uint)" (list 4))`
    return data;
}

export const tayextension = {
    srange: code => {
        const matches = code.match(/\(\s*srange\s/g) || [];
        let currentcode = code;
        let result = '';

        matches.forEach(match => {
            const matchIndex = currentcode.indexOf(match);
            result += currentcode.substring(0, matchIndex);
            
            const tail = currentcode.substring(matchIndex);
            const end = tail.indexOf(')');            
            currentcode = tail.substring(end + 1);

            const srange = tail.substring(tail.indexOf('srange') + 6, end);
            let args = srange.split(' ').map(val => val.trim()).filter(val => val);

            if (args.length !== 2) throw new Error('srange needs two arguments');
            args = args.map(val => [val.substring(0, 1), val.substring(1)]);
            
            const startCode = args[0][0].charCodeAt(0);
            const startDigit = parseInt(args[0][1]);
            const endCode = args[1][0].charCodeAt(0);
            const endDigit = parseInt(args[1][1]);

            let newcode = ``
            for (let row = startDigit; row <= endDigit; row++) {
                for (let col = startCode; col <= endCode; col++) {
                    newcode += String.fromCharCode(col) + row + ' ';
                }
            }
            result += `(list ${newcode})`;
        });
        result += currentcode;
        return result;
    }
}

const table_f_ext = (args) => {
    let [letterkey, iter] = args;
    let corner = lkeyToKey(letterkey);
    let [ri, ci] = corner.split(';').map(val => parseInt(val));
    
    if (iter instanceof Object && !(iter instanceof Array)) {
        if (iter._hex) iter = new taylor.BN(iter._hex.substring(2), 16);
        if (taylor.BN.isBN(iter)) iter = [iter.toString(10)];
        else iter = [Object.keys(iter), Object.values(iter)];
    }
    if (typeof iter === 'undefined') iter = ['undefined'];
    if (iter === null) iter = ['null'];
    if (!(iter[0] instanceof Array)) iter = [iter];

    return { iter, ri, ci };
}

const _tableRowf = (iter, ri, ci) => {
    const newdata = {};
        
        for (let row of iter) {
            let cci = ci;
            newdata[ri] = {};
            for (let value of row) {
                newdata[ri][cci] = { text: value };
                cci += 1;
            }
            ri += 1;
        }
        return newdata;
}

const _tableColf = (iter, ri, ci) => {
    const newdata = {};
        
    for (let row of iter) {
        let rri = ri;
        for (let value of row) {
            newdata[rri] = newdata[rri] || {};
            newdata[rri][ci] = { text: value };
            rri += 1;
        }
        ci += 1;
    }
    return newdata;
}

export const luxor_extensions = {
    tableRowf: (args) => {
        let { iter, ri, ci } = table_f_ext(args);
        return _tableRowf(iter, ri, ci);
    },
    tableColf: (args) => {
        let { iter, ri, ci } = table_f_ext(args);
        return _tableColf(iter, ri, ci);
    },
    tableAbi: (args) => {
        const cell_table = lkeyToKey(args[0]).split(';').map(val => parseInt(val));
        const address = args[1];
        let abi = JSON.parse(args[2].replace(/\'/g, '"'));

        const iter = [['Inputs', abi.name]];
        const isTx = ['view', 'pure'].includes(abi.stateMutability) ? '' : '!';
        if (isTx) {
            abi.outputs = [{name: 'receipt', type: 'object'}];
        }
        
        abi.inputs.forEach(v => {
            iter.push([`${v.name} <${v.type}>`, 0]);
        });
        iter.push(['Outputs', '']);
        abi.outputs.forEach(v => {
            iter.push([`${v.name} <${v.type}>`, 0]);
        });

        const newdata = _tableRowf(iter, cell_table[0], cell_table[1]);
        const outs = abi.outputs.map(v => v.type);
        const fsig = `${abi.name}(${abi.inputs.map(v => v.type)})${outs.length > 0 ? '->('+outs.join()+')' : '' }`;
        const arg_cells = [...new Array(abi.inputs.length)].map((_, i) => keyToL(cell_table[0]+i+1, cell_table[1]+1));
        const out_indx = [cell_table[0] + abi.inputs.length + 2,  cell_table[1]+ 1];
        const out_key = keyToL(...out_indx);
        const cell_btn = [cell_table[0] + abi.inputs.length + 1, cell_table[1]+1];

        let text;
        if (!isTx) {
            text = `=(table-colf "${out_key}" (eth-call "${address}" "${fsig}" (list ${arg_cells.join(' ')})) )`
        } else {
            text = `=(table-rowf "${out_key}" (eth-call! "${address}" "${fsig}" (list ${arg_cells.join(' ')})) )`
        }
        newdata[cell_btn[0]][cell_btn[1]] = { text };
        return newdata;
    }
}
