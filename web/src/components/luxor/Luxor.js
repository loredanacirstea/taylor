import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Icon} from 'native-base';
import taylor from '@pipeos/taylor';
import 'canvas-datagrid';
import { sheet_settings, sheet_style_dark } from './configs.js';
import { WETH_EXAMPLE } from './fixtures.js';

const MARKER_JS = '=', MARKER_WEB3 = '$';
const SHEET_KEY_REGEX = /(\b[A-Z]{1}[0-9]{1,})/g;

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
        this.grid.style.height = '100%';
        this.grid.style.width = '100%';

        this.grid.formatters.string = this.props.formatter;
        this.grid.addEventListener('endedit', function(e) {
            self.props.onCellChange(e.cell, e.value, self.grid);
        });
    }

    render() {
        return React.createElement('canvas-datagrid', {});
    }
}
class Luxor extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: rightPadArray([], 50, rightPadArray([], 8, '')),
        };

        this.formattedData = {};

        this.formatter = this.formatter.bind(this);
        this.onCellChange = this.onCellChange.bind(this);
    }

    async setFixturesData() {
        let chainid;
        if (this.props.taylor_js && this.props.taylor_js.provider) {
            chainid = (await this.props.taylor_js.provider.getNetwork()).chainId;
            chainid = parseInt(chainid);
        }
        const data = luxorTestsData(taylor.tests.both.tests, chainid);
        this.setState({ data });
    }

    async componentDidMount() {
        await this.setFixturesData();
        this.recalcFormattedData();
    }

    componentWillReceiveProps(nextProps) {
        this.recalcFormattedData();
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
        let response = typeof this.formattedData[key] !== 'undefined' ? this.formattedData[key].value : value;
        if (response instanceof Object && !(response instanceof Array)) {
            if (response.toString) return response.toString(10);
            return JSON.stringify(response);
        }
        return response;
    }

    async executeCell(key, value) {
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
        
        try {
            let newvalue = this.replaceCellValues(key, value);
            response = await api.call(newvalue)
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
            this.addDepToDataMap(key, cell_key, inicode);
            const tayvalue = taylor.jsval2tay(this.getFromDataMap(cell_key));
            code = code.replace(cell_key, tayvalue);
        });
        
        return code;
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
        await this._onCellChange(key, newvalue);
        grid.draw();
    }

    async _onCellChange(key, newvalue) {
        this.addToDataMap(key, await this.executeCell(key, newvalue));
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

    async recalcFormattedData() {
        const { data } = this.state;

        if (!data || !data.length) return;
        if (!this.props.taylor) return;

        for (let i = 0 ; i <= data.length; i++) {
            if (data[i] && data[i].length) {
                for (let j = 0 ; j <= data[i].length; j++) {
                    let value = data[i][j];
                    let key = this.getKeyFromCoords(i, j);
                    // Only calculate what has not been executed
                    if (typeof this.getFromDataMap(key) === 'undefined' || this.formattedData[key].value === value) {
                        this.addToDataMap(key, await this.executeCell(key, value));
                    }
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
            React.createElement(Button, {
                small: true,
                icon: true,
                style: {
                    backgroundColor: 'rgb(155, 112, 63)',
                    position: 'absolute',
                    top: '0px',
                    right: '40px',
                    height: '25px',
                    padding: '0px',
                },
                onClick: this.props.onEditorScreen,
            },
                React.createElement(Icon, {
                    name: 'chevron-right',
                    type: 'FontAwesome',
                    style: iconStyle,
                }),
            ),
            React.createElement(Button, {
                small: true,
                icon: true,
                style: {
                    backgroundColor: 'rgb(155, 112, 63)',
                    position: 'absolute',
                    top: '0px',
                    right: '0px',
                    height: '25px',
                    padding: '0px',
                },
                onClick: this.props.onCloseLuxor,
            },
                React.createElement(Icon, {
                    name: 'close',
                    type: 'FontAwesome',
                    style: iconStyle,
                }),
            ),
        );
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
    
    return data;
}

export default Luxor;

// const tayextension = {
//     srange: {
//         regex: /\(\s*srange [A-Z]{1}[1-9]{1,} [A-Z]{1}[1-9]{1,}\s*\)/,
//         replacement: (source) => {
//             // const args = 
//         }
//     }
// }

const iconStyle = {
    color: 'rgb(30, 30, 30)',
    marginLeft: '10px',
    marginRight: '10px', 
}
