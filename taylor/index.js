import nearley from 'nearley';
const compile = require('nearley/lib/compile');
const generate = require('nearley/lib/generate');
const nearleyGrammar = require('nearley/lib/nearley-language-bootstrapped');
import Taylor from './taylor.js';

const compileTaylor = source => {
  const parser = new nearley.Parser(Taylor);
  return parser.feed(source);
}


const compileDev = (dev_grammar, source) => {
  const { grammar, errors } = compileGrammar(dev_grammar);

  if (errors) return { result: null, errors };

  const parser = new nearley.Parser(grammar);
  return { result: parser.feed(source), errors };
}

function compileGrammar(sourceCode) {
  let errors;
  let grammar;

  // Parse the grammar source into an AST
  const grammarParser = new nearley.Parser(nearleyGrammar);

  try {
    grammarParser.feed(sourceCode);
    const grammarAst = grammarParser.results[0];

    // Compile the AST into a set of rules
    const grammarInfoObject = compile(grammarAst, {});

    // Generate JavaScript code from the rules
    grammar = generate(grammarInfoObject, 'grammar');
  } catch (e) {
    errors = e;
  }

  if (errors) return { result: null, errors };

  // Pretend this is a CommonJS environment to catch exports from the grammar.
  const module = { exports: {} };
  eval(grammar);

  return { grammar: module.exports };
}

export default {
  nearley,
  Taylor,
  compile: compileTaylor,
  compileDev,
}
