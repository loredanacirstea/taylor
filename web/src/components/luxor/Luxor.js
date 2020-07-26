import React from 'react';
import { RegularPolygon, Arrow } from 'react-konva';
import { Button, Icon } from 'native-base';
import taylor from '@pipeos/taylor';
import SpreadSheet, { DefaultCell } from '@rowsncolumns/spreadsheet';
import { MARKER_JS, MARKER_WEB3, lkeyToKey, luxorTestsData, tayextension, luxor_extensions } from './utils.js';

// TODO: fix for "something G5 something"
const SHEET_KEY_REGEX = /(?<!\")(\b[A-Z]{1}[0-9]{1,})/g;
const cellkey = (row, col) => `${row};${col}`;

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
                snap={true}
                style={{ height: '100%' }}
                onChange={this.props.onChange}
                onChangeSelectedSheet={this.props.onChangeSelectedSheet}
                onChangeCell={this.props.onChangeCell}
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
        if (props.text && props.text[0] === MARKER_JS) {
            if (props.text.includes('eth-call!')) {
                return <CellEthCallBang { ...newprops } { ...extraprops } />
            }
            return <CellFormula { ...newprops } { ...{ marker_color: 'rgb(205, 168, 105)' }} />
        } else if (props.text && props.text[0] === MARKER_WEB3) {
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
        this.onChangeCell = this.onChangeCell.bind(this);
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

    async onChangeCell(sheetId, value, cell) {
        const { rowIndex: i, columnIndex: j} = cell;
        this.mergeData({[i]: {[j]: {text: value}}});
        await this._onCellChange(cellkey(i, j), value);
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
                    onChangeCell={this.onChangeCell}
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

export default Luxor;

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
