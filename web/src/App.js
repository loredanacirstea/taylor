import React, { Component } from 'react';
import { Dimensions, StyleSheet, ScrollView } from 'react-native';
import './App.css';
import GrammarDev from './components/GrammarDev.js';
import GraphView from './components/GraphView.js';

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
    }

    this.onContentSizeChange = this.onContentSizeChange.bind(this);
    this.getWindowDimensions = this.getWindowDimensions.bind(this);
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

  render() {
    let {
      width,
      height,
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
        <GrammarDev styles={pageStyles} />
        <GraphView styles={pageStyles} />
      </ScrollView>
    );
  }
}

export default App;
