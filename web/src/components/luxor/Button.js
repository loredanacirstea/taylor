import React from 'react';
import { Arrow, Path } from 'react-konva';

const arroww = 20
const topd = 5;
const Button = (props) => {
    const pathw = props.height;
    const x = props.x + props.width/2 - pathw/2;
    const y = props.y;
    const onSend = () => props.onSend(props);
    const data = props.path.map(l => {
        l[1] *= pathw;
        l[2] *= pathw;
        return l.join(',')
    }).join('');
    
    return (
        <Path 
            data={data}
            x={x}
            y={y}
            fill='rgb(155, 112, 63)'
            onClick={onSend}
        />
    )
}

const right = (props) => {
    props.path = [
        ['M',0.8357,0.50045],
        ['L',0.36563,0.9705199999999999],
        ['L',0.16521000000000002,0.7700899999999999],
        ['L',0.43485,0.50045],
        ['L',0.16431,0.22990999999999995],
        ['L',0.36473,0.02947999999999995],
        ['L',0.8357,0.50045],
        ['Z'],
    ]
    return Button(props);
}

const plus = (props) => {
    props.path = [
        ['M',0.38981,0.09099],
        ['L',0.61119,0.09099],
        ['L',0.61119,0.3898],
        ['L',0.90901,0.3898],
        ['L',0.90901,0.61118],
        ['L',0.61119,0.61118],
        ['L',0.61119,0.909],
        ['L',0.38981,0.909],
        ['L',0.38981,0.61118],
        ['L',0.091,0.61118],
        ['L',0.091,0.3898],
        ['L',0.38981,0.3898],
        ['L',0.38981,0.091],
        ['Z']
    ]
    return Button(props);
}

const close = (props) => {
    props.path = [
        ['M',0.71129765,0.13252016],
        ['L',0.86783695,0.28905946],
        ['L',0.65654637,0.50035004],
        ['L',0.86713691,0.71094058],
        ['L',0.71059761,0.86747988],
        ['L',0.50000707,0.65688933],
        ['L',0.28941653,0.86747988],
        ['L',0.13287723,0.71094058],
        ['L',0.34346777,0.50035004],
        ['L',0.13217719,0.28905946],
        ['L',0.28871649,0.13252016],
        ['L',0.50000707,0.34381074],
        ['Z'],
    ]
    return Button(props)
}

const left = (props) => {
    props.path = [
        ['M',0.16009,0.50045],
        ['L',0.63607,0.9764299999999999],
        ['L',0.83901,0.77348],
        ['L',0.56598,0.50045],
        ['L',0.83991,0.22651999999999994],
        ['L',0.63697,0.023569999999999952],
        ['L',0.16009,0.50045],
        ['Z'],
    ]
    return Button(props)
}

const execute = (props) => {
    props.path = [
        ['M',0.13533078,0.92108375],
        ['L',0.13533078,0.07891625000000002],
        ['L',0.86466923,0.5],
        ['Z'],
    ]
    return Button(props);
}

export default {execute, right, left, plus, close};
