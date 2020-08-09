const editorOpts = {
  selectOnLineNumbers: true,
  minimap: {enabled: false},
  wordWrap: 'on',
  wordWrapColumn: 80,
  fontSize: 18,
  lineNumbersMinChars: 2,
  lineDecorationsWidth: 0,
}

const colors = {
  orage_dark: 'rgb(155, 112, 63)',
  orange_light: 'rgb(205, 168, 105)',
  light: 'rgb(245, 245, 220)',
}

const priceApi = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=';

const GH_REPO = 'https://github.com/loredanacirstea/taylor';

export {
  editorOpts,
  priceApi,
  GH_REPO,
  colors,
}
