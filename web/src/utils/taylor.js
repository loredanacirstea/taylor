import TAYLOR_GRAMMAR from 'taylor/taylor/taylor.ne';

const DEFAULT_CODE = '(add (mul 2 1 34 (add 13 56)) 9000)';

const STORAGE_KEY = 'TaylorGrammar';
const STORAGE_KEY_CODE = 'TaylorCode';

const storeGrammar = source => {
  window.localStorage.setItem(STORAGE_KEY, source);
}

const getGrammar = () => {
  let source = window.localStorage.getItem(STORAGE_KEY);
  if (!source) {
    source = TAYLOR_GRAMMAR;
    window.localStorage.setItem(STORAGE_KEY, source);
  }
  return source;
}

const storeCode = source => {
  window.localStorage.setItem(STORAGE_KEY_CODE, source);
}

const getCode = () => {
  let source = window.localStorage.getItem(STORAGE_KEY_CODE);
  if (!source) {
    source = DEFAULT_CODE;
    window.localStorage.setItem(STORAGE_KEY_CODE, source);
  }
  return source;
}

export {
  getGrammar,
  storeGrammar,
  storeCode,
  getCode,
}
