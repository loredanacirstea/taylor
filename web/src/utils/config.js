const editorOpts = {
  selectOnLineNumbers: true,
  minimap: {enabled: false},
  wordWrap: 'on',
  wordWrapColumn: 80,
  fontSize: 18,
  lineNumbersMinChars: 2,
  lineDecorationsWidth: 0,
}

const priceApi = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=';

const GH_REPO = 'https://github.com/loredanacirstea/taylor';

export {
  editorOpts,
  priceApi,
  GH_REPO,
}
