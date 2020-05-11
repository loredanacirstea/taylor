import React, { Component } from 'react';
import { Dimensions, StyleSheet, ScrollView } from 'react-native';
import { Button, Icon } from 'native-base';
import './App.css';
import GrammarDev from './components/GrammarDev.js';
import GraphView from './components/GraphView.js';
import * as taylorUtils from './utils/taylor.js';

const MIN_WIDTH = 800;

function getPageSize(noOfPages, {width, height}) {
  console.log('--dimensions', noOfPages, {width, height});
  if (width < MIN_WIDTH) return {minWidth: width, minHeight: height};

  return {width: width / noOfPages, height};
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ...this.getWindowDimensions(),
      pageNumber: 2,
      grammar: taylorUtils.getGrammar(),
      autocompile: true,
    }

    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.getWindowDimensions = this.getWindowDimensions.bind(this);
    this.onGrammarChange = this.onGrammarChange.bind(this);
  }

  onContentSizeChange() {
    this.setState(this.getWindowDimensions());
  }

  getWindowDimensions() {
    let wdims = Dimensions.get('window');
    let rootDims = document.getElementById('TaylorRoot').getBoundingClientRect();

    const dims = {
      width: wdims.width || rootDims.width,
      height: wdims.height || rootDims.height,
    }
    return dims;
  }

  onGrammarChange(grammar, force) {
    taylorUtils.storeGrammar(grammar);
    if (this.state.autocompile || force === true) {
      this.setState({ grammar });
    }
  }

  render() {
    let {
      width,
      height,
      grammar,
    } = this.state;
    const pageStyles = getPageSize(this.state.pageNumber, { width, height });

    return (
      <ScrollView
        horizontal={true}
        pagingEnabled={true}
        scrollEnabled={true}
        scrollEventThrottle={100}
        nestedScrollEnabled={true}
        contentContainerStyle={{width: "100%"}}
        onContentSizeChange={this.onContentSizeChange}
      >
        <GrammarDev
          styles={pageStyles}
          grammar={grammar}
          onGrammarChange={this.onGrammarChange}
        />
        <Button
          small
          light
          style={{ position: 'fixed', top: '0px', left: '0px', backgroundColor: 'white',  opacity: this.state.autocompile ? 0.5 : 0.2 }}
          onClick={() => {
            this.setState({ autocompile: !this.state.autocompile });
            this.onGrammarChange(this.state.grammar, true);
          }}
        >
          <Icon type="FontAwesome" name='refresh' />
        </Button>
        <GraphView styles={pageStyles} grammar={grammar}/>
      </ScrollView>
    );
  }
}

export default App;
