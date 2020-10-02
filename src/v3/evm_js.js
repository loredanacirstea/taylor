const evm = {
    stop: 	'(fn* () (js-eval "utils.evm.stop()") )',
	add:  	'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").add(utils.BN(" (js-str b) "))")))',
	mul:  	'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").mul(utils.BN(" (js-str b) "))")))',
	sub:  	'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").sub(utils.BN(" (js-str b) "))")))',
	div:  	`(fn* (a b)
		(if (iszero_ (bignumber b))
			(bignumber 0)
			(js-eval (str "utils.BN(" (js-str (evm_unsign a)) ").div(utils.BN(" (js-str (evm_unsign b)) "))"))
		)
	)`,
	sdiv: `(fn* (a b)
		(if (iszero_ (bignumber b))
			(bignumber 0)
			(js-eval (str "utils.BN(" (js-str a) ").div(utils.BN(" (js-str b) "))"))
		)
	)`,
	mod: `(fn* (a b)
		(if (iszero_ (bignumber b))
			(bignumber 0)
			(js-eval (str "utils.BN(" (js-str (evm_unsign a)) ").mod(utils.BN(" (js-str (evm_unsign b)) "))"))
		)
	)`,
	smod: `(fn* (a b)
		(if (iszero_ (bignumber b))
			(bignumber 0)
			(js-eval (str "utils.BN(" (js-str a) ").mod(utils.BN(" (js-str b) "))"))
		)
	)`,
	addmod: `(fn* (a b c)
		(js-eval (str
			"utils.BN(" (js-str a) ").add(utils.BN(" (js-str b) ")).mod(utils.BN(" (js-str c) "))"
		))
	)`,
	mulmod: `(fn* (a b c)
		(js-eval (str
			"utils.BN(" (js-str a) ").mul(utils.BN(" (js-str b) ")).mod(utils.BN(" (js-str c) "))"
		))
	)`,
    exp:	'(fn* (a b) (js-eval (str "utils.limited_pow(" (js-str a) "," (js-str b) ")")))',
	signextend: 'unimplemented',

	lt:		'(fn* (a b) (js-eval (str "utils.BN(" (js-str (evm_unsign a) ) ").lt(utils.BN(" (js-str (evm_unsign b)) "))")))',
	gt:		'(fn* (a b) (js-eval (str "utils.BN(" (js-str (evm_unsign a)) ").gt(utils.BN(" (js-str (evm_unsign b)) "))")))',
	slt:	'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").lt(utils.BN(" (js-str b) "))")))',
	sgt:	'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").gt(utils.BN(" (js-str b) "))")))',
	eq:		'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").eq(utils.BN(" (js-str b) "))")))',
	iszero:	'(fn* (a) (js-eval (str "utils.BN(" (js-str a) ").isZero()")))',
	and:	'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").and(utils.BN(" (js-str b) "))")) )',
	or:		'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").or(utils.BN(" (js-str b) "))")) )',
	xor:	'(fn* (a b) (js-eval (str "utils.BN(" (js-str a) ").xor(utils.BN(" (js-str b) "))")) )',
	not:	'(fn* (a) (js-eval (str "utils.BN(" (js-str a) ").notn(256)")) )',
	byte:	'(fn* (nth b) (js-eval (str "utils.BN(" (js-str b) ").substring(2).substring(" nth "*2, " nth "*2 + 2)" )) )',
	shl:	'(fn* (a b) (js-eval (str "utils.BN(" (js-str b) ").shln(" a ")")) )',
	shr:	'(fn* (a b) (js-eval (str "utils.BN(" (js-str b) ").shrn(" a ")")) )',
	sar:	`(fn* (a b) (js-eval (str "utils.evm.sar(utils.BN(" (js-str a) "),utils.BN(" (js-str b) "))")) )`,

    keccak256:	`(fn* (a) (js-eval (str "utils.keccak256_(" (js-str a) ")") ))`,
    sha3:	    'keccak256_',

	address:    '(fn* () (js-eval "utils.evm.getAddress()") )',
    balance:    '(fn* (a) (js-eval "utils.evm.getExternalBalance(" (js-str a) ")") )',
	origin:	    '(fn* () (js-eval "utils.evm.getTxOrigin()") )',
	caller:	    '(fn* () (js-eval "utils.evm.getCaller()") )',
	callvalue:	'(fn* () (js-eval "utils.evm.getCallValue()") )',
	calldataload:	'(fn* (offset) (js-eval (str "utils.evm.callDataLoad(" (js-str offset) ")" )) )',
	calldatasize:	'(fn* () (js-eval "utils.evm.getCallDataSize()") )',
	calldatacopy:	'(fn* (offset, pos, size) (js-eval (str "utils.evm.callDataCopy(" (js-str offset) "," (js-str pos) "," (js-str size) ")")) )',
	codesize:	'(fn* () (js-eval "utils.evm.getCodeSize()") )',
	codecopy:	'unimplemented',
	gasprice:	'(fn* () (js-eval "utils.evm.getTxGasPrice()") )',
	extcodesize:	'(fn* (address) 0 )',
	extcodecopy:	'unimplemented',
	returndatasize:	'(fn* () 0 ))',
	returndatacopy:	'unimplemented',
	extcodehash:	'(fn* (address) 0 )',

	blockhash:	'(fn* () (js-eval "utils.evm.getBlockHash()") )',
	coinbase:	'(fn* () (js-eval "utils.evm.getBlockCoinbase()") )',
	timestamp:	'(fn* () (js-eval "utils.evm.getBlockTimestamp()") )',
	number:		'(fn* () (js-eval "utils.evm.getBlockNumber()") )',
	difficulty:	'(fn* () (js-eval "utils.evm.getBlockDifficulty()") )',
    gaslimit:	'(fn* () (js-eval "utils.evm.getBlockGasLimit()") )',
    chainid: '(fn* () (js-eval "utils.evm.getBlockChainId()") )',
	selfbalance: '(fn* () (js-eval "utils.evm.getSelfBalance()") )',

	pop:	'unimplemented',
	mload:	'(fn* (ptr) (js-eval (str "utils.evm.loadMem(" ptr ")") ))',
	mstore:	'(fn* (ptr, value) (js-eval (str "utils.evm.storeMem(" (js-str ptr) "," (js-str value) ")") ))',
	mstore8:	'(fn* (ptr, value) (js-eval (str "utils.evm.storeMem8(" (js-str ptr) "," (js-str value) ")") ))',
	sload:	`(fn* (key) (js-eval (str "utils.evm.loadS(" (js-str key) ")") ))`,
	sstore:	'(fn* (key, value) (js-eval (str "utils.evm.storeS(" (js-str key) "," (js-str value) ")") ))',
	jump:	'unimplemented',
	jumpi:	'unimplemented',
	pc:		'unimplemented',
	msize:	'(fn* () (js-eval "utils.evm.getMSize()") )',
	gas:	'(fn* () (js-eval "utils.evm.getGasLeft()") )',
	jumpdest:	'unimplemented',

	create:	'(fn* (balance, offset, len) (js-eval (str "utils.evm.create(" (js-str balance) "," (js-str offset) "," (js-str len) ")") ))',
	call:	'unimplemented',
	callcode:	'unimplemented',
	return:	'(fn* (ptr len) (js-eval (str "utils.evm.return(" (js-str ptr) "," (js-str len) ")" )) )',
	delegatecall:   'unimplemented',
    create2:    'unimplemented',
	staticcall:	'unimplemented',
	revert: '(fn* (ptr len) (js-eval (str "utils.evm.revert(" (js-str ptr) "," (js-str len) ")" )) )',
	invalid: '(fn* () (js-eval "utils.evm.invalid()") )',
    selfdestruct:   'unimplemented',
}

module.exports = evm;
