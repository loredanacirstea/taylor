const theader = {
  uint: '11',
  int: '12',
  byte: '22',
  array: '44',
  narray: '45',
  tuple: 'ee',
}

const sizedt = base => (size = 0) => base + size.toString(16).padStart(6, '0');
const uint = (size = 0) => sizedt(theader.uint)(size);
const int = (size = 0) => sizedt(theader.int)(size);
const bytes = (size = 0) => sizedt(theader.byte)(size);
const array = (size = 0) => sizedt(theader.array)(size);
const narray = (size = 0) => sizedt(theader.narray)(size);
const tuple = (size = 0) => sizedt(theader.tuple)(size);
const base = {sizedt, uint, int, bytes, array, narray, tuple};

const typed = type => size => hexvalue => base[type](size) + hexvalue;



const defs_new = {
  uint: `0xfffffffe0000000511000000030000000dee0000010000000522000001110000001d3333333800000000333333350000000200023333333000000003010003`,
}



module.exports = {
  base,
  defs_new,
}
