import React from 'react';
import { RegularPolygon, Arrow } from 'react-konva';
import { Button, Icon } from 'native-base';
import taylor from '@pipeos/taylor';
import SpreadSheet, { DefaultCell } from '@rowsncolumns/spreadsheet';
import { WETH_EXAMPLE } from './fixtures.js';

const MARKER_JS = '=', MARKER_WEB3 = '$';
// TODO: fix for "something G5 something"
const SHEET_KEY_REGEX = /(?<!\")(\b[A-Z]{1}[0-9]{1,})/g;
const cellkey = (row, col) => `${row};${col}`;
const numberToLetter = ci => String.fromCharCode(64 + ci);
const letterToNumber = letter => letter.charCodeAt(0) - 64;

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
    }

    render() {
        return (
            <SpreadSheet
                sheets={this.props.data}
                showFormulabar={true}
                formatter={this.props.formatter}
                CellRenderer={this.props.Cell}
                style={{ height: '100%' }}
                onChange={this.props.onChange}
                onChangeSelectedSheet={this.props.onChangeSelectedSheet}
                onChangeCells={this.props.onChangeCells}
            />
        )
    }
}

const DEFAULT_SHEETS = [
    {
      name: 'Sheet 1',
      id: 0,
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
    const onSend = () => {
        props.onSend(cellkey(props.rowIndex, props.columnIndex), props.text);
    }
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
            fill='red'
            onClick={onSend}
        />
        <RegularPolygon
            sides={3}
            fill='red'
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
        
        if (props.text[0] === MARKER_JS) {
            if (props.text.includes('eth-call!')) {
                return <CellEthCallBang { ...newprops } { ...extraprops } />
            }
            return <CellFormula { ...newprops } { ...{ marker_color: 'rgb(205, 168, 105)' }} />
        } else if (props.text[0] === MARKER_WEB3) {
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
    }

    formatter(value, key) {
        let response = (
            typeof this.formattedData[key] !== 'undefined'
            && typeof this.formattedData[key].value !== 'undefined'
            && this.formattedData[key].value !== null
        ) ? this.formattedData[key].value : value;
        
        if (response instanceof Object && !(response instanceof Array)) {
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
        const keys = code.match(SHEET_KEY_REGEX);

        (keys || []).forEach(cell_key => {
            const numberkey = lkeyToKey(cell_key);
            this.addDepToDataMap(key, numberkey, inicode);
            const tayvalue = taylor.jsval2tay(this.getFromDataMap(numberkey));
            code = code.replace(cell_key, tayvalue);
        });
        
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
                >
                    <Icon name='chevron-right' type='FontAwesome' style={iconStyle}></Icon>
                </Button>
                <Button
                    small
                    icon
                    style={{ ...btnStyle, right: '0px' }}
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
    data[5][4] = `=(eth-call! A7 "increase(uint)" (list 4))`
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
        iter = [Object.keys(iter), Object.values(iter)];
    }
    if (!(iter[0] instanceof Array)) iter = [iter];
    return { iter, ri, ci };
}

const luxor_extensions = {
    tableRowf: (args) => {
        let { iter, ri, ci } = table_f_ext(args);
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
    },
    tableColf: (args) => {
        let { iter, ri, ci } = table_f_ext(args);
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
    },
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
