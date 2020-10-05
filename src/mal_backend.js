const mal = require('./mal/mal.js');
const malTypes = require('./mal/types.js');
const interop = require('./mal/interop');
const BN = require('bn.js');
const ethers = require('ethers');
const bootstrap_functions = require('./bootstrap.js');
const { strip0x, toBN, uint8ArrayToHex, hexToUint8Array, uint8arrToBN, uint8ArrayToHexAddr } = require('./utils.js');
require('./extensions.js');
const { jsvm } = require('ewasm-jsvm');
const native = require('./native.js');

mal.jsvm = jsvm();

mal.re = str => mal.EVAL(mal.READ(str), mal.repl_env)
mal.reps = async lines => {
    lines = lines.split('\n\n')
    .map(line => line.replace('\n', ''))
    .filter(line => line.length > 4 && !line.includes(';'))
    let newl = [];
    for (let line of lines) {
        newl.push(await mal.rep(line));
    }
    return newl;
}

const modifyEnv = (name, func) => {
    const orig_func =  mal.repl_env.get(malTypes._symbol(name));
    mal.repl_env.set(malTypes._symbol(name), (...args) => {
        return func(orig_func, ...args);
    })
}

const evenHex = hex => {
    if (hex.length % 2 === 1) hex = '0' + hex;
    return hex;
}

const _toHex = bnval => {
    let hex = bnval.toString(16);
    hex = evenHex(hex);
    return hex;
}

const toHex = bnval => '0x' + _toHex(bnval);

const isArray = val => {
    try {
        val = JSON.parse(val);
    } catch(e) {};

    if (!(val instanceof Array)) return false;

    // TODO deep type check
    let itemtype = typeof val[0];
    return !val.some(it => (typeof it) !== itemtype);
}

const ethShortAbiToHuman = (fsig, isTx) => {
    if (typeof isTx === 'undefined') isTx = !(fsig.includes('->'));
    const fname = fsig.split('(')[0].trim();
    let abi = fsig;

    if (fsig.includes('->')) {
        let replacement = !fsig.includes('public') && !fsig.includes('external') ? ' public' : '';
        replacement += !fsig.includes('pure') && !fsig.includes('view') ? ' view' : '';
        abi = fsig.replace('->', replacement + ' returns');
    }
    if (!abi.includes('public') && !abi.includes('external')) {
        abi += ' public';
    }
    abi = 'function ' + abi;
    return {
        abi,
        name: fname,
    }
}

const ethHumanAbiToJson = fsig => {
    const interf = new ethers.utils.Interface([fsig]);
    return JSON.parse(interf.format('json'))[0];
}

const ethSig = (fabi) => {
    const interf = new ethers.utils.Interface([fabi]);
    return interf.getSighash(fabi.name);
}

const SLOT_SIZE_MULTI = {
    tuple: true,
    string: true,
    bytes: true,
}

const ethSlotSize = (ttype) => {
    if (SLOT_SIZE_MULTI[ttype]) return false;
    if (ttype.slice(-1) === ']') return false;
    return true;
}

const callContract = (address, fsig, data, providerOrSigner, isTx=false, ethvalue=0) => {
    const {abi, name} = ethShortAbiToHuman(fsig, isTx);
    const contract = new ethers.Contract(address, [abi], providerOrSigner);
    return contract[name](...data, {value: ethvalue});
}


const toTayBN = hexval => {
    return {_hex: hexval, _isBigNumber: {_hex: '0x01'}}
};

const jsEvalParseBN = answ => {
    if (BN.isBN(answ)) answ = toTayBN(answ.toString(16));
    if (typeof answ === 'boolean') answ = toTayBN(answ ? '01' : '00')

    if (answ && typeof answ === 'object') {
        if (answ instanceof Array) {
            return answ.map(val => jsEvalParseBN(val));
        }
        const newobj = {};
        Object.keys(answ).forEach(key => {
            newobj[key] = jsEvalParseBN(answ[key]);
        });
        return newobj;
    }

    return answ;
}

mal.globalStorage = {};
mal.runtimeMemory = {};
mal.storageMap = new WebAssembly.Memory({ initial: 2 }); // Size is in pages.
mal.memoryMap = new WebAssembly.Memory({ initial: 2 }); // Size is in pages.

mal.freeMemPtr = 0x40;
mal.allocate = size => {
    const ptr = mal.freeMemPtr;
    let value = (native_extensions.evm.loadMem(ptr)).toNumber();
    if (value === 0) {
        value = 0x1a0;
    }
    native_extensions.evm.storeMem(ptr, native_extensions.ethabi_encode("uint256", value + size));
    return value;
}

modifyEnv('nil?', (orig_func, value) => {
    let nil = (
        (!value && value !== 0) ||
        (value instanceof Object && Object.keys(value).length === 0) ||
        (value instanceof Array && value.length === 0) ||
        (typeof value === 'string' && value.substring(0, 2) === '0x' && value.length === 2)
    );
    return interop.js_to_mal(nil ? true : false);
});

const extensions = {};
const native_extensions = {
    BN: toBN,
    evm_unsign: value => {
        if (typeof value === 'number' && value < 0) {
            const evmvalue = ethers.utils.defaultAbiCoder.encode(['int256'], [value]);
            return native_extensions.BN(evmvalue);
        }
        return value;
    },
    keccak256_: t2ptr__ => {
        let value = native_extensions.getbytelike__(t2ptr__);
        return ethers.utils.keccak256(ethers.utils.arrayify(value));
    },
    keccak256: n => {
        if (n instanceof Array) n = mal.runtimeMemory[n[0]];
        if (typeof n !== 'string') throw new Error('keccak256 expects string');

        // TODO: better encoding
        // in case we have keccak256 "0x.." "0x .."
        n = n.replace(/0x/g, '');

        if (n.substring(0, 2) !== '0x') n = '0x' + n;
        return ethers.utils.keccak256(ethers.utils.arrayify(n));
    },
    encode: n => {
        // TODO: proper encoding
        try {
            n = JSON.parse(n)
        } catch(e) {}

        if (n instanceof Array && n[2] === 'ptr') n = native_extensions.mload(n[0]);

        switch (typeof n) {
            case 'number':
                return n.toString(16).padStart(64, '0');
            case 'string':
                return n;
        }
    },
    store: (key, value) => {
        mal.globalStorage[key] = value;
        return key;
    },
    mmstore__: (valuesList) => {
        const hexvalue = '0x' + valuesList.map(value => {
            return native_extensions.BN(value).toString(16).padStart(64, '0');
        }).join('');
        return native_extensions.bytelike_(hexvalue);
    },
    mmstore8__: (value) => {
        const hexvalue = '0x' + valuesList.map(value => {
            return native_extensions.BN(value).toString(16).padStart(2, '0').substring(0, 4);
        }).join('');
        return native_extensions.bytelike_(hexvalue);
    },
    bytelike_: (hexvalue) => {
        let value = strip0x(hexvalue);
        let len = value.length / 2;
        let offset = mal.allocate(len + 32);
        value = new BN(len).toString(16).padStart(64, '0') + value;

        // TODO offset, mimic interpreter offsets
        native_extensions.storeMemory(value, offset, len + 32);
        return offset;
    },
    getbytelike__: offset => {
        let offsetn = (native_extensions.BN(offset)).toNumber();
        let len = (native_extensions.evm.loadMem(offsetn));
        len = len.toNumber();
        let value = native_extensions.loadMemory(offsetn + 32, len);
        return uint8ArrayToHex(value);
    },
    tuple___: elems => {
        const encoded = elems.map(elem => {
            return native_extensions.BN(elem).toString(16).padStart(64, '0');
        });

        let arity = encoded.length;
        let len = arity * 32;
        let offset = mal.allocate(len + 32);
        let value = new BN(arity).toString(16).padStart(64, '0');
        value += encoded.map(n => n.toString(16)).join('');

        native_extensions.storeMemory(value, offset, len + 32);
        return offset;
    },
    gettuple___: offset => {
        let offsetn = (native_extensions.BN(offset)).toNumber();
        let arity = (native_extensions.evm.loadMem(offsetn));
        arity = arity.toNumber();
        let value = native_extensions.loadMemory(offsetn, arity * 32 + 32);
        value = uint8ArrayToHex(value);
        return value
    },
    storeMemory: (hexvalue, offset, len) => {
        let value = strip0x(hexvalue);
        const slots = Math.ceil(len / 32);
        [...(new Array(slots)).keys()]
            .map(ind => value.substring(ind * 64, (ind + 1) * 64))
            .forEach((slice, ind) => {
                native_extensions.evm.storeMem(offset + ind * 32, '0x' + slice);
            });
    },
    loadMemory: (offset, len) => {
        const slots = Math.ceil(len / 32);
        return '0x' + [...(new Array(slots)).keys()]
            .map(ind => {
                // BN
                const value = native_extensions.evm.loadMem(offset + (32 * ind)).toString(16).padStart(64, '0');
                return value;
            })
            .join('')
            .substring(0, len * 2);
    },
    range: (start, stop, step) => {
        start = native_extensions.BN(start).toNumber();
        stop = native_extensions.BN(stop).toNumber();
        step = native_extensions.BN(step).toNumber();
        return [...Array(stop + 1).keys()].slice(start, stop+1).filter((no, i) => i % step === 0);
    },
    isArray,
    limited_pow: (a, b) => {
        // no floats yet
        if (b < 0) return 0;
        return native_extensions.BN(a).pow(native_extensions.BN(b));
    },
    ethcall: async (address, fsig, data) => {
        if (!mal.provider) return;
        return callContract(address, fsig, data, mal.provider)
    },
    ethsend: async (address, fsig, data, ethvalue) => {
        if (!mal.signer) return;
        if (!ethvalue) ethvalue = 0;
        ethvalue = new BN(ethvalue, 10);

        const response = await callContract(address, fsig, data, mal.signer, true, ethvalue).catch(console.log);
        const receipt = await response.wait();
        console.log('receipt', receipt);
        return receipt;
    },
    replaceBytelike: jsvalue => {
        if (typeof jsvalue === 'string' && jsvalue.substring(0, 2) === '0x') {
            return native_extensions.bytelike_(jsvalue);
        }
        if (typeof jsvalue === 'string') {
            return native_extensions.bytelike_(jsvalue.hexEncode());
        }
        if (jsvalue instanceof Array) return jsvalue.map(native_extensions.replaceBytelike);
        // !objects can be BigNumber
        return jsvalue;
    },
    listToJsArray: liststr => {
        // ! always expects a resolved list
        liststr = liststr.replace(/(?<!(BN))\(/g, '(list ');
        return mal.re(liststr);
    },
    listToJsArrayStr: async (liststr, low=true) => {
        let jsequiv = await native_extensions.listToJsArray(liststr);
        if (low) {
            // if bytelike, we store it in memory and return the pointer
            jsequiv = native_extensions.replaceBytelike(jsequiv);
        }
        return JSON.stringify(jsequiv);
    },
    listToJsArrayLength: async liststr => {
        const jsequiv = await native_extensions.listToJsArray(liststr);
        return jsequiv.length;
    },
    jsStr: async val => {
        if (typeof val !== 'string') {
            val = JSON.stringify(val);
        }
        return await native_extensions.listToJsArrayStr(val, true);
    },
    jsStrExternal: async val => {
        if (typeof val !== 'string') {
            val = JSON.stringify(val);
        }
        return await native_extensions.listToJsArrayStr(val, false);
    },
    join: (a, b) => {
        if (typeof a !== 'string' || typeof b !== 'string') throw new Error('join argument is not string');
        const toHex = arg => arg.slice(0, 2) === '0x' ? arg : '0x' + arg.hexEncode();

        return toHex(a) + strip0x(toHex(b));
    },
    return_d: t2ptr__ => {
        return native_extensions.getbytelike__(t2ptr__);
    },
    return_3: t3ptr___ => {
        return native_extensions.gettuple___(t3ptr___);
    },
    eth_sig: (fsig) => ethSig(ethHumanAbiToJson((ethShortAbiToHuman(fsig)).abi)),
    ethabi_encode: (types, values) => {
        if (!(types instanceof Array)) types = [types];
        if (!(values instanceof Array)) values = [values];
        return ethers.utils.defaultAbiCoder.encode(types, values);
    },
    ethabi_decode: (types, data) => {
        const isarr = types instanceof Array;
        if (!isarr) types = [types];
        if (data instanceof Array) data = data[0];
        const values = ethers.utils.defaultAbiCoder.decode(types, data);
        if (isarr) return values;
        return values[0];
    },
    wasmcall: async (url, fname, args) => {
        const wmodule = await WebAssembly.instantiateStreaming(fetch(url), {});
        return wmodule.instance.exports[fname](...args);
    },
    evm: {
        getAddress: () => uint8ArrayToHexAddr(mal.jsvm_env.getAddress()),
        getExternalBalance: (a) => uint8arrToBN(mal.jsvm_env.getExternalBalance(a)),
        getSelfBalance: () => uint8arrToBN(mal.jsvm_env.getSelfBalance()),
        getBlockHash: () => uint8ArrayToHex(mal.jsvm_env.getBlockHash()),
        getCaller: () => uint8ArrayToHexAddr(mal.jsvm_env.getCaller()),
        getCallValue: () => uint8arrToBN(mal.jsvm_env.getCallValue()),
        getCallDataSize: () => uint8arrToBN(mal.jsvm_env.getCallDataSize()),
        callDataLoad: (offset) => uint8ArrayToHex(mal.jsvm_env.callDataLoad(offset)),
        getCodeSize: () => uint8arrToBN(mal.jsvm_env.getCodeSize()),
        getExternalCodeSize: (address) => uint8arrToBN(mal.jsvm_env.getExternalCodeSize(address)),
        getBlockCoinbase: () => uint8ArrayToHexAddr(mal.jsvm_env.getBlockCoinbase()),
        getBlockDifficulty: () => uint8ArrayToHex(mal.jsvm_env.getBlockDifficulty()),
        getGasLeft: () => new BN(mal.jsvm_env.getGasLeft()),
        getBlockGasLimit: () => new BN(mal.jsvm_env.getBlockGasLimit()),
        getTxGasPrice: () => new BN(mal.jsvm_env.getTxGasPrice()),
        getBlockNumber: () => new BN(mal.jsvm_env.getBlockNumber()),
        getBlockTimestamp: () => new BN(mal.jsvm_env.getBlockTimestamp()),
        getBlockChainId: () => new BN(mal.jsvm_env.getBlockChainId()),
        getTxOrigin: () => uint8ArrayToHexAddr(mal.jsvm_env.getTxOrigin()),
        getReturnDataSize: () => new BN(mal.jsvm_env.getReturnDataSize()),
        getMSize: () => new BN(mal.jsvm_env.getMSize()),
        stop: () => uint8ArrayToHex(mal.jsvm_env.stop()),
        return: (offset, len) => uint8ArrayToHex(mal.jsvm_env.finish(offset, len)),
        revert: (offset, len) => uint8ArrayToHex(mal.jsvm_env.finish(offset, len)),

        loadMem: offset => {
            let value = mal.jsvm_env.loadMemory(offset);
            // TODO: proper typecheck
            value = uint8arrToBN(value);
            return value;
        },
        storeMem: (offset, hexvalue) => {
            const encoded = hexToUint8Array(hexvalue);
            mal.jsvm_env.storeMemory(encoded, offset);
            return offset;
        },
        storeMem8: (offset, hexvalue) => {
            if (strip0x(hexvalue).length !== 1) throw new Error(`storeMem8 only receives 1 byte. Value: ${hexvalue}`);
            const encoded = hexToUint8Array(hexvalue);
            mal.jsvm_env.storeMemory8(encoded, offset);
            return offset;
        },
        loadS: (key) => {
            const offset = '0x' + (native_extensions.BN(key)).toString(16);
            let value = mal.jsvm_env.storageLoad(hexToUint8Array(offset));
            return uint8arrToBN(value);
        },
        storeS: (key, value) => {
            key = native_extensions.BN(key);
            const _key = '0x' + key.toString(16);
            const _value = '0x' + (native_extensions.BN(value)).toString(16);
            mal.jsvm_env.storageStore(hexToUint8Array(_key), hexToUint8Array(_value));
            return key;
        },
        uint256Max: () => new BN('10000000000000000000000000000000000000000000000000000000000000000', 16),
        // mimick evm overflow
        add: (a, b) => a.add(b).mod(native_extensions.evm.uint256Max()),
        mul: (a, b) => a.mul(b).mod(native_extensions.evm.uint256Max()),
        // mimick evm underflow
        sub: (a, b) => a.sub(b).mod(native_extensions.evm.uint256Max()),
        sar: (nobits, value) => {
            const _nobits = nobits.toNumber();
            let valueBase2;
            if (value.isNeg()) {
                valueBase2 = value.toTwos(256).toString(2);
            } else {
                valueBase2 = value.toString(2).padStart(256, '0');
            }
            // remove LSB * _nobits
            valueBase2 = valueBase2.substring(0, valueBase2.length - _nobits);
            // add MSB * _nobits
            valueBase2 = valueBase2[0].repeat(_nobits) + valueBase2;
            return (new BN(valueBase2, 2)).fromTwos(256);
        }
    },
    wevm: {
        calldatacopy__: (calldOffset, calldLen) => {
            let offset = mal.allocate(calldLen);
            native_extensions.evm.storeMem(offset, native_extensions.ethabi_encode("uint256", calldLen));
            mal.jsvm_env.callDataCopy(offset + 32, calldOffset, calldLen);
            return offset;
        },
        codecopy__: (codeOffset, codeLen) => {
            let offset = mal.allocate(codeLen);
            native_extensions.evm.storeMem(offset, native_extensions.ethabi_encode("uint256", codeLen));
            mal.jsvm_env.codeCopy(offset + 32, codeOffset, codeLen);
            return offset;
        }
    },
    core: {
        t2_ptr_: t2ptr__ => t2ptr__ + 32,
        t2_len_: t2ptr__ => native_extensions.evm.loadMem(t2ptr__),
        clone__: (ptr, len) => {
            const value = native_extensions.loadMemory(ptr, len);
            const offset =  native_extensions.bytelike_(value);
            return offset;
        },
        join__: (ptr1__, ptr2__) => {
            let value1 = native_extensions.getbytelike__(ptr1__);
            let value2 = native_extensions.getbytelike__(ptr2__);
            return native_extensions.bytelike_(value1 + strip0x(value2));
        },
        tuple___: elems => {
            return native_extensions.tuple___(elems);
        },
        t3_arity_: t3ptr___ => native_extensions.evm.loadMem(native_extensions.BN(t3ptr___).toNumber()).toNumber(),
        t3_ptr_: t3ptr___ => native_extensions.BN(t3ptr___).toNumber() + 32,
        nth_: (t3___, index) => {
            const arity = native_extensions.core.t3_arity_(t3___);
            if (index >= arity) throw new Error('Index out of bounds');

            const ptr = native_extensions.core.t3_ptr_(t3___);
            const value = native_extensions.evm.loadMem(index * 32 + ptr);
            return value;
        },
        rest___: t3___ => {
            const arity = native_extensions.core.t3_arity_(t3___);
            if (arity < 1) return t3___;

            const newarity = arity - 1;
            const ptr = native_extensions.core.t3_ptr_(t3___) + 32;
            const value = native_extensions.loadMemory(ptr, newarity * 32);
            const len = newarity * 32 + 32;

            const hexvalue = (new BN(newarity)).toString(16).padStart(64, '0') + strip0x(value);
            const offset = mal.allocate(len);
            native_extensions.storeMemory(hexvalue, offset, len);
            return offset;
        },
        join___: (t3_1___, t3_2___) => {
            const arity1 = native_extensions.core.t3_arity_(t3_1___);
            const arity2 = native_extensions.core.t3_arity_(t3_2___);
            const ptr1 = native_extensions.core.t3_ptr_(t3_1___);
            const ptr2 = native_extensions.core.t3_ptr_(t3_2___);
            const value1 = native_extensions.loadMemory(ptr1, arity1 * 32);
            const value2 = native_extensions.loadMemory(ptr2, arity2 * 32);

            const hexvalue = (new BN(arity1 + arity2)).toString(16).padStart(64, '0') + strip0x(value1) + strip0x(value2);
            const len = (arity1 + arity2) * 32 + 32;
            const offset = mal.allocate(len);
            native_extensions.storeMemory(hexvalue, offset, len);
            return offset;
        },
        tuple___2list: (t3ptr___) => {
            const ptr = native_extensions.core.t3_ptr_(t3ptr___);
            const arity = native_extensions.core.t3_arity_(t3ptr___);
            const elems = [];
            for (let i = 0; i < arity; i++) {
                elems.push(native_extensions.evm.loadMem(i * 32 + ptr))
            }
            return elems;
        },
        list2tuple___: async (liststr) => {
            return native_extensions.core.tuple___(liststr);
        },
    }
}

mal.repl_env.set(malTypes._symbol('utils'), native_extensions);

modifyEnv('js-eval', async (orig_func, str) => {
    const utils = Object.assign({}, native_extensions, extensions);
    const nil = null;
    let answ;

    try {
        answ = await eval(str.toString());
    } catch(e) {
        console.log(`Expression: ${str}  ;;`, e);
        answ = undefined;
    }

    answ = jsEvalParseBN(answ);
    return interop.js_to_mal(answ);
})

const all_functions = {};

const base_functions = {
    array: 'vector',
    'array?': 'vector?',

    unimplemented: '(fn* () (throw "unimplemented"))',
    'js-str': '(fn* (val) (js-eval (str "utils.jsStr(`" (pr-str val) "`)" )) )',

    'js-str-external': '(fn* (val) (js-eval (str "utils.jsStrExternal(`" (pr-str val) "`)" )) )',

    reduce: '(fn* (f xs init) (if (empty? xs) init (reduce f (rest xs) (f init (first xs)) )))',
    range: '(fn* (start stop step) (js-eval (str "utils.range(" (js-str start) "," (js-str stop) "," (js-str step) ")" )) )',
    push: '(fn* (arr value) (conj arr value) )',
    shift: '(fn* (arr value) (cons value arr) )',

    join: `(fn* (a b) (js-eval (str "utils.join('" a "','" b "')") ) )`,
    length: `(fn* (val)
        (if (sequential? val)
            (js-eval (str
                "utils.listToJsArrayLength('"
                    (pr-str val)
                "')"
            ))
            (let* (
                    strval (pr-str val)
                )
                (js-eval (str
                    strval
                    ".slice(0, 2) === '0x' ? "
                    strval
                    ".substring(2).length / 2 : "
                    strval
                    ".length / 2"
                ))
            )
        )
    )`,

    encode: '(fn* (a) (js-eval (str "utils.encode(" (js-str a) ")") ))',
    evm_unsign: '(fn* (a) (js-eval (str "utils.evm_unsign(" (js-str a) ")") ))',
    bignumber: '(fn* (a) (js-eval (str "utils.BN(" (js-str a) ")") ))',

}

async function init() {
    for (fname of Object.keys(all_functions)) {
        await mal.rep(`(def! ${fname} ${all_functions[fname]})`);
    }

    await mal.reps(`
    (def! t2 (fn* (a b) (list a b "ptr") ))

    (def! t12 (fn* (a) (first a) ))

    (def! t21 (fn* (a) (nth a 1) ))

    `)

    await mal.reps(`
    (def! balances {})

    (def! keccak256 (fn* (& xs) (js-eval (str "utils.keccak256('" (reduce str (map encode xs) "" ) "')") )))

    (def! revert (fn* (a) (throw a) ) )

    (def! return (fn* (a) a ))

    (def! eth-call (fn* (address fsig argList) (js-eval (str "utils.ethcall('" address "','" fsig "'," (js-str argList) ")" )) ))

    (def! eth-call! (fn* (address fsig argList ethvalue) (js-eval (str "utils.ethsend('" address "','" fsig "'," (js-str argList) "," (js-str ethvalue)  ")" )) ))

    (def! eth-sig (fn* (fsig) (js-eval (str "utils.eth_sig('" fsig "')" )) ))

    (def! eth-abi-encode (fn* (types values) (js-eval (str "utils.ethabi_encode(" (js-str types) "," (js-str values) ")" )) ))

    (def! eth-abi-decode (fn* (types values) (js-eval (str "utils.ethabi_decode(" (js-str types) "," (js-str values) ")" )) ))

    (def! wasm-call (fn* (url fname args) (js-eval (str "utils.wasmcall(" (js-str url) "," (js-str fname) "," (js-str args) ")" )) ))

    `)
}

const DEFAULT_TXOBJ = {
    gasLimit: 1000000,
    value: 0,
    gasPrice: 10
}

const underNumberLimit = bnval => bnval.abs().lt(new BN(2).pow(new BN(16)));

Object.assign(all_functions, base_functions);
mal.functions = all_functions;
mal.extend = obj => {
    Object.assign(all_functions, obj);
}
mal.extend(bootstrap_functions);

mal.getBackend = async (address, provider, signer) => {
    address = address || '0x81bD2984bE297E18F310BAef6b895ea089484968';

    const dec = async bnval => {
        console.log('dec', bnval);
        if (bnval instanceof Promise) bnval = await bnval;
        if (typeof bnval === 'number' || typeof bnval === 'object' && bnval._hex) {
            bnval = toBN(bnval);
        }
        if(!bnval) return bnval;

        if (bnval instanceof Array) {
            let vals = []
            for (let val of bnval) {
                vals.push(await dec(val));
            }
            return vals;
        }
        return bnval;
    }

    const from = signer ? await signer.getAddress() : '0xfCbCE2e4d0E19642d3a2412D84088F24bFB33a48';

    await init();

    const interpreter = {
      address,
      call: async (expr, txObj = {}, returntypes) => {
        // expr = expr.replace(/_/g, '');
        txObj = Object.assign({ from }, DEFAULT_TXOBJ, txObj);
        txObj.data = hexToUint8Array(mal.encode(expr).encoded);
        txObj.to = address;

        const internalCallWrap = (index, dataObj) => {}
        const getCache = () => {}

        // receive tx obj
        mal.jsvm.deploy({ data: txObj.data, to: address });
        mal.jsvm_env = mal.jsvm.call(txObj, internalCallWrap, null, getCache);

        Object.keys(mal.jsvm_env).forEach(fname => {
            if (!native_extensions.evm[fname]) {
                native_extensions.evm[fname] = mal.jsvm_env[fname];
            }
        });

        let answ;
        try {
            answ = await mal.re(expr);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }

        answ = await dec(answ);
        if (returntypes) {
            answ = mal.decoderaw(answ, returntypes);
        }
        else if (BN.isBN(answ)) {
            // default return type is uint
            return underNumberLimit(answ) ? answ.toNumber() : answ;
        }

        return answ;
      },
      provider,
      signer: signer || { getAddress: () => from },
    }
    interpreter.send = interpreter.call;
    interpreter.sendAndWait = interpreter.send;
    interpreter.extend = async expression => {
        await mal.rep(expression);
        interpreter.functions = interpreter.getFns();
    }
    interpreter.jsextend = (name, callb) => {
        const utilname = name.replace(/-/g, '_').replace(/!/g, '_bang');
        extensions[utilname] = callb;
        return interpreter.extend(`(def! ${name} (fn* (& xs)
            (js-eval (str
                "utils.${utilname}("
                    (js-str-external xs)
                ")"
            ))
        ))`)
    }
    interpreter.getFns = () => {
        return mal.repl_env.data;
    }
    interpreter.functions = interpreter.getFns();
    // needed for ethcall
    mal.provider = provider;
    mal.signer = signer;
    mal.utils = {
        ethShortAbiToHuman,
        ethHumanAbiToJson,
        ethSig,
        ethSlotSize,
    }
    return interpreter;
}

module.exports = mal;
