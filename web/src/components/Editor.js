import React, { Component } from 'react';
import { ScrollView } from 'react-native';
import { View, Text, Button, Icon } from 'native-base';
import MonacoEditor from 'react-monaco-editor';
import ReactJson from 'custom-react-json-view'
import Taylor from 'taylor';
import { editorOpts } from '../utils/config.js';
import * as taylorUtils from '../utils/taylor.js';

const getResult = (grammar, code) => {
  let result = [];
  let errors;
  try {
    ({ result, errors } = Taylor.compileDev(grammar, code));
    if (errors) {
      errors = errors.toString();
    }
  } catch (e) {
    if (!errors) {
      errors = e.toString();
    }
  }

  if (result) {
    result = {
      output: result.results ? result.results[0].v : [],
      result: result.results
    }
  }

  return { result, errors };
}

class Editor extends Component {
  constructor(props) {
    super(props);

    const newgr = getResult(props.grammar, taylorUtils.getCode());

    this.state = {
      code: taylorUtils.getCode(),
      ...newgr,
      autocompile: true,
    }

    this.onChange = this.onChange.bind(this);
    this.props.onGraphChange(newgr);
  }

  getResult(code) {
    return getResult(this.props.grammar, code);
  }

  editorDidMount(editor, monaco) {
    console.log('editorDidMount', editor);
    editor.focus();
  }

  onChange(newValue, force) {
    this.setState({ code: newValue });
    taylorUtils.storeCode(newValue);

    if (this.state.autocompile || force === true) {
      const newgr = this.getResult(newValue);
      this.setState({ ...newgr });
      this.props.onGraphChange(newgr);
    }
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
              ? <Text style={{color: 'firebrick'}}>{errors}</Text>
              : <ReactJson
                src={result}
                name="result"
                theme="twilight"
                collapsed={6}
                shouldCollapse={field => field.name === 'd' }
              />
            }
          </ScrollView>
        </ScrollView>
        <Button
          small
          light
          style={{ position: 'fixed', top: '0px', left: '50%', backgroundColor: 'white',  opacity: this.state.autocompile ? 0.5 : 0.2 }}
          onClick={() => {
            this.setState({ autocompile: !this.state.autocompile });
            this.onChange(this.state.code, true)
          }}
        >
          <Icon type="FontAwesome" name='refresh' />
        </Button>
      </View>
    );
  }
}

export default Editor;
