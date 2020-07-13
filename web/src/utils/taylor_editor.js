const defaultValues = {
    uint: 12,
    bool: true,
    address: `0x"0000000000000000000000000000000000000000"`,
    bytes: `0x"00"`,
    symbol: 'name',
    list: '12 13',
    any: 'somename',
}

const argsDisplay = func => {
    let argsdetail;
    
    if (func.inputs) argsdetail = func.inputs.map(inp => inp.type).join(' ');
    else argsdetail = [...new Array(func.arity || 0)]
        .map((_, i) => 'arg_' + i)
        .join(' ');
    
    if (typeof func.arity !== 'undefined') {
        if (!func.arity) {
            argsdetail = 'a b ...';
        }
    } else {
        argsdetail = '';
    }
    return argsdetail;
}

const monacoTaylorExtension = (monaco, taylorFunctions) => {
    monaco.languages.register({ id: 'taylor' });

    const funcSuggestions = (range) => Object.keys(taylorFunctions).map(name => {
        const func = taylorFunctions[name];
        let argsdetail = argsDisplay(func);

        let insertText = func.construct;
        if (!insertText) {
            insertText = name;
            if (func.inputs) {
                insertText += ' ' + func.inputs.map(inp => defaultValues[inp.type]).join(' ');
            }
        }
        return {
            label: name + (func.own ? ' *' : (func.registered ? ' **' : '')),
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: insertText,
            detail: '(' + argsdetail + ')',
            documentation: func.docs,
            range
          }
    });

    // Register a completion item provider for the new language
    monaco.languages.registerCompletionItemProvider('taylor', {
      triggerCharacters: ['('],
      provideCompletionItems: (model, position) => {

        let word = model.getWordUntilPosition(position);
        let range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };
        return { suggestions: funcSuggestions(range) };
      }
    });

    const config = {"surroundingPairs":[{"open":"(","close":")"}],"autoClosingPairs":[{"open":"(","close":")"}],"brackets":[["(",")"]]}
    monaco.languages.setLanguageConfiguration("taylor", config);

    // Register a tokens provider for the language
    monaco.languages.setMonarchTokensProvider('taylor', {
        keywords: Object.keys(taylorFunctions),
        brackets: [
            { open: '(', close: ')', token: 'delimiter.parenthesis' },
        ],
        tokenizer: {
            root: [
                // [/\([\w|*|!|?]+/, 'function-name'],
                [/(?:\()([\w|*|!|?]+)/g, 'function-name'],
                [/\(|\)/, 'parenthesis'],
            ]
        }
    });

    // Define a new theme that contains only rules that match this language
    monaco.editor.defineTheme('tay-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'function-name', foreground: 'cca768', fontStyle: 'bold' },
            { token: 'parenthesis', foreground: '9b703f' },
        ]
    });
}

export {
    monacoTaylorExtension,
    argsDisplay,
}
