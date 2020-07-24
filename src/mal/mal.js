if (typeof module !== 'undefined') {
    var types = require('./types');
    // var readline = require('./node_readline');
    var reader = require('./reader');
    var printer = require('./printer');
    var Env = require('./env').Env;
    var core = require('./core');
}

// read
function READ(str) {
    return reader.read_str(str);
}

// eval
function is_pair(x) {
    return types._sequential_Q(x) && x.length > 0;
}

function quasiquote(ast) {
    if (!is_pair(ast)) {
        return [types._symbol("quote"), ast];
    } else if (types._symbol_Q(ast[0]) && ast[0].value === 'unquote') {
        return ast[1];
    } else if (is_pair(ast[0]) && ast[0][0].value === 'splice-unquote') {
        return [types._symbol("concat"),
                ast[0][1],
                quasiquote(ast.slice(1))];
    } else {
        return [types._symbol("cons"),
                quasiquote(ast[0]),
                quasiquote(ast.slice(1))];
    }
}

function is_macro_call(ast, env) {
    return types._list_Q(ast) &&
           types._symbol_Q(ast[0]) &&
           env.find(ast[0]) &&
           env.get(ast[0])._ismacro_;
}

async function macroexpand(ast, env) {
    while (is_macro_call(ast, env)) {
        var mac = env.get(ast[0]);
        ast = await mac.apply(mac, ast.slice(1));
    }
    return ast;
}

async function eval_ast(ast, env) {
    if (types._symbol_Q(ast)) {
        return env.get(ast);
    } else if (types._list_Q(ast)) {
        let l = []
        for (let a of ast) {
            l.push(await EVAL(a, env));
        }
        return l;
    } else if (types._vector_Q(ast)) {
        let v = []
        for (let a of ast) {
            v.push(await EVAL(a, env));
        }
        v.__isvector__ = true;
        return v;
    } else if (types._hash_map_Q(ast)) {
        var new_hm = {};
        for (k in ast) {
            new_hm[await EVAL(k, env)] = await EVAL(ast[k], env);
        }
        return new_hm;
    } else {
        return ast;
    }
}

async function _EVAL(ast, env) {
    while (true) {

    //printer.println("EVAL:", printer._pr_str(ast, true));
    if (!types._list_Q(ast)) {
        return eval_ast(ast, env);
    }

    // apply list
    ast = await macroexpand(ast, env);
    if (!types._list_Q(ast)) {
        return eval_ast(ast, env);
    }
    if (ast.length === 0) {
        return ast;
    }

    var a0 = ast[0], a1 = ast[1], a2 = ast[2], a3 = ast[3];
    switch (a0.value) {
    case "def!":
        var res = await EVAL(a2, env);
        return env.set(a1, res);
    case "let*":
        var let_env = new Env(env);
        for (var i=0; i < a1.length; i+=2) {
            let_env.set(a1[i], await EVAL(a1[i+1], let_env));
        }
        ast = a2;
        env = let_env;
        break;
    case "quote":
        return a1;
    case "quasiquote":
        ast = quasiquote(a1);
        break;
    case 'defmacro!':
        var func = types._clone(await EVAL(a2, env));
        func._ismacro_ = true;
        return env.set(a1, func);
    case 'macroexpand':
        return macroexpand(a1, env);
    case "try*":
        try {
            return EVAL(a1, env);
        } catch (exc) {
            if (a2 && a2[0].value === "catch*") {
                if (exc instanceof Error) { exc = exc.message; }
                return EVAL(a2[2], new Env(env, [a2[1]], [exc]));
            } else {
                throw exc;
            }
        }
    case "do":
        await eval_ast(ast.slice(1, -1), env);
        ast = ast[ast.length-1];
        break;
    case "if":
        var cond = await EVAL(a1, env);
        if (cond === null || cond === false || cond === 0 || (cond._hex && parseInt(cond._hex, 16) === 0)) {
            ast = (typeof a3 !== "undefined") ? a3 : null;
        } else {
            ast = a2;
        }
        break;
    case "fn*":
        return types._function(EVAL, Env, a2, env, a1);
    default:
        var el = await eval_ast(ast, env), f = el[0];
        if (f.__ast__) {
            ast = f.__ast__;
            env = f.__gen_env__(el.slice(1));
        } else {
            return f.apply(f, el.slice(1));
        }
    }

    }
}

async function EVAL(ast, env) {
    var result = await _EVAL(ast, env);
    return (typeof result !== "undefined") ? result : null;
}

// print
function PRINT(exp) {
    return printer._pr_str(exp, true);
}

// repl
var repl_env = new Env();
var rep = async function(str) { return PRINT(await EVAL(READ(str), repl_env)); };

// core.js: defined using javascript
for (var n in core.ns) { repl_env.set(types._symbol(n), core.ns[n]); }
repl_env.set(types._symbol('eval'), function(ast) {
    return EVAL(ast, repl_env); });
repl_env.set(types._symbol('*ARGV*'), []);

// core.mal: defined using the language itself
rep("(def! *host-language* \"javascript\")")
rep("(def! not (fn* (a) (if a false true)))");
// rep("(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\nnil)\")))))");
rep("(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))");

// if (typeof process !== 'undefined' && process.argv.length > 2) {
//     repl_env.set(types._symbol('*ARGV*'), process.argv.slice(3));
//     rep('(load-file "' + process.argv[2] + '")');
//     process.exit(0);
// }

// // repl loop
// if (typeof require !== 'undefined' && require.main === module) {
//     // Synchronous node.js commandline mode
//     rep("(println (str \"Mal [\" *host-language* \"]\"))");
//     while (true) {
//         var line = readline.readline("user> ");
//         if (line === null) { break; }
//         try {
//             if (line) { printer.println(rep(line)); }
//         } catch (exc) {
//             if (exc instanceof reader.BlankException) { continue }
//             if (exc instanceof Error) { console.warn(exc.stack) }
//             else { console.warn("Error: " + printer._pr_str(exc, true)) }
//         }
//     }
// }

let mal = {};
exports.EVAL = mal.EVAL = EVAL;
exports.PRINT = mal.PRINT = PRINT;
exports.READ = mal.READ = READ;
exports.repl_env = mal.repl_env = repl_env;
exports.rep = mal.rep = rep;
