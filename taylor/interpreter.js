function encode(value, size) {
  return value.toString(16).padStart(size*2, '0');
}

const isInt = value => parseInt(value) === value;
const isUint = value => isInt(value) && (value >= 0);
const isFloat = value => parseFloat(value) === value;

const isIntDyn = value => parseInt(value) == value;
const isUintDyn = value => isIntDyn(value) && (value >= 0);
const isFloatDyn = value => parseFloat(value) == value;

function encodeDynamic(value) {
  if (isUint(value)) return '11000004' + encode(value, 4);
  if (isInt(value)) return '12000004' + encode(value, 4);

  if (isUintDyn(value)) return '11000004' + encode(value, 4);
  if (isIntDyn(value)) return '12000004' + encode(value, 4);

  throw new Error('unsupported type');
}

function strip0x(value) {
  if (value.substring(0, 2) === '0x') {
    return value.substring(2);
  }
  return value;
}

function encodeInput (args) {
  args = args.map(encodeDynamic);
  console.log('args', args);
  args = 'ee'
    + encode(args.length, 3)
    + args.map((arg, i) => {
        return encode(
          args.slice(0, i+1).reduce((sum, val) => sum + val.length/2, 0),
          4,
        )
      }).join('')
    + args.join('')
  return args;
}

function buildInputs(steps, tr) {
  const user_inputs = [];
  const hadc_inputs = [];
  const prog_steps = [];

  console.log('steps', steps)
  steps.forEach(step => {
    console.log('step', step)
    const fname = step[0]
    const args = step[1];
    let arglen = args ? args.length : 0;
    console.log('--arglen', arglen)
    const prog_step = {
      typeid: tr[fname] ? tr[fname].sig : '',
      inputIndexes: [],
    }

    const user_inputs_step = [];
    const hardc_inputs_step = [];
    for ( let i = 0; i < arglen; i ++ ) {
      if (typeof args[i] === 'string' && args[i].substring(0, 2) === 'x_' && args[i].length >= 3) {
        user_inputs_step.push(args[i]);
      } else if (!isNaN(args[i])) {
        hardc_inputs_step.push(args[i]);
      }
    }

    console.log('user_inputs_step', user_inputs_step)
    console.log('hardc_inputs_step', hardc_inputs_step)

    for ( let i = 0; i < arglen; i ++ ) {
      console.log('args[i]', args[i]);

      console.log('user_inputs', user_inputs)
      console.log('hadc_inputs', hadc_inputs)

      if (typeof args[i] === 'string' && args[i].substring(0, 2) === 'x_' && args[i].length >= 3) {
        prog_step.inputIndexes.push(user_inputs.length);
        user_inputs.push(args[i]);
      }
      else if (isNaN(args[i])) {
        prog_step.inputIndexes.push(
          user_inputs_step.length + user_inputs.length
          + hardc_inputs_step.length + hadc_inputs.length
        );
      } else {
        prog_step.inputIndexes.push(
          Math.max(user_inputs_step.length, user_inputs.length)
          + hadc_inputs.length
        );
        hadc_inputs.push(args[i]);

      }
      console.log('999999999', JSON.stringify(hadc_inputs), JSON.stringify(user_inputs))
    };

    if (tr[fname]) {
      prog_steps.push(prog_step);
    }
  });

  return {user_inputs, hadc_inputs, prog_steps};
}

const prependLength = data => encode(data.length / 2, 4) + data

function buildSteps(prog_steps) {
  let steps = '';
  prog_steps.forEach(step => {
    steps += step.typeid;
    steps += encode(step.inputIndexes.length, 4)
    step.inputIndexes.forEach(ind => {
      steps += encode(ind, 1)
    });
  })
  return prependLength(steps);
}

function buildType(name, signature, {user_inputs, hadc_inputs, prog_steps}) {
  let hcinputs = encodeInput(hadc_inputs);
  hcinputs = prependLength(hcinputs);

  let dtype = strip0x(signature) + encode(prog_steps.length, 1);
  dtype = prependLength(dtype);

  let steps = buildSteps(prog_steps);

  return { dtype, steps, hcinputs, encoded: dtype + hcinputs + steps }
}


module.exports = {
  encode,
  encodeDynamic,
  encodeInput,
  buildInputs,
  buildSteps,
  buildType,
  strip0x,
}
