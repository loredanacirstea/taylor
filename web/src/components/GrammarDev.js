import React, { Component } from 'react';
import MonacoEditor from 'react-monaco-editor';
import { editorOpts } from '../utils/config.js';

class GrammarDev extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: props.grammar,
    }

    this.onChange = this.onChange.bind(this);
  }

  editorDidMount(editor, monaco) {
    editor.focus();
  }

  onChange(newValue, e) {
    this.props.onGrammarChange(newValue);
    this.setState({ code: newValue });
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
