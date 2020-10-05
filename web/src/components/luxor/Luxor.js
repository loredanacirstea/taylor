import React from 'react';
import { RegularPolygon, Arrow } from 'react-konva';
import { Button, Icon, Picker } from 'native-base';
import taylor from '@pipeos/taylor';
import SpreadSheet, { DefaultCell } from '@rowsncolumns/spreadsheet';
import Buttons from './Button.js';
import { WETH_EXAMPLE, PIPE_EXAMPLE } from './fixtures.js';
import Storage from './storage.js';

const MARKER_WIDTH = 6;
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
const lkeyToInd = lkey => lkeyToKey(lkey).split(';').map(val => parseInt(val));
const clone = value => JSON.parse(JSON.stringify(value));
const matchCellKeys = (code, callback) => {
    const matches = [...code.matchAll(SHEET_KEY_REGEX)].reverse();
    for (const match of matches) {
        const cell_key = match[0];   // A11
        const replacement = callback(lkeyToInd(cell_key));
        code = code.substring(0, match.index) + replacement + code.substring(match.index + match[0].length);
    }
    return code;
}

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
        this.props.onChangeSelectedSheet(sheetId);
        setTimeout(this.colorFixes, 200);
    }

    colorFixes() {
        // const colorActive = 'rgb(155, 112, 63)';
        // const colorInactive = '#1A202C';
        // const activeSheetBtn = document.getElementsByClassName("css-1e5clkk");
        // const kids = document.getElementsByClassName("css-197w9ay")[0].children;

        // for (const kid of kids) {
        //     kid.children[0].style.backgroundColor = colorInactive;
        //     kid.children[1].style.backgroundColor = colorInactive;
        // }

        // for (const elem of activeSheetBtn) {
        //     console.log('elem', elem)
        //     elem.style.backgroundColor = colorActive;
        // }
    }
    render() {
        return (
            <SpreadSheet
                sheets={this.props.data}
                initialColorMode="dark"
                showFormulabar={true}
                disableFormula
                showToolbar={false}
                tabColor='rgb(155, 112, 63)'
                allowNewSheet={false}
                rowHeaderWidth={56}
                formatter={this.props.formatter}
                CellRenderer={this.props.Cell}
                snap={true}
                style={{ height: '100%' }}
                onChange={this.props.onChange}
                onChangeSelectedSheet={this.onChangeSelectedSheet}
                onChangeCell={this.props.onChangeCell}
                onChangeCells={this.props.onChangeCells}
                onDeleteCells={this.props.onDeleteCells}
            />
        )
    }
}

const DEFAULT_SHEETS = [
    { name: 'Workspace', id: 0, cells: { 1: { 1: { text: '' } } }, selections: [] },
    {
        name: 'JS/EVM parallelism',
        id: 1,
        cells: { 1: { 1: { text: '' } } },
        selections: [],
        columnSizes: { 1: 300 },
        mergedCells: [
            {
              top: 1,
              left: 1,
              right: 4,
              bottom: 1,
            }
        ]
    },
    {
        name: 'Pipe',
        id: 2,
        cells: { 1: { 1: { text: '' } } },
        selections: [],
        columnSizes: { 1: 200, 2: 200, 3: 200, 5: 300 },
    },
    {
        name: 'Eth ABI',
        id: 3,
        cells: { 1: { 1: { text: '' } } },
        selections: [],
        columnSizes: { 5: 300 },
    },
    {
        name: 'WASM',
        id: 4,
        cells: { 1: { 1: { text: '' } } },
        selections: [],
        columnSizes: { 3: 200, 5: 200, 6: 200 },
    },
    {
        name: 'All Formulas',
        id: 5,
        cells: { 1: { 1: { text: '' } } },
        selections: [],
        columnSizes: { 1: 300, 2: 300, 3: 200 },
    },
    {
        name: 'UI Elements',
        id: 6,
        cells: { 1: { 1: { text: '' } } },
        selections: [],
    },
];

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
    const onSend = () => props.onSend(props.sheetId, cellkey(props.rowIndex, props.columnIndex), props.text);
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
        </>
    )
}

const getCell = (extraprops) => {
    return (props) => {
        const newprops = {...props};
        const key = cellkey(props.rowIndex, props.columnIndex);
        let value = props.formatter(newprops.text, key, newprops.sheetId);
        newprops.text = value || newprops.text;
        delete newprops.formatter;

        if (typeof props.text === 'string' && props.text.includes('ui-button')) {
            const btn_args = newprops.text;
            if (btn_args instanceof Array) {
                const btnComponent = Buttons[btn_args[0]];
                newprops.onSend = () => extraprops.onExecute(props.sheetId, key, '=' + btn_args[1], true);
                newprops.text = '';
                return (
                    <>
                    <DefaultCell {...newprops} />
                    { btnComponent(newprops) }
                    </>
                )
            }
        }

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

        this.formattedData = {};
        this.activeSheet = 0;
        DEFAULT_SHEETS.map(d => this.formattedData[d.id] = {});

        let data = clone(DEFAULT_SHEETS);
        data = this.setWorspace(data);

        this.state = {
            data,
        };

        this.formatter = this.formatter.bind(this);
        this.onChangeCell = this.onChangeCell.bind(this);
        this.onChangeCells = this.onChangeCells.bind(this);
        this.onChangeSelectedSheet = this.onChangeSelectedSheet.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onDeleteCells = this.onDeleteCells.bind(this);
        this.onSend = this.onSend.bind(this);
        this.executeCell = this.executeCell.bind(this);
    }

    setWorspace(data) {
        let sheetid = 0;
        const saved = Storage.get('workspace');
        if (saved && saved.data && saved.formatted) {
            data[sheetid] = saved.data;
            this.formattedData[sheetid] = saved.formatted;
        }
        return data;
    }

    async setFixturesData() {
        let chainid;
        if (this.props.taylor_js && this.props.taylor_js.provider) {
            chainid = (await this.props.taylor_js.provider.getNetwork()).chainId;
            chainid = parseInt(chainid);
        }
        let data = clone(DEFAULT_SHEETS);
        let sheetid = 0;
        data = this.setWorspace(data);

        sheetid = 1;
        const partialtestdata = luxorTestsData(taylor.tests.both.tests, chainid, false);
        partialtestdata.forEach((row, ri) => {
            data[sheetid].cells[ri+1] = {};
            row.forEach((val, ci) => {
                data[sheetid].cells[ri+1][ci+1] = { text: val, sheetId: data[sheetid].id };
            });
        });

        sheetid = 2;
        const pipeex = PIPE_EXAMPLE.addresses[chainid];
        if (chainid && pipeex) {
            const ethpipedata = luxorEthPipeExample(pipeex);
            ethpipedata.forEach((row, ri) => {
                data[sheetid].cells[ri+1] = {};
                row.forEach((val, ci) => {
                    data[sheetid].cells[ri+1][ci+1] = { text: val, sheetId: data[sheetid].id };
                });
            });
        }

        sheetid = 3;
        const wethex = WETH_EXAMPLE.addresses[chainid];
        if (chainid && wethex) {
            const ethabidata = luxorTestsDataEthCall(wethex, WETH_EXAMPLE.fsigs, 0);
            ethabidata.forEach((row, ri) => {
                data[sheetid].cells[ri+1] = {};
                row.forEach((val, ci) => {
                    data[sheetid].cells[ri+1][ci+1] = { text: val, sheetId: data[sheetid].id };
                });
            });
        }

        sheetid = 4;
        const wasmdata = wasmTestData();
        wasmdata.forEach((row, ri) => {
            data[sheetid].cells[ri+1] = {};
            row.forEach((val, ci) => {
                data[sheetid].cells[ri+1][ci+1] = { text: val, sheetId: data[sheetid].id };
            });
        });

        sheetid = 5;
        const allformulas = luxorAllFormulas(this.props.taylor_web3, this.props.taylor_js);
        allformulas.forEach((row, ri) => {
            data[sheetid].cells[ri+1] = {};
            row.forEach((val, ci) => {
                data[sheetid].cells[ri+1][ci+1] = { text: val, sheetId: data[sheetid].id };
            });
        });

        sheetid = 6;
        const uiexamples = luxorUIExamples();
        uiexamples.forEach((row, ri) => {
            data[sheetid].cells[ri+1] = {};
            row.forEach((val, ci) => {
                data[sheetid].cells[ri+1][ci+1] = { text: val, sheetId: data[sheetid].id };
            });
        });

        this.setState({ data });
    }

    async componentDidMount() {
        await this.setFixturesData();
        this.extendFormulas();
        this.recalcFormattedData();
    }

    componentWillReceiveProps(nextProps) {
        this.recalcFormattedData();
    }

    mergeData(sheetId, newdata) {
        const activeData = clone(this.state.data);
        const sheetIndx = activeData.findIndex(sheet => sheet.id === sheetId);

        const rowkeys = Object.keys(newdata);
        for (let ri of rowkeys) {
            const colkeys = Object.keys(newdata[ri]);
            for (let ci of colkeys) {
                if (!activeData[sheetIndx].cells[ri]) activeData[sheetIndx].cells[ri] = {}
                const key = cellkey(ri, ci);
                const tocopy = clone(newdata[ri][ci]);
                delete tocopy.delete;

                activeData[sheetIndx].cells[ri][ci] = clone({
                    ...activeData[sheetIndx].cells[ri][ci],
                    ...tocopy,
                    sheetId,
                });

                if (newdata[ri][ci].delete) this.deleteFromDataMap(sheetId, key);
                // even for delete;
                this.addToDataMap(sheetId, key, newdata[ri][ci].text);
            }
        }
        this.setState({ data: activeData });
    }

    extendFormulas() {
        if (!this.props.taylor_js) return;
        const self = this;
        this.props.taylor_js.jsextend('copy!', (args) => {
            const [oSheetId, topleft, bottomright, tSheetId, tTopLeft] = args;
            const newdata = luxor_extensions.copy(
                [oSheetId, topleft, bottomright, tTopLeft],
                this.state.data,
                false,
            );
            return {response: null, newdata, sheetId: tSheetId};
        });
        this.props.taylor_js.jsextend('cut!', (args) => {
            const [oSheetId, topleft, bottomright, tSheetId, tTopLeft] = args;
            const newdata = luxor_extensions.copy(
                [oSheetId, topleft, bottomright, tTopLeft],
                this.state.data,
                true,
            );
            return {response: null, newdata, sheetId: tSheetId};
        });
        this.props.taylor_js.jsextend('table-rowf', (args) => {
            const newdata = luxor_extensions.tableRowf(args);
            return {response: null, newdata};
        });
        this.props.taylor_js.jsextend('table-colf', (args) => {
            const newdata = luxor_extensions.tableColf(args);
            return {response: null, newdata};
        });
        this.props.taylor_js.jsextend('table-abi', (args) => {
            const newdata = luxor_extensions.tableAbi(args);
            return {response: null, newdata};
        });
        this.props.taylor_js.jsextend('table-wasm', async (args) => {
            const newdata = await luxor_extensions.tableWasm(args);
            return {response: null, newdata};
        });
        this.props.taylor_js.jsextend('eth-pipe', (args) => {
            const newdata = luxor_extensions.ethPipe(args);
            return {response: null, newdata};
        });
        this.props.taylor_js.jsextend('eth-pipe-evm', async (args) => {
            return luxor_extensions.ethPipeEvm(args, this.props.taylor_web3);
        });
        this.props.taylor_js.jsextend('eth-pipe-evm!', async (args) => {
            return luxor_extensions.ethPipeEvmBang(args, this.props.taylor_web3);
        });
        this.props.taylor_js.jsextend('ui-button', (args) => {
            if (args[1]) {
                args[1] = tayArtefactsRemoveList(args[1]);
                args[1] = tayQuotesReplace(args[1]);
            }
            return args;
        });
        this.props.taylor_js.jsextend('ui-pick', async (args) => {
            console.log('ui-pick args', args);
            const corner_cell = lkeyToKey(args[0]).split(';').map(val => parseInt(val));
            const items = args[1];
            const newdata = {};
            newdata[corner_cell[0]] = {};
            newdata[corner_cell[0]][corner_cell[1]] = {
                dataValidation: {
                    prompt: "Pick",
                    type: 'list',
                    formulae: items,
                },
            }
            return {response: null, newdata};
        });
    }

    formatter(value, key, sheetId) {
        if (!sheetId && sheetId !== 0) return value;
        if (!this.formattedData[sheetId]) this.formattedData[sheetId] = {};
        let response = (
            typeof this.formattedData[sheetId][key] !== 'undefined'
            && typeof this.formattedData[sheetId][key].value !== 'undefined'
            && this.formattedData[sheetId][key].value !== null
        ) ? this.formattedData[sheetId][key].value : value;

        if (response instanceof Object && !(response instanceof Array)) {
            if (response._hex) response = new taylor.BN(response._hex.substring(2), 16);
            if (taylor.BN.isBN(response)) return response.toString(10);
            return JSON.stringify(response);
        }
        return response;
    }

    async onSend(sheetId, key, value) {
        const receipt = await this.executeCell(sheetId, key, value, true);
        return receipt;
    }

    async executeCell(sheetId, key, value, executeSend=false) {
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
        const isTx = value.includes('!');
        if (!executeSend && isTx) return value;

        try {
            let newvalue = this.runExtensions(value);
            newvalue = this.replaceCellValues(sheetId, key, newvalue);
            if (!isTx) {
                response = await api.call(newvalue);
            } else {
                response = await api.sendAndWait(newvalue);
                // console.log('response', response);
            }
            if (response instanceof Object && response.newdata) {
                this.mergeData(response.sheetId || sheetId, response.newdata);
                response = '';
            }
        } catch(e) {
            console.log(e);
            response = value;
        }
        return response;
    }

    replaceCellValues(sheetId, key, inicode) {
        let code = inicode.slice(1);
        const matches = [...code.matchAll(SHEET_KEY_REGEX)].reverse();
        for (const match of matches) {
            const cell_key = match[0];
            const numberkey = lkeyToKey(cell_key);
            this.addDepToDataMap(sheetId, key, numberkey, inicode);
            const tayvalue = taylor.jsval2tay(this.getFromDataMap(sheetId, numberkey));
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

    async onChangeCells(sheetId, cells) {}

    async onDeleteCells(sheetId, activeCell, multiselection) {
        // [{bounds: {top: 19, bottom: 22, left: 4, right: 4}}]

        if (multiselection.length === 0) {
            await this.onDeleteCell(sheetId, activeCell);
        }

        for (let selection of multiselection) {
            for (let ri = selection.bounds.top; ri <= selection.bounds.bottom; ri++) {
                for (let ci = selection.bounds.left; ci <= selection.bounds.right; ci++) {
                    // empty value
                    await this.onDeleteCell(sheetId, {rowIndex: ri.toString(), columnIndex: ci.toString()});
                }
            }
        }
    }

    async onDeleteCell(sheetId, cell) {
        const data = clone(cell);
        data.text = '';
        data.delete = true;
        data.sheetId = sheetId;
        await this._onChangeCell(data);
    }

    async onChangeCell(sheetId, value, cell) {
        const data = clone(cell);
        data.text = value;
        data.sheetId = sheetId;
        await this._onChangeCell(data);
    }

    async _onChangeCell(cell) {
        const i = cell.rowIndex, j = cell.columnIndex;
        const key = cellkey(i, j);
        const saveddata = {};
        saveddata[i] = {};
        saveddata[i][j] = cell;

        this.mergeData(cell.sheetId, saveddata);
        await this.__onCellChange(cell.sheetId, key, cell.text);
    }

    async __onCellChange(sheetId, key, newvalue) {
        const execvalue = await this.executeCell(sheetId, key, newvalue)
        this.addToDataMap(sheetId, key, execvalue);

        const deps = this.getDepsFromDataMap(sheetId, key);
        const deplength = deps.length;

        for (let i = 0;  i < deplength; i++) {
            const depkey = deps[i];
            const depsource = this.formattedData[sheetId][depkey] ? this.formattedData[sheetId][depkey].source : null;
            if (depsource) {
                const depvalue = await this.executeCell(sheetId, depkey, depsource);
                await this.__onCellChange(sheetId, depkey, depvalue);
            }
        }
    }

    onChangeSelectedSheet(sheetId) {
        // console.log('onChangeSelectedSheet', sheetId);
        this.activeSheet = sheetId;
    }

    onChange(newdata) {
        // ! don't update state from this handle -> produces a cycle
        Storage.set('workspace', {data: newdata[0], formatted: this.formattedData[0]});
    }

    async recalcFormattedData() {
        const { data } = this.state;

        if (!data) return;
        if (!this.props.taylor) return;

        for (let sheet_index = 0; sheet_index < data.length; sheet_index++) {
            // TODO - multiple sheets?
            const rows = data[sheet_index].cells;
            const sheetId = data[sheet_index].id;
            if (rows.length === 0) return;

            for (let i of Object.keys(rows)) {
                if (!rows[i]) continue;

                const row = rows[i];
                for (let j of Object.keys(row)) {
                    if (!row[j]) continue;

                    let value = row[j].text;
                    let key = cellkey(i, j);

                    // Only calculate what has not been executed
                    if (typeof this.getFromDataMap(sheetId, key) === 'undefined' || this.formattedData[sheetId][key].value === value) {
                        this.addToDataMap(sheetId, key, await this.executeCell(sheetId, key, value));
                    }
                }
            }
        }
    }

    // formattedData[sheetId][key]
    // { value, deps: [], source }

    addToDataMap(sheetId, key, value) {
        if (!this.formattedData[sheetId]) this.formattedData[sheetId] = {};
        if (!this.formattedData[sheetId][key]) this.formattedData[sheetId][key] = {};
        this.formattedData[sheetId][key].value = value;
    }

    // if A11 depends on B22 and C33
    // B22.deps = [A11] ; C33.deps = [A11]
    // A11.source = source; A11.dependencies = [B22, C33]
    addDepToDataMap(sheetId, dependent_key, dependency_key, source) {
        if (!this.formattedData[sheetId]) this.formattedData[sheetId] = {};
        if (!this.formattedData[sheetId][dependency_key]) this.formattedData[sheetId][dependency_key] = {};
        if (!this.formattedData[sheetId][dependency_key].deps) this.formattedData[sheetId][dependency_key].deps = [];

        const tempset = new Set(this.formattedData[sheetId][dependency_key].deps);
        tempset.add(dependent_key);
        this.formattedData[sheetId][dependency_key].deps = [...tempset];

        if (!this.formattedData[sheetId][dependent_key]) this.formattedData[sheetId][dependent_key] = {};
        this.formattedData[sheetId][dependent_key].source = source;

        if (!this.formattedData[sheetId][dependent_key].dependencies) this.formattedData[sheetId][dependent_key].dependencies = [];

        const tempdep = new Set(this.formattedData[sheetId][dependent_key].dependencies);
        tempdep.add(dependency_key);
        this.formattedData[sheetId][dependent_key].dependencies = [...tempdep];
    }

    removeDependency(sheetId, dependent_key, dependency_key) {
        if (!this.formattedData[sheetId]) return;
        if (!this.formattedData[sheetId][dependency_key]) return;
        if (!this.formattedData[sheetId][dependency_key].deps) return;

        const deps = this.formattedData[sheetId][dependency_key].deps;
        const ind = deps.findIndex(value => value === dependent_key);
        if (ind > -1) deps.splice(ind, 1);

        this.formattedData[sheetId][dependency_key].deps = deps;
    }

    deleteFromDataMap(sheetId, dependent_key) {
        if (!this.formattedData[sheetId]) return;
        if (!this.formattedData[sheetId][dependent_key]) return;
        if (!this.formattedData[sheetId][dependent_key].dependencies) return;
        this.formattedData[sheetId][dependent_key].dependencies.forEach(dep => {
            this.removeDependency(sheetId, dependent_key, dep);
        });

        delete this.formattedData[sheetId][dependent_key];
    }

    getDepsFromDataMap(sheetId, key) {
        if (!this.formattedData[sheetId]) this.formattedData[sheetId] = {};
        if (!this.formattedData[sheetId][key] || !this.formattedData[sheetId][key].deps) return [];
        return this.formattedData[sheetId][key].deps;
    }

    getFromDataMap(sheetId, key) {
        if (!this.formattedData[sheetId]) this.formattedData[sheetId] = {};
        return (this.formattedData[sheetId][key] && (typeof this.formattedData[sheetId][key].value !== 'undefined')) ? this.formattedData[sheetId][key].value : undefined;
    }

    render() {
        return (
            <div style={{ height: '100%' }}>
                <CanvasDatagrid
                    formulas={{}}
                    data={clone(this.state.data)}
                    formatter={this.formatter}
                    Cell={ getCell({onSend: this.onSend, onExecute: this.executeCell}) }
                    onChangeCell={this.onChangeCell}
                    onChangeCells={this.onChangeCells}
                    onChangeSelectedSheet={this.onChangeSelectedSheet}
                    onChange={this.onChange}
                    onDeleteCells={this.onDeleteCells}
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

function tayQuotesReplace(source) {
    return source.replace(/\'/g, '"');
}

function tayArtefactsRemoveList(source) {
    return source.replace(/\(list /g, '(');
}

function luxorTestsData(tests, chainid, showall=false, rows=50, cols=8) {
    let data = [[],[],[]];

    const descr = 'Same formula is processed once on JSON, once on the EVM. Results should be the same.';
    data[0][0] = descr;
    const header = ['Expression', 'JS Result', 'EVM Result', 'Expected'];
    data.push(header);

    let shown_tests = Object.values(tests);
    if (!showall) {
        shown_tests = shown_tests.slice(0, 5).concat(shown_tests.slice(shown_tests.length - 6));
        shown_tests = shown_tests.map(category => category.slice(0, 1));
    }
    shown_tests.forEach(test => {
        test = test[0];
        if (!test.skip && !test.prereq) {
            const expression = stripNL(test.test);
            const rowData = [expression, MARKER_JS + expression, MARKER_WEB3 + expression, test.result];
            data.push(rowData);
        }
    });
    return data;
}

function luxorAllFormulas(interpreter_web3, interpreter_js) {
    const tests = taylor.tests;
    // const web3_functions = interpreter_web3.functions;
    const js_functions = interpreter_js.functions;
    const web3_functions = taylor.nativeEnv;

    let data = [['JS: use "="', 'Web3: use "$"'],[],[]]
    const header = ['', 'Expression', 'Description'];

    data.push(['JS & Web3']);
    data.push(header);

    const both = [];
    const fnames_both = {};
    Object.keys(tests.both.tests).forEach(fname => {
        const tt = tests.both.tests[fname];
        const t = tt.find(test => !test.skip && !test.prereq);
        if (t) {
            data.push(['', stripNL(t.test), web3_functions[fname]?.docs || '']);
        }
        fnames_both[fname] = true;
    });

    data.push(['Web3 only']);
    data.push(header);

    data.push(['JS only']);
    data.push(header);
    return data;
}

function luxorTestsDataEthCall(addresses, fsigs, inirow=0, rows=50, cols=8) {
    inirow += 2;
    const header = ['Address', 'Function Sig', 'Arguments', 'JS Result', 'Total Balance'];
    const data = [header];

    const { address, users } = addresses;
    users.forEach((useraddr, i) => {
        const row = i + inirow;
        const expression = `=(eth-call A${inirow} B${row} (list C${row} ))`
        const rowData = ['', fsigs.balance, useraddr, expression];
        data.push(rowData);
    });
    data[1][0] = address;
    data[1][4] = `=(reduce add (list ${
        [...Array(users.length)].map((_, i) => `D${inirow + i}`).join(' ')
    }) 0)`;
    data[2][4] = `=(reduce add (srange D${inirow} D${inirow+users.length-1}) 0)`;
    // data[3][4] = `=(table-rowf "G6" (list (list 1 2 3) (list 5 6 7)))`;
    data[4][4] = `=(table-colf "A12" (list (list 1 (list 2 2 3 3) 3) (list 5 6 7)))`;
    data[3][4] = `=(table-rowf "A9" F4)`;
    // data[4][4] = `=(table-colf "G9" F4)`;
    data[3][5] = {a:1, b:2, c:3, d:4};
    data[5][4] = `=(eth-call! A2 "increase(uint)" (list 4) 0)`
    return data;
}

function luxorEthPipeExample(addresses) {
    let data = [];
    const edges1 = '=(list (list 0 0 1 0) (list 0 0 2 0) (list 1 0 2 1) (list 0 1 2 2))';
    const expr1 = `=(eth-pipe "G1" (srange A2 B3) C2 D2)`
    const payable1 = `=(list)`

    const edges2 = `=(list (list 0 0 1 0) (list 0 0 2 0) (list 1 0 2 1) (list 0 2 2 2) (list 1 0 3 0) (list 0 1 3 1) (list 0 0 3 2) (list 2 0 3 3))`;
    const expr2 = `=(eth-pipe "A7" (srange A2 B4) C3 D3)`;
    const payable2 = `=(list nil nil (list 0 2))`

    // const edges3 = ``
    // const expr2 = `=(eth-pipe "J1" (list (list A2 B2) (list A5 B5)) C2 D2)`
    // const payable = `=(list)`

    data.push(['Address', 'Function Abi', 'Graph Edges', 'Payable Index', 'Formula'])
    data.push([
        addresses.vr.address,
        'getVendor(uint256 product_id)->(address vendor)',
        edges1,
        payable1,
        expr1,
    ])
    data.push([
        addresses.vp.address,
        'calculateQuantity(uint256 product_id,address vendor,uint256 wei_value)->(uint256 quantity)',
        edges2,
        payable2,
        expr2,
    ]);

    data.push([
        addresses.mp.address,
        'buy(address vendor,address buyer,uint256 product_id,uint256 quantity) payable'
    ]);

    // data.push([
    //     '0x470171ae1fD4C5A93A899E58FfF7f8585D5C9972',
    //     'getQuantity(address vendor,uint256 product_id)'
    // ]);
    data = data.concat([],[],[],[],[],[]);
    return data;
}

function wasmTestData() {
    let data = [[],[],[]]
    const drow = 5;
    data.push(['Url', 'Function Sig', 'table-wasm']);
    data.push([
        'https://cdn.rawgit.com/mdn/webassembly-examples/master/understanding-text-format/add.wasm',
        'add(uint32,uint32)->(uint32)',
        `=(table-wasm "E${drow}" A${drow} B${drow})`,
    ]);
    data = data.concat([],[],[],[],[],[]);
    return data;
}

function luxorUIExamples() {
    let data = [[],[],[]];
    const buttons = [
        {
            name: 'left',
            script: '(table-rowf "D5" (list (list 2 2 3 3)))',
        },
        {
            name: 'plus',
            script: '(table-rowf "D6" (list (list 4 5 6 7)))',
        },
        {
            name: 'close',
            script: '(table-rowf "D7" (list (list 10 11 12 13)))',
        },
        {
            name: 'right',
            script: '(table-rowf "D8" (list (list 3 5 2 4)))',
        },
        {
            name: 'execute',
            script: '(ui-pick "D9" (list "item1" "item2" "item3") )',
        }
    ]
    const inir = 5;
    data.push(['Function', 'Formula']);
    buttons.forEach((b, i) => {
        data.push([b.script, `=(ui-button "${b.name}" A${inir+i})`]);
    });
    return data;
}

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
    copy: (args, data, cut = false) => {
        const [sheetId, tl, br, targettl] = args;
        const tl_pos = lkeyToInd(tl);
        const br_pos = lkeyToInd(br);
        const targettl_pos = lkeyToInd(targettl);

        const newdata = {};
        const olddata = data[sheetId].cells;
        const delta_ri = targettl_pos[0] - tl_pos[0];
        const delta_ci = targettl_pos[1] - tl_pos[1];

        for (let ri = tl_pos[0]; ri <= br_pos[0]; ri++) {
            const target_ri = targettl_pos[0] + ri - tl_pos[0];
            newdata[target_ri] = {};
            if (cut) {
                newdata[ri] = {};
            }
            for (let ci  = tl_pos[1]; ci <= br_pos[1]; ci++) {
                const target_ci = targettl_pos[1] + ci - tl_pos[1];
                if (cut) {
                    newdata[ri][ci] = { text: '', delete: true }
                }
                if (olddata[ri] && olddata[ri][ci]) {
                    let {text} = olddata[ri][ci];

                    // update dependencies present in formula, if any
                    text = matchCellKeys(text, indexes => {
                        const [rowi, coli] = indexes;
                        return keyToL(rowi + delta_ri, coli + delta_ci);
                    });

                    newdata[target_ri][target_ci] = { text };
                }
            }
        }
        return newdata;

    },
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
        let abi = JSON.parse(tayQuotesReplace(args[2]));

        const newdata = _tableAbi(cell_table, abi, (fsig, arg_cells, isTx, out_key, pay_key) => {
            if (!isTx) {
                return `=(table-colf "${out_key}" (eth-call "${address}" "${fsig}" (list ${arg_cells.join(' ')})) )`
            } else {
                return `=(table-rowf "${out_key}" (eth-call! "${address}" "${fsig}" (list ${arg_cells.join(' ')}) ${pay_key}) )`
            }
        });
        return newdata;
    },
    tableWasm: (args) => {
        const utils = taylor.malBackend.utils;
        const cell_table = lkeyToKey(args[0]).split(';').map(val => parseInt(val));
        const url = args[1];
        const abi = tayArtefactsRemoveList(args[2]);
        let jsonabi = utils.ethShortAbiToHuman(abi, false);
        jsonabi = utils.ethHumanAbiToJson(jsonabi.abi);
        jsonabi.outputs = jsonabi.ouputs;

        const newdata = _tableAbi(cell_table, jsonabi, (fsig, arg_cells, isTx, out_key, pay_key) => {
            return `=(table-colf "${out_key}" (wasm-call "${url}" "${jsonabi.name}" (list ${arg_cells.join(' ')})) )`
        });
        return newdata;
    },
    ethPipe: (args) => {
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
            step[1] = tayArtefactsRemoveList(step[1]);
            const jsonabi = utils.ethHumanAbiToJson(utils.ethShortAbiToHuman(step[1], false).abi);
            step[1] = utils.ethSig(jsonabi);
            if (jsonabi.stateMutability && STATE_MUTAB[jsonabi.stateMutability] > stateMutability) {
                stateMutability = STATE_MUTAB[jsonabi.stateMutability];
            }
            return jsonabi;
        });

        abis.forEach((fabi, i) => {
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
            const [node1, out1, node2, in2] = edge;

            if (outmapcpy[node1] && outmapcpy[node1][out1]) delete outmapcpy[node1][out1];

            if (outputMap[node1] && outputMap[node1][out1]) {
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


export default Luxor;
