// Generated automatically by nearley, version undefined
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }


function plus(a,b){return parseFloat(a)+parseFloat(b);}
function minus(a,b){return parseFloat(a)-parseFloat(b);}
function mul(a,b){return parseFloat(a)*parseFloat(b);}
function div(a,b){return parseFloat(a)/parseFloat(b);}
function concat(a,b){return a+b;}

let frame ={}
let steps = []

let functions= {
	final: function(args){console.log("fff",args,frame,"steps",steps);},
	
	add: function(args){if (args) return args.reduce(plus,0);},
	sub: function(args){if (args) return args.reduce(minus,0);},
	mul: function(args){if (args) return args.reduce(mul,1);},
	div: function(args){if (args) return args.reduce(div,1);},
	sin: function(...args){if (args) return Math.sin(args[0]);},
	map: function(args){if (1 in args)  return args[1].map(args[0]);},
	list: function(args){ console.log("listt",args); return args;},
	fun: function(args){ console.log("funn",args); return functions[args[0]];},
	defun: function(args){ console.log("defun",args); return args;},
	contig: function(args){ console.log("contig",args);if (1 in args) return args[1].repeat(args[0]);},
	"a": function(args){},
	concat: function(args){if (args) return args.reduce(concat,"");},
	car: function(args){console.log("car",args);if (args) return args[0][0];},
	
	
}

let ethcontract = { 
    "byte1": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333338"},
    "contig": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333335"},
    "concat": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333330"},
    "identity": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333334"},
    "new": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333337"},
    "add": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "3333331f"},
    "sub": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "3333331e"},
    "div": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "3333331d"},
    "prod": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333333"},
    "map": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333332"},
    "reduce": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333331"},
    "curry": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333328"},
    "cast": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "3333331c"},
    "getTypesignature": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333329"}
    
}


function call(code, args){
	console.log(code, args)
	//if (code != steps[steps.length-1] ) 
	for ( let i = 0 ; i< steps.length ; i++ ){
		console.log(code == steps[i][0], steps[i][1][0] == args[0])// , steps[i][1][0][0] == args[0][0])
		//if (code == steps[i][0] && steps[i][1][0] == args[0]) {
			//  || steps[i][1][0][0] == args[0][0])
			if (code == steps[i][0] ){
				//((!!steps[i][1][0] && !!args[0] && steps[i][1][0] == args[0]) || (!!steps[i][1][0][0] && !!args[0][0] && steps[i][1][0][0] == args[0][0])))
				if (steps[i][1][0] == args[0] || steps[i][1][0][0] == args[0][0] || (""+steps[i][1][0])[0] ==  (""+args[0])[0])
					console.log("+? ",(""+steps[i][1][0])[0], (""+args[0])[0])
					steps.splice(i, 1);
			}
		/*
			if (code == steps[i][0] && steps[i][1][0][0] == args[0][0]){
				//((!!steps[i][1][0] && !!args[0] && steps[i][1][0] == args[0]) || (!!steps[i][1][0][0] && !!args[0][0] && steps[i][1][0][0] == args[0][0])))
			steps.splice(i, 1);
			} */
	}
	steps.push([code,args])
	
	if (code in functions){
		console.log(code, args,functions[code])
		return functions[code](args)
	} else {
		frame[code] = new Function('return '+args[0]+';') 
		return args[0]
	}
}


var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "main$ebnf$1", "symbols": []},
    {"name": "main$ebnf$1$subexpression$1", "symbols": ["_", "line"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1$subexpression$1", "main$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "main", "symbols": ["main$ebnf$1", "_"], "postprocess": function(d) {console.log("main ", d );if (d[0][0]) {call("final", d[0][0][1].v);return {steps: steps,type:'main', d:d, v:d[0].map(x=>x[1].v)}}}},
    {"name": "line", "symbols": ["_", "P", "_"], "postprocess": function(d) {return {type:'line', d:d, v:d[1].v}}},
    {"name": "P", "symbols": [{"literal":"(","pos":37}, "_", "E", "_", {"literal":")","pos":45}], "postprocess": function(d) {return {type:'P', d:d, v:d[2].v}}},
    {"name": "P", "symbols": ["_", "V"], "postprocess": function(d) {console.log("N " , d[1]);return {type:'N', d:d, v:d[1].v};}},
    {"name": "P", "symbols": [{"literal":"(","pos":59}, "_", {"literal":")","pos":63}], "postprocess": function(d) {return {type:'P', d:d, v:""}}},
    {"name": "E$ebnf$1$subexpression$1", "symbols": ["__", "P"]},
    {"name": "E$ebnf$1", "symbols": ["E$ebnf$1$subexpression$1"]},
    {"name": "E$ebnf$1$subexpression$2", "symbols": ["__", "P"]},
    {"name": "E$ebnf$1", "symbols": ["E$ebnf$1$subexpression$2", "E$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "E", "symbols": ["ident", "_", "E$ebnf$1"], "postprocess": function(d) {console.log("as",d); return {type:d[0].v, d:d, v: call(d[0].v, d[2].map(x=>{ console.log("x1",x[1]); if ("v" in x[1]) {return x[1].v} else {return x[1].d[1].v}}) )}}},
    {"name": "ident$ebnf$1", "symbols": []},
    {"name": "ident$ebnf$1", "symbols": [/[a-zA-Z0-9_]/, "ident$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "ident", "symbols": [/[a-zA-Z_]/, "ident$ebnf$1"], "postprocess": function(d) {let val = d[0]+d[1].join("" ); if (val in frame) val = frame[val]();return {type:'ident', d:d, v: val}}},
    {"name": "V", "symbols": ["float"], "postprocess": function(d) {console.log("float",d); return {v:d[0].v} }},
    {"name": "V", "symbols": ["ident"], "postprocess": function(d) {return {type:'ident', d:d, v:d[0].v}}},
    {"name": "V", "symbols": ["string"], "postprocess": function(d) {console.log("stri",d); return {type:'string', d:d, v:d[0].v}}},
    {"name": "string$ebnf$1", "symbols": []},
    {"name": "string$ebnf$1", "symbols": [/[a-zA-Z0-9_]/, "string$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "string", "symbols": [{"literal":"\"","pos":124}, "string$ebnf$1", {"literal":"\"","pos":129}], "postprocess": function(d) {console.log("striii ",d); return {v: d[1].join("")}}},
    {"name": "float", "symbols": ["int", {"literal":".","pos":141}, "ipositive"], "postprocess": function(d) {return {v:parseFloat(d[0].v + d[1] + d[2].v)}}},
    {"name": "float", "symbols": ["int"], "postprocess": function(d) {console.log("int",d);return {v:parseInt(d[0].v)}}},
    {"name": "int", "symbols": ["ipositive"], "postprocess": function(d) {console.log("ipos",d);return {type:"ip",d:d,v:d[0].v}}},
    {"name": "int", "symbols": ["inegative"], "postprocess": function(d) {return {type:"in",d:d,v:d[0].v}}},
    {"name": "inegative$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "inegative$ebnf$1", "symbols": [/[0-9]/, "inegative$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "inegative", "symbols": [{"literal":"-","pos":171}, "inegative$ebnf$1"], "postprocess": function(d) {return {v: d[0]+d[1].join("")}}},
    {"name": "ipositive$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "ipositive$ebnf$1", "symbols": [/[0-9]/, "ipositive$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "ipositive", "symbols": ["ipositive$ebnf$1"], "postprocess": function(d) {return {v: d[0].join("")}}},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": [/[\s]/, "_$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null }},
    {"name": "__$ebnf$1", "symbols": [/[\s]/]},
    {"name": "__$ebnf$1", "symbols": [/[\s]/, "__$ebnf$1"], "postprocess": function arrconcat(d) {return [d[0]].concat(d[1]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null }}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
