import React, { Component } from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as taylorUtils from '../utils/taylor.js';
import { editorOpts } from '../utils/config.js';

class GrammarDev extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: taylorUtils.getGrammar(),
    }
  }
  editorDidMount(editor, monaco) {
    editor.focus();
  }
  onChange(newValue, e) {
    taylorUtils.storeGrammar(newValue);
  }
  render() {
    const {styles} = this.props;
    const {code} = this.state;

    return (
      <MonacoEditor
        width={styles.width}
        height={styles.height}
        language="javascript"
        theme="vs-dark"
        value={code}
        options={editorOpts}
        onChange={this.onChange}
        editorDidMount={this.editorDidMount}
      />
    );
  }
}

export default GrammarDev;
