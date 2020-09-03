describe('API', () => {
  it('returns a css string with fonts in @font-face transformed');

  it('returns the original css string if no @font-face is present');

  it('returns the original css string if @font-face elements do not contain fonts');

  it('errors if it cannot fetch a defined font');
});
