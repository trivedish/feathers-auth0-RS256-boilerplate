import app from '../../src/app';

describe('\'organizations\' service', () => {
  it('registered the service', () => {
    const service = app.service('organizations');
    expect(service).toBeTruthy();
  });
});
