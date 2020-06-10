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
            insertText: insertText + ')',
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
}

export {
    monacoTaylorExtension,
    argsDisplay,
}
