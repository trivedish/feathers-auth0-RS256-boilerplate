import app from '../../src/app';

describe('\'null\' service', () => {
  it('registered the service', () => {
    const service = app.service('null');
    expect(service).toBeTruthy();
  });
});
