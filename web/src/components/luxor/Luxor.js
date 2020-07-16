import React, { Component } from 'react';
import ReactDOM from 'react-dom'
import taylor from '@pipeos/taylor';
import 'canvas-datagrid';
import { sheet_settings, sheet_style_dark } from './configs.js';

const MARKER_JS = '=', MARKER_WEB3 = '$';

class CanvasDatagrid extends React.Component {
    tayprops = ['formatter', 'onCellChange']
    
    constructor(props) {
        super(props);
    }
    
    updateAttributes(nextProps) {
        const gridprops = Object.keys(this.props).filter(key => !this.tayprops.includes(key))
        
        gridprops.forEach(key => {
            if (!nextProps || this.props[key] !== nextProps[key]) {
                if (this.grid.attributes[key] !== undefined) {
                    this.grid.attributes[key] = nextProps ? nextProps[key] : this.props[key];
                } else {
                    this.grid[key] = nextProps ? nextProps[key] : this.props[key];
                }
            }
        });
        this.grid.draw();
    }
    componentWillReceiveProps(nextProps) {
        this.updateAttributes(nextProps);
    }
    shouldComponentUpdate() {
        return false;
    }
    componentWillUnmount() {
        this.grid.dispose();
    }
    componentDidMount() {
        const self = this;
        this.grid = ReactDOM.findDOMNode(this);
        this.updateAttributes();
        console.log('grid', this.grid);
        this.grid.style.height = '100%';
        this.grid.style.width = '100%';

        this.grid.formatters.string = this.props.formatter;
        this.grid.addEventListener('datachanged', this.dataChanged);
        this.grid.addEventListener('endedit', function(e) {
            self.props.onCellChange(e.cell, e.value, self.grid);
        });
    }
    // dataChanged(e) {
    //     console.log('dataChanged', e.data)
    //     const {taylor} = this.props;
        
    //     for (let i in e.data) {
    //         for (let j in e.data[i]) {
    //             let res = this.executeCell(e.data[i][j]);
    //             let key = String.fromCharCode(65+parseInt(j)) +(1+parseInt(i));
    //             this.storeCell(key, res);
    //         }
    //     }
    // }
    render() {
        return React.createElement('canvas-datagrid', {});
    }
}
class Luxor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: luxorTestsData(),
        };

        this.formattedData = {};

        this.formatter = this.formatter.bind(this);
        this.onCellChange = this.onCellChange.bind(this);
    }

    componentDidMount() {
        this.recalcFormattedData('js');
        this.recalcFormattedData('web3');
    }

    componentWillReceiveProps(nextProps) {
        this.recalcFormattedData('js');
        this.recalcFormattedData('web3');
    }

    getKeyFromCell(cell) {
        return cell.header.title + (cell.rowIndex + 1);
    }

    getKeyFromCoords(i, j) {
        return String.fromCharCode(65+parseInt(j)) +(1+parseInt(i));
    }

    formatter(e) {
        const value = e.cell.value;
        const key = this.getKeyFromCell(e.cell);
        return typeof this.formattedData[key] !== 'undefined' ? this.formattedData[key] : value;
    }

    storeCell(key, value) {
        if (!this.props.taylor || typeof value === 'undefined') return;
        const tayvalue = taylor.jsval2tay(value);
        this.props.taylor.send(`(def! ${key} ${tayvalue} )`);
    }

    async executeCell(key, value) {
        if (!value || typeof value !== 'string') return value;
        let response;

        const marker = value.slice(0, 1);
        let api;
        if (marker === MARKER_JS) {
            api = this.props.taylor_js;
        }
        if (marker === MARKER_WEB3 || this.props.backend === 'injected') {
            api = this.props.taylor_web3;
        }
        
        if (!api) return value;
        
        try {
            let newvalue = value.slice(1);
            response = await api.call(newvalue)
        } catch(e) {
            response = value;
        }
        this.storeCell(key, response);
        
        return response;
    }

    // runExtensions(code) {
    //     Object.keys(tayextension).forEach(name => {
    //         if (code.contains(name)) {
    //             let match = code.match(tayextension[name].regex);
    //             console.log('match', match);
    //         }
    //     })
    // }

    async onCellChange(cell, newvalue, grid) {
        const key = this.getKeyFromCell(cell);
        this.formattedData[key] = await this.executeCell(key, newvalue);
        grid.draw();
    }

    async recalcFormattedData() {
        const { data } = this.state;

        if (!data || !data.length) return;
        if (!this.props.taylor) return;

        for (let i = 0 ; i <= data.length; i++) {
            if (data[i] && data[i].length) {
                for (let j = 0 ; j <= data[i].length; j++) {
                    let value = data[i][j];
                    let key = this.getKeyFromCoords(i, j);
                    this.formattedData[key] = await this.executeCell(key, value);
                }
            }
        }
    }

    setData(data) {
        this.setState({data});
    }

    render() {
        return React.createElement('div', {
                style: {
                    height: '100%'
                }
            },
            React.createElement(CanvasDatagrid, {
                data: this.state.data,
                ...sheet_settings,
                style: sheet_style_dark,
                formatter: this.formatter,
                onCellChange: this.onCellChange,
            }),
        );
    }
}

function rightPadArray(value, size, content='') {
    const vsize = value.length;
    if (vsize >= size || !size) return value;
    return value.concat([...new Array(size - vsize)].map(_ => content))
}

function stripNL(source) {
    return source.replace(/\s{1,}/g, ' ');
}

function luxorTestsData(rows=10, cols=8) {
    const header = rightPadArray(
        ['Expression', 'JS Result', 'EVM Result', 'Expected'],
        cols,
        ''
    );
    const data = [header];

    Object.values(taylor.tests.both.tests).forEach(category => category.forEach(test => {
        if (!test.skip && !test.prereq) {
            const expression = stripNL(test.test);
            const rowData = [expression, MARKER_JS + expression, MARKER_WEB3 + expression, test.result];
            data.push(rightPadArray(rowData, cols, ''));
        }
    }));
    return rightPadArray(data, rows, []);
}

export default Luxor;

const tayextension = {
    srange: {
        regex: /\(\s*srange [A-Z]{1}[1-9]{1,} [A-Z]{1}[1-9]{1,}\s*\)/,
        replacement: (source) => {
            // const args = 
        }
    }
}
