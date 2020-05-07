import nearley from 'nearley';
import Taylor from './taylor.js';

const compile = source => {
  const parser = new nearley.Parser(Taylor);
  return parser.feed(source);
}

export default {
  nearley,
  Taylor,
  compile,
}
