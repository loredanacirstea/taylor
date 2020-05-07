import React, { Component } from 'react';
import { ScrollView } from 'react-native';
import { View, Text } from 'native-base';
import MonacoEditor from 'react-monaco-editor';
import ReactJson from 'custom-react-json-view'
import Taylor from 'taylor';
import { editorOpts } from '../utils/config.js';
import * as taylorUtils from '../utils/taylor.js';

const getResult = code => {
  let result;
  let errors;
  try {
    result = Taylor.compile(code);
  } catch (e) {
    errors = e;
  }
  result = result ? result.results : [];

  return { result, errors };
}

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      code: taylorUtils.getCode(),
      ...getResult(taylorUtils.getCode()),
    }

    this.onChange = this.onChange.bind(this);
  }

  editorDidMount(editor, monaco) {
    console.log('editorDidMount', editor);
    editor.focus();
  }

  onChange(newValue, e) {
    console.log('onChange', newValue, e);
    this.setState({ ...getResult(newValue), code: newValue });
    taylorUtils.storeCode(newValue);
  }

  render() {
    const {styles} = this.props;
    const {code, result, errors} = this.state;
    const editorHeight = styles.height * 2 / 3;
    const consoleHeight = styles.height - editorHeight;

    return (
      <View style={{ ...styles, flex: 1 }}>
        <View style={{ ...styles, height: editorHeight.height, flex: 1 }}>
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
        <ScrollView
          horizontal={false}
          scrollEnabled={true}
          scrollEventThrottle={100}
          nestedScrollEnabled={true}
          contentContainerStyle={{width: styles.width}}
          style={{ ...styles, height: consoleHeight.height, flex: 1 }}
        >
          <ScrollView
            horizontal={true}
            scrollEnabled={true}
            scrollEventThrottle={100}
            contentContainerStyle={{width: styles.width}}
            style={{ ...styles, height: consoleHeight.height, flex: 1 }}
          >
            {errors
              ? <Text style={{color: 'firebrick'}}>{errors.toString()}</Text>
              : <ReactJson
                src={result}
                name="result"
                theme="twilight"
                collapsed={false}
              />
            }
          </ScrollView>
        </ScrollView>
      </View>
    );
  }
}

export default Editor;
