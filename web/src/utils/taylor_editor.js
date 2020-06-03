const defaultValues = {
    uint: 1,
    bool: true,
    address: `0x""`,
    bytes: `0x""`,
}

const monacoTaylorExtension = (monaco, taylorFunctions) => {
    monaco.languages.register({ id: 'taylor' });

    const funcSuggestions = Object.keys(taylorFunctions).map(name => {
        const func = taylorFunctions[name];
        let argsdetail = '';
        if (func.inputs) argsdetail = func.inputs.map(inp => inp.type).join(',')
        else argsdetail = [...new Array(func.arity || 0)]
            .map((_, i) => 'arg_' + i)
            .join(', ');
        if (!func.arity) argsdetail = 'a, b...';

        let insertText = func.construct;
        if (!insertText) {
            // TODO: args
            insertText = name;
        }
        return {
            label: name,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: insertText + ')',
            detail: '(' + argsdetail + ')',
            documentation: func.docs,
          }
    });

    // Register a completion item provider for the new language
    monaco.languages.registerCompletionItemProvider('taylor', {
      triggerCharacters: ['('],
      provideCompletionItems: () => {
        
        var suggestions = [{
          label: 'simpleText',
          kind: monaco.languages.CompletionItemKind.Text,
          insertText: 'simpleText'
        }, {
          label: 'testing',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'testing(${1:condition})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        }, {
          label: 'ifelse',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            'if (${1:condition}) {',
            '\t$0',
            '} else {',
            '\t',
            '}'
          ].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'If-Else Statement'
        }];
        
        return { suggestions: funcSuggestions };
      }
    });
}

module.exports = {
    monacoTaylorExtension
}
