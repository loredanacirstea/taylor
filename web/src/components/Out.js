import React from 'react';
import { ScrollView } from 'react-native';
import { Text } from 'native-base';
import ReactJson from 'custom-react-json-view'
import { editorOpts } from '../utils/config.js';

function Out(props) {
    const {styles, result, errors} = props;
    const fontSize = editorOpts.fontSize;

    return (
    <ScrollView
        horizontal={false}
        scrollEnabled={true}
        scrollEventThrottle={100}
        nestedScrollEnabled={true}
        contentContainerStyle={{width: styles.width}}
        style={{ ...styles, flex: 1 }}
    >
        <ScrollView
        horizontal={true}
        scrollEnabled={true}
        scrollEventThrottle={100}
        contentContainerStyle={{width: styles.width}}
        style={{ ...styles, flex: 1 }}
        >
        {errors
            ? <Text style={{color: 'firebrick', fontSize }}>{errors}</Text>
            : <ReactJson
            src={result}
            name="result"
            theme="twilight"
            collapsed={6}
            shouldCollapse={field => field.name === 'd' }
            style={{ fontSize }}
            />
        }
        </ScrollView>
    </ScrollView>
    );
}

export default Out;
