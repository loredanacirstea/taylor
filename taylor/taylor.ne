@{%

function plus(a,b){return parseFloat(a)+parseFloat(b);}
function minus(a,b){return parseFloat(a)-parseFloat(b);}
function mul(a,b){return parseFloat(a)*parseFloat(b);}
function div(a,b){return parseFloat(a)/parseFloat(b);}
function concat(a,b){return a+b;}
function byte1(){return '00';}

const getSize = tvalue => parseInt('0x' + tvalue.substring(2, 8), 16)

const getSignatureLength = tvalue => {
  const size = getSize(tvalue);
  if (size === 0) return 4;

  const type_head = tvalue.substring(0, 2);
  switch (type_head) {
    case '44':
      return 8;
    case '45':
      return 4 + getSignatureLength(tvalue.substring(8))
    default:
      return 4;
  }
}
const getSignatureLengthHex = tvalue => 2 * getSignatureLength(tvalue)

function getTypeSignature(tvalue) {
  const length = getSignatureLengthHex(tvalue);
  return tvalue.substring(0, length);
}

let frame ={}
let steps = []
let usedf = new Set();

let functions= {
  final: function(args){console.log("fff",args,frame,"steps",steps);},

  add: function(args){if (args) return args.reduce(plus,0);},
  sub: function(args){if (args) return args.reduce(minus,0);},
  mul: function(args){if (args) return args.reduce(mul,1);},
  div: function(args){if (args) return args.reduce(div,1);},
  byte1: function(args){if (args) return byte1();},
  sin: function(...args){if (args) return Math.sin(args[0]);},
  map: function(args){if (1 in args)  return args[1].map(args[0]);},
  list: function(args){ console.log("listt",args); return args;},
  fun: function(args){ console.log("funn",args); return functions[args[0]];},
  defun: function(args){ console.log("defun",args); return args;},
  contig: function(args){ console.log("contig",args, args[1]);if (1 in args) return args[1].repeat(args[0]);},
  "a": function(args){},
  concat: function(args){if (args) return args.reduce(concat,"");},
  car: function(args){console.log("car",args);if (args) return args[0][0];},

  identity: function(args){return args;},
  dtnew: function(args){return args;},
  reduce: function(args){if (1 in args) return args[1].reduce(args[0], args[2]);},
  curry: function(args){return args;},
  cast: function(args){return args;},
  getTypeSignature: function(args){return getTypeSignature(args[0]);},
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
    "mul": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333333"},
    "map": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333332"},
    "reduce": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333331"},
    "curry": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333328"},
    "cast": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "3333331c"},
    "getTypesignature": {"fun": function(args){if (args) return args.reduce(concat,"");}, "sig": "33333329"}

}

function call(code, args) {
  //if (code != steps[steps.length-1] )
  for ( let i = 0; i < steps.length; i ++ ) {
      if (code == steps[i][0] ) {
        if (steps[i][1][0] == args[0] || steps[i][1][0][0] == args[0][0] || (""+steps[i][1][0])[0] ==  (""+args[0])[0])
          // console.log("+? ",(""+steps[i][1][0])[0], (""+args[0])[0])
          steps.splice(i, 1);
      }
  }

  steps.push([code,args])

  usedf.add(code);

  if (code in functions) {
    return functions[code](args)
  } else {
    frame[code] = new Function('return '+args[0]+';')
    return args[0]
  }
}


%}


main ->  ( _ line ):* _  {% function(d) {
    // console.log("main ", d );
    if (d[0][0]) {
      call("final", d[0][0][1].v);
      return {
        steps: steps,
        type:'main',
        d:d,
        v:d[0].map(x=>x[1].v),
        tr: ethcontract,
        usedf: [...usedf]
      }
    }
} %}

line -> _ P _   {% function(d) {
  return {type:'line', d:d, v:d[1].v}
} %}


# Parentheses
P -> "(" _ E _ ")" {% function(d) {
        return {type:'P', d:d, v:d[2].v}
      } %}
  | _ V  {% function(d) {
        // console.log("N " , d[1]);
        return {type:'N', d:d, v:d[1].v};
      }  %}
  | "(" _ ")"		{% function(d) {
        return {type:'P', d:d, v:""}
      } %}



# Expression
E -> ident _ ( __ P):+  {% function(d) {
  // console.log("as",d);
  return {
    type:d[0].v,
    d:d,
    v: call(
      d[0].v,
      d[2].map(x => {
        // console.log("x1",x[1]);
        if ("v" in x[1]) {return x[1].v}
        else {return x[1].d[1].v}
      })
    )
  }
} %}



ident -> [a-zA-Z_] [a-zA-Z0-9_]:* {% function(d) {let val = d[0]+d[1].join("" ); if (val in frame) val = frame[val]();return {type:'ident', d:d, v: val}} %}

# Value
V -> float          {% function(d) {
        // console.log("float",d);
        return {v:d[0].v}
      } %}
  | ident {% function(d) {
        return {type:'ident', d:d, v:d[0].v}
      } %}
  | string {% function(d) {
        // console.log("stri",d);
        return {type:'string', d:d, v:d[0].v}
      } %}

string -> "\"" [a-zA-Z0-9_]:* "\"" {% function(d) {
  // console.log("striii ",d);
  return {v: d[1].join("")}
}  %}

# I use `float` to basically mean a number with a decimal point in it
float ->
      int "." ipositive   {% function(d) {return {v:parseFloat(d[0].v + d[1] + d[2].v)}} %}
    | int           {% function(d) {
          // console.log("int",d);
          return {v:parseInt(d[0].v)}
      } %}

int -> ipositive {% function(d) {
        // console.log("ipos",d);
        return {type:"ip",d:d,v:d[0].v}
      } %}
  | inegative  {% function(d) {return {type:"in",d:d,v:d[0].v}} %}

inegative -> "-" [0-9]:+        {% function(d) {return {v: d[0]+d[1].join("")}} %}

ipositive -> [0-9]:+        {% function(d) {return {v: d[0].join("")}}  %}

# Whitespace. The important thing here is that the postprocessor
# is a null-returning function. This is a memory efficiency trick.
_ -> [\s]:*     {% function(d) {return null } %}
__ -> [\s]:+   {% function(d) {return null } %}
