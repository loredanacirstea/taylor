import React from 'react';
import { RegularPolygon, Arrow } from 'react-konva';
import { Button, Icon } from 'native-base';
import taylor from '@pipeos/taylor';
import SpreadSheet, { DefaultCell } from '@rowsncolumns/spreadsheet';
import { WETH_EXAMPLE } from './fixtures.js';
import ethers from 'ethers';

const MARKER_JS = '=', MARKER_WEB3 = '$';
// TODO: fix for "something G5 something"
const SHEET_KEY_REGEX = /(?<!\")(\b[A-Z]{1}[0-9]{1,})/g;
const cellkey = (row, col) => `${row};${col}`;
// A <-> 1, not from 0
const numberToLetter = ci => String.fromCharCode(64 + ci);
const letterToNumber = letter => letter.charCodeAt(0) - 64;
const keyToL = (row, col) => `${numberToLetter(col)}${row}`;

const _lkeyToKey = lkey => {
    if (!lkey) return lkey;
    if (parseInt(lkey)) return `;${lkey}`;
    return letterToNumber(lkey) + _lkeyToKey(lkey.substring(1));
}
const lkeyToKey = lkey => _lkeyToKey(lkey).split(';').reverse().join(';');

class CanvasDatagrid extends React.Component {
    tayprops = ['formatter', 'onCellChange']
    
    constructor(props) {
        super(props);

        this.onChangeSelectedSheet = this.onChangeSelectedSheet.bind(this);
    }
    
    updateAttributes(nextProps) {
        
    }
    componentWillReceiveProps(nextProps) {
    }
    componentWillUnmount() {
    }
    componentDidMount() {
        document.getElementsByClassName('rowsncolumns-spreadsheet')[0].style.height='100%'
        document.getElementsByClassName('rowsncolumns-spreadsheet')[0].style.width = '100%';
        this.colorFixes();
    }

    onChangeSelectedSheet(sheetId) {
        this.colorFixes();
        this.props.onChangeSelectedSheet(sheetId);
    }

    colorFixes() {
        const colorActive = 'rgb(155, 112, 63)';
        const colorInactive = '#1A202C';
        const activeSheetBtn = document.getElementsByClassName("css-1e5clkk");
        const kids = document.getElementsByClassName("css-197w9ay")[0].children;

        for (const kid of kids) {
            kid.children[0].style.backgroundColor = colorInactive;
        }

        for (const elem of activeSheetBtn) {
            elem.style.backgroundColor = colorActive;
        }
    }

    render() {
        return (
            <SpreadSheet
                sheets={this.props.data}
                showFormulabar={true}
                formatter={this.props.formatter}
                CellRenderer={this.props.Cell}
                snap={true}
                style={{ height: '100%' }}
                onChange={this.props.onChange}
                onChangeSelectedSheet={this.onChangeSelectedSheet}
                onChangeCells={this.props.onChangeCells}
            />
        )
    }
}

const DEFAULT_SHEETS = [
    {
      name: 'Sheet 1',
      id: 0,
      tabColor: 'rgb(155, 112, 63)',
      cells: {
        1: {
          1: {
            text: ''
          }
        }
      }
    }
];

const MARKER_WIDTH = 6;

const CellFormula = (props) => {
    const x = props.x + MARKER_WIDTH/2;
    const y = props.y + MARKER_WIDTH/2;
    return (
        <>
        <DefaultCell {...props} />
        <RegularPolygon
            sides={3}
            fill={props.marker_color}
            opacity={0.6}
            x={x}
            y={y}
            width={MARKER_WIDTH}
            height={MARKER_WIDTH}
            rotation={315}
            visible={true}
        ></RegularPolygon>
        </>
    )
}

const CellEthCallBang = (props) => {
    const x = props.x + MARKER_WIDTH/2;
    const y = props.y + MARKER_WIDTH/2;

    const arroww = 20
    const x2 = props.x + arroww/2 + props.width/2;
    const y2 = props.y + props.height/2;
    const onSend = () => props.onSend(cellkey(props.rowIndex, props.columnIndex), props.text);
    return (
        <>
        <DefaultCell {...props} />
        <Arrow 
            x={x2}
            y={y2}
            points={[0, 0, 5, 0]}
            tension={1}
            pointerLength={arroww}
            pointerWidth={arroww}
            fill='rgb(155, 112, 63)'
            onClick={onSend}
        />
        <RegularPolygon
            sides={3}
            fill='rgb(155, 112, 63)'
            x={x}
            y={y}
            width={MARKER_WIDTH}
            height={MARKER_WIDTH}
            rotation={315}
            visible={true}
        ></RegularPolygon>
        </>
    )
}

const getCell = (extraprops) => {
    return (props) => {
        const newprops = {...props};
        const key = cellkey(props.rowIndex, props.columnIndex);
        let value = props.formatter(newprops.text, key);
        newprops.text = value || newprops.text;
        const marker_width = props.height/3;
        const x = props.x + marker_width/2;
        const y = props.y + marker_width/2;
        delete newprops.formatter;
        if (props.text && props.text[0] === MARKER_JS) {
            if (props.text.includes('!')) {
                return <CellEthCallBang { ...newprops } { ...extraprops } />
            }
            return <CellFormula { ...newprops } { ...{ marker_color: 'rgb(205, 168, 105)' }} />
        } else if (props.text && props.text[0] === MARKER_WEB3) {
            if (props.text.includes('!')) {
                return <CellEthCallBang { ...newprops } { ...extraprops } />
            }
            return <CellFormula { ...newprops } { ...{ marker_color: 'rgb(155, 112, 63)' }} />
        }
        return <DefaultCell {...newprops} />
    }
}

class Luxor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: JSON.parse(JSON.stringify(DEFAULT_SHEETS)),
        };

        this.formattedData = {};
        this.formatter = this.formatter.bind(this);
        this.onChangeCells = this.onChangeCells.bind(this);
        this.onChangeSelectedSheet = this.onChangeSelectedSheet.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onSend = this.onSend.bind(this);
    }

    async setFixturesData() {
        let chainid;
        if (this.props.taylor_js && this.props.taylor_js.provider) {
            chainid = (await this.props.taylor_js.provider.getNetwork()).chainId;
            chainid = parseInt(chainid);
        }
        const data = JSON.parse(JSON.stringify(DEFAULT_SHEETS))[0];
        const testdata = luxorTestsData(taylor.tests.both.tests, chainid);
        testdata.forEach((row, ri) => {
            data.cells[ri+1] = {};
            row.forEach((val, ci) => {
                data.cells[ri+1][ci+1] = { text: val };
            });
        });
        this.setState({ data: [data] });
    }

    async componentDidMount() {
        await this.setFixturesData();
        this.extendFormulas();
        this.recalcFormattedData();
    }

    componentWillReceiveProps(nextProps) {
        this.recalcFormattedData();
    }

    mergeData(newdata) {
        const activeData = JSON.parse(JSON.stringify(this.state.data));
        const activeSheet = 0;

        const rowkeys = Object.keys(newdata);
        for (let ri of rowkeys) {
            const colkeys = Object.keys(newdata[ri]);
            for (let ci of colkeys) {
                activeData[activeSheet].cells[ri][ci] = Object.assign(
                    {},
                    activeData[activeSheet].cells[ri][ci],
                    newdata[ri][ci]
                )
                const key = cellkey(ri, ci);
                this.addToDataMap(key, newdata[ri][ci].text);
            }
        }

        this.setState({ data: activeData });
    }

    extendFormulas() {
        if (!this.props.taylor_js) return;
        const self = this;
        this.props.taylor_js.jsextend('table-rowf', (args) => {
            const newdata = luxor_extensions.tableRowf(args, self.state.data[0].cells);
            self.mergeData(newdata);
            return;
        });
        this.props.taylor_js.jsextend('table-colf', (args) => {
            const newdata = luxor_extensions.tableColf(args, self.state.data[0].cells);
            self.mergeData(newdata);
            return;
        });
        this.props.taylor_js.jsextend('table-abi', (args) => {
            const newdata = luxor_extensions.tableAbi(args);
            self.mergeData(newdata);
            return;
        });
        this.props.taylor_js.jsextend('eth-pipe', (args) => {
            const newdata = luxor_extensions.ethPipe(args);
            self.mergeData(newdata);
            return;
        });
        this.props.taylor_js.jsextend('eth-pipe-evm', async (args) => {
            const newdata = await luxor_extensions.ethPipeEvm(args, this.props.taylor_web3);
            return newdata;
        });
        this.props.taylor_js.jsextend('eth-pipe-evm!', async (args) => {
            const newdata = await luxor_extensions.ethPipeEvmBang(args, this.props.taylor_web3);
            return newdata;
        });
    }

    formatter(value, key) {
        let response = (
            typeof this.formattedData[key] !== 'undefined'
            && typeof this.formattedData[key].value !== 'undefined'
            && this.formattedData[key].value !== null
        ) ? this.formattedData[key].value : value;
        
        if (response instanceof Object && !(response instanceof Array)) {
            if (response._hex) response = new taylor.BN(response._hex.substring(2), 16);
            if (taylor.BN.isBN(response)) return response.toString(10);
            return JSON.stringify(response);
        }
        return response;
    }

    async onSend(key, value) {
        const receipt = await this.executeCell(key, value, true);
        return receipt;
    }

    async executeCell(key, value, executeSend=false) {
        if (!value || typeof value !== 'string') return value;
        let response;

        const marker = value.slice(0, 1);
        if (marker !== MARKER_JS && marker !== MARKER_WEB3) return value;
        let api;
        if (marker === MARKER_JS) {
            api = this.props.taylor_js;
        }
        if (marker === MARKER_WEB3) {
            api = this.props.taylor_web3;
        }
        if (!api) return value;
        if (!executeSend && value.includes('!')) return value;
        
        try {
            let newvalue = this.runExtensions(value);
            newvalue = this.replaceCellValues(key, newvalue);
            response = await api.call(newvalue);
        } catch(e) {
            console.log(e);
            response = value;
        }
        return response;
    }

    replaceCellValues(key, inicode) {
        let code = inicode.slice(1);
        const matches = [...code.matchAll(SHEET_KEY_REGEX)].reverse();
        for (const match of matches) {
            const cell_key = match[0];
            const numberkey = lkeyToKey(cell_key);
            this.addDepToDataMap(key, numberkey, inicode);
            const tayvalue = taylor.jsval2tay(this.getFromDataMap(numberkey));
            code = code.substring(0, match.index) + tayvalue + code.substring(match.index + match[0].length);
        }
        return code;
    }

    runExtensions(code) {
        Object.keys(tayextension).forEach(name => {
            code = tayextension[name](code);
        });
        return code;
    }

    async onChangeCells(sheetId, cells) {
        const rowkeys = Object.keys(cells)

        for(let i of rowkeys) {
            const row = cells[i];
            const colkeys = Object.keys(row);

            for(let j of colkeys) {
                const key = cellkey(i, j);
                const newvalue = cells[i][j].text;
                const saveddata = {};
                saveddata[i] = {};
                saveddata[i][j] = cells[i][j];
                this.mergeData(saveddata);
                await this._onCellChange(key, newvalue);
            }
        }
    }

    async _onCellChange(key, newvalue) {
        const execvalue = await this.executeCell(key, newvalue)
        this.addToDataMap(key, execvalue);
        
        const deps = this.getDepsFromDataMap(key);
        const deplength = deps.length;
        
        for (let i = 0;  i < deplength; i++) {
            const depkey = deps[i];
            const depsource = this.formattedData[depkey] ? this.formattedData[depkey].source : null;
            if (depsource) {
                const depvalue = await this.executeCell(depkey, depsource);
                this._onCellChange(depkey, depvalue);
            }
        }
    }

    onChangeSelectedSheet(sheetId) {

    }

    onChange(sheets) {

    }

    async recalcFormattedData() {
        const { data } = this.state;

        if (!data) return;
        if (!this.props.taylor) return;

        // TODO - multiple sheets?
        const rows = data[0].cells;
        if (rows.length == 0) return;

        for (let i of Object.keys(rows)) {
            if (!rows[i]) continue;
            
            const row = rows[i];
            for (let j of Object.keys(row)) {
                if (!row[j]) continue;

                let value = row[j].text;
                let key = cellkey(i, j);

                // Only calculate what has not been executed
                if (typeof this.getFromDataMap(key) === 'undefined' || this.formattedData[key].value === value) {
                    this.addToDataMap(key, await this.executeCell(key, value));
                }
            }
        }
    }

    setData(data) {
        this.setState({data});
    }

    addToDataMap(key, value) {
        if (!this.formattedData[key]) this.formattedData[key] = {};
        this.formattedData[key].value = value;
    }

    addDepToDataMap(dependent_key, dependency_key, source) {
        if (!this.formattedData[dependency_key]) this.formattedData[dependency_key] = {};
        if (!this.formattedData[dependency_key].deps) this.formattedData[dependency_key].deps = new Set();
        this.formattedData[dependency_key].deps.add(dependent_key);
        
        if (!this.formattedData[dependent_key]) this.formattedData[dependent_key] = {};
        this.formattedData[dependent_key].source = source;
    }

    getDepsFromDataMap(key) {
        if (!this.formattedData[key] || !this.formattedData[key].deps) return [];
        return [...this.formattedData[key].deps];
    }

    getFromDataMap(key) {
        return (this.formattedData[key] && (typeof this.formattedData[key].value !== 'undefined')) ? this.formattedData[key].value : undefined;
    }

    render() {
        return (
            <div style={{ height: '100%' }}>
                <CanvasDatagrid
                    data={this.state.data}
                    formatter={this.formatter}
                    Cell={ getCell({onSend: this.onSend}) }
                    onChangeCells={this.onChangeCells}
                    onChangeSelectedSheet={this.onChangeSelectedSheet}
                    onChange={this.onChange}
                    style={{ height: '100%', width: '100%' }}
                />
                <Button
                    small
                    icon
                    style={{ ...btnStyle, right: '40px' }}
                    onClick={this.props.onEditorScreen}
                >
                    <Icon name='chevron-right' type='FontAwesome' style={iconStyle}></Icon>
                </Button>
                <Button
                    small
                    icon
                    style={{ ...btnStyle, right: '0px' }}
                    onClick={this.props.onCloseLuxor}
                >
                    <Icon name='close' type='FontAwesome' style={iconStyle}></Icon>
                </Button>
            </div>
        )
    }
}

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

function luxorTestsData(tests, chainid, rows=50, cols=8) {
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
    data[5][4] = `=(eth-call! A7 "increase(uint)" (list 4) 0)`
    return data;
}

export default Luxor;

const tayextension = {
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
                newcode += '(list ';
                for (let col = startCode; col <= endCode; col++) {
                    newcode += String.fromCharCode(col) + row + ' ';
                }
                newcode += ') ';
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

const _tableAbi = (cell_table, abi, callback) => {
    const iter = [['Inputs', abi.name]];
    const isTx = ['view', 'pure'].includes(abi.stateMutability) ? '' : '!';
    const isPayable = abi.stateMutability === 'payable';
    if (isTx) {
        abi.outputs = [{name: 'receipt', type: 'object'}];
    }
    
    abi.inputs.forEach(v => {
        iter.push([`${v.name} <${v.type}>`, 0]);
    });
    if (isPayable) iter.push(['ETH value <WEI>', 0]);
    iter.push(['Outputs', '']);
    abi.outputs.forEach(v => {
        iter.push([`${v.name} <${v.type}>`, 0]);
    });

    const newdata = _tableRowf(iter, cell_table[0], cell_table[1]);
    const outs = abi.outputs.map(v => v.type);
    const fsig = `${abi.name}(${abi.inputs.map(v => v.type)})${outs.length > 0 ? '->('+outs.join()+')' : '' }`;
    const arg_cells = [...new Array(abi.inputs.length)].map((_, i) => keyToL(cell_table[0]+i+1, cell_table[1]+1));
    let out_indx = [cell_table[0] + abi.inputs.length + 2,  cell_table[1]+ 1];
    let cell_btn = [cell_table[0] + abi.inputs.length + 1, cell_table[1]+1];
    let pay_key;
    if (isPayable) {
        out_indx[0] = out_indx[0] + 1;
        cell_btn[0] = cell_btn[0] + 1;
        pay_key = keyToL(out_indx[0]-2, out_indx[1]);
    }
    const out_key = keyToL(...out_indx);
    const text = callback(fsig, arg_cells, isTx, out_key, pay_key);
    newdata[cell_btn[0]][cell_btn[1]] = { text };

    return newdata;
}

const STATE_MUTAB = { pure: 0, view: 1, nonpayable: 2, payable: 3 }
const STATE_MUTAB_REV = {0: 'pure', 1: 'view', 2: 'nonpayable', 3: 'payable'};

const luxor_extensions = {
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

        const newdata = _tableAbi(cell_table, abi, (fsig, arg_cells, isTx, out_key, pay_key) => {
            if (!isTx) {
                return `=(table-colf "${out_key}" (eth-call "${address}" "${fsig}" (list ${arg_cells.join(' ')})) )`
            } else {
                return `=(table-rowf "${out_key}" (eth-call! "${address}" "${fsig}" (list ${arg_cells.join(' ')}) ${pay_key}) )`
            }
        });
        return newdata;
    },
    ethPipe: args => {
        //[ "F6", [ [<addr>,<humansig>] ], [ [0, 0, 1, 1] ] ]
        const cell_table = lkeyToKey(args[0]).split(';').map(val => parseInt(val));
        const steps = args[1];
        const edges = args[2];
        const payable = args[3] || [];
        const utils = taylor.malBackend.utils;
        let inputMap = {}, outputMap = {}, graph_inputs = {}, outmapcpy;
        let stateMutability = 0;

        const abis = steps.map(step => {
            // fixme - it's from tay<->js boundary (better regex in taylor)
            step[1] = step[1].replaceAll('(list ', '(');
            const jsonabi = utils.ethHumanAbiToJson(utils.ethShortAbiToHuman(step[1], false).abi);
            step[1] = utils.ethSig(jsonabi);
            if (jsonabi.stateMutability && STATE_MUTAB[jsonabi.stateMutability] > stateMutability) {
                stateMutability = STATE_MUTAB[jsonabi.stateMutability];
            }
            return jsonabi;
        });

        abis.map((fabi, i) => {
            i = i+1; // first node is inputs
            inputMap[i] = {};
            outputMap[i] = {};
            fabi.inputs.forEach((io, j) => inputMap[i][j] = {io});
            // TODO fixme ethers issue: outputs not ouputs
            fabi.outputs = fabi.ouputs;
            fabi.ouputs.forEach((io, j) => outputMap[i][j] = {io});
        });
        outmapcpy = JSON.parse(JSON.stringify(outputMap));

        edges.forEach(edge => {
            console.log('edge', edge)
            const [node1, out1, node2, in2] = edge;

            if (outmapcpy[node1] && outmapcpy[node1][out1]) delete outmapcpy[node1][out1];

            if (outputMap[node1] && outputMap[node1][out1]) {
                console.log('node1', node1, out1, Object.values(outputMap).slice(0, node1));
                outputMap[node1][out1].count = Object.values(outputMap).slice(0, node1).map(val => Object.keys(val).length).reduce((sum, val) => sum+val);
            }
            inputMap[node2][in2].source = [node1, out1];
            if (node1 === 0) graph_inputs[out1] = inputMap[node2][in2].io;
        });

        let tempcount = 0;
        const outputs = Object.keys(outmapcpy).map(key => Object.keys(outmapcpy[key]).map(port => {
            const io = outputMap[key][port].io;
            io.count = outputMap[key][port].count || (tempcount + 1);
            tempcount = io.count;
            return io;
        })).reduce((accum, val) => accum.concat(val), []);

        let abi = {
            inputs: Object.values(graph_inputs),
            outputs,
            name: 'pipedFunction',
            stateMutability: STATE_MUTAB_REV[stateMutability],
        }

        let count = abi.inputs.length - 1;
        let stepIoInfo = abis.map((fabi, i) => {
            i = i+1;

            let indexes = fabi.inputs.map((io, j) => {
                const out = inputMap[i][j].source;
                // global input
                if (out[0] === 0) {
                    return out[1];
                } else {
                    return count + outputMap[out[0]][out[1]].count;
                }
            });
            let outputHasSlotSize = fabi.outputs.map((io, k) => utils.ethSlotSize(io.type));
            indexes = '(array ' + indexes.join(' ') + ')';
            outputHasSlotSize = '(array ' + outputHasSlotSize.join(' ') + ')';
            return [indexes, outputHasSlotSize];
        });

        let payableIndexes = payable.map(val => {
            if (!val) return 'nil';
            if (val[0] === 0) return val[1];
            return count + outputMap[val[0]][val[1]].count;
        })
        if (payableIndexes.length === 0) payableIndexes = steps.map(st => '');

        let fsteps = steps.map((step, i) => `(list "${step[0]}" "${step[1]}" ${payableIndexes[i]} ${stepIoInfo[i][0]} ${stepIoInfo[i][1]} )`).join(' ');
        fsteps = `(list ${fsteps})`;
        let outputIndexes = '(array ' + abi.outputs.map(val => val.count+count+1).join(' ') + ')';

        let output_types;
        if (abi.outputs.length === 0) output_types = '';
        else output_types = '(list ' + abi.outputs.map(out => `"${out.type}"`).join(' ') + ')';

        const newdata = _tableAbi(cell_table, abi, (fsig, arg_cells, isTx, out_key, pay_key) => {
            const args = arg_cells.map((cellkey, i) => `(eth-abi-encode "${abi.inputs[i].type}" ${cellkey} )`);
            
            if (!isTx && payable.length === 0) {
                return `=(table-colf "${out_key}" (eth-abi-decode ${output_types} (eth-pipe-evm (list ${args.join(' ')}) ${fsteps} ${outputIndexes} )))`
            } else {
                return `=(table-rowf "${out_key}" (eth-pipe-evm! (list ${args.join(' ')}) ${fsteps} ${outputIndexes} ${pay_key} ))`
            }
        });
        
        return newdata;
    },
    ethPipeEvm: async (args, interpreter) => {
        const inputs = args[0];
        const steps = args[1];
        const outputndx = args[2];

        let fsteps = steps.map((step, i) => `(list "${step[0]}" "${step[1]}" (array ${step[2].join(' ')}) (array ${step[3].join(' ')}) )`).join(' ');
        fsteps = `(list ${fsteps})`;
        let outputIndexes = '(array ' + outputndx.join(' ') + ')';
        const ins = inputs.map(val => `"${val}"`);
        const expr = `(eth-pipe-evm (list ${ins.join(' ')}) ${fsteps} ${outputIndexes} )`
        return interpreter.call(expr);
    },
    ethPipeEvmBang: async (args, interpreter) => {
        const inputs = args[0];
        const steps = args[1];
        const outputndx = args[2];
        let eth_value = args[3] || 0;
        eth_value = new taylor.BN(eth_value, 10);

        let fsteps = steps.map((step, i) => `(list "${step[0]}" "${step[1]}" ${step[2] || 'nil'} (array ${step[3].join(' ')}) (array ${step[4].join(' ')}) )`).join(' ');
        fsteps = `(list ${fsteps})`;
        let outputIndexes = '(array ' + outputndx.join(' ') + ')';
        const ins = inputs.map(val => `"${val}"`);
        const expr = `(eth-pipe-evm! (list ${ins.join(' ')}) ${fsteps} ${outputIndexes} )`
        const receipt = await interpreter.sendAndWait(expr, {value: eth_value});
        console.log('receipt', receipt);
        return receipt;
    }
}

const iconStyle = {
    color: 'rgb(30, 30, 30)',
    marginLeft: '10px',
    marginRight: '10px', 
}

const btnStyle = {
    backgroundColor: 'rgb(155, 112, 63)',
    position: 'absolute',
    top: '0px',
    height: '25px',
    padding: '0px',
}
