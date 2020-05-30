import React, { Component } from 'react';
import { View, Button, Icon } from 'native-base';
import MonacoEditor from 'react-monaco-editor';
import { editorOpts } from '../utils/config.js';
import * as taylorUtils from '../utils/taylor.js';
import Out from './Out.js';

class EditorMalTay extends Component {
  constructor(props) {
    super(props);

    const newgr =  taylorUtils.getCode();

    this.state = {
      code: taylorUtils.getCode(),
      ...newgr,
      autocompile: true,
    }

    // this.onChange = this.onChange.bind(this);
    // this.props.onGraphChange(newgr);
  }

  getResult(code) {
      return {}
    // return getResult(this.props.grammar, code);
  }

  editorDidMount(editor, monaco) {
    console.log('editorDidMount', editor);
    editor.focus();
  }

//   onChange(newValue, force) {
//     this.setState({ code: newValue });
//     taylorUtils.storeCode(newValue);

//     if (this.state.autocompile || force === true) {
//       const newgr = this.getResult(newValue);
//       this.setState({ ...newgr });
//       this.props.onGraphChange(newgr);
//     }
//   }

  render() {
    const {styles} = this.props;
    const {code, result, errors} = this.state;
    const editorHeight = styles.height * 2 / 3;
    const consoleHeight = styles.height - editorHeight;
    console.log('result', result);

    return (
      <View style={{ ...styles, flex: 1 }}>
        <View style={{ ...styles, height: styles.height - editorHeight, flex: 1 }}>
          <MonacoEditor
            width={styles.width}
            height={editorHeight}
            language="javascript"
            theme="vs-dark"
            value={code}
            options={editorOpts}
            onChange={this.onChange}
            editorDidMount={this.editorDidMount}
          />
        </View>
        <Out 
          result={result}
          errors={errors}
          styles={{ ...styles, height: consoleHeight.height }}
        />
      </View>
    );
  }
}

export default EditorMalTay;
