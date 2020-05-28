// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

import errors from '@feathersjs/errors';
import jwt from 'jsonwebtoken';
import { Hook, HookContext } from '@feathersjs/feathers';
import rp from 'request-promise';
import jwkToPem from 'jwk-to-pem';
import _ from 'lodash';
import logger from '../logger';

export default (options = {}): Hook => {
  return async (context: HookContext) => {
    // Should only be used in before hook
    if (context.type !== 'before') {
      throw new errors.NotAuthenticated('The authorize() hook can only be used as before hook', context);
    }

    // Get and process authorization token
    const authorization_header = (context.params.headers || {}).authorization || null;
    if (!authorization_header) {
      throw new errors.NotAuthenticated('Authorization header not set', context);
    }

    let token = authorization_header;
    if (authorization_header.startsWith('Bearer ')) {
      token = authorization_header.split('Bearer ')[1];
    }

    const currentToken = jwt.decode(token, { complete: true });

    if (!currentToken) {
      throw new errors.NotAuthenticated('Missing or malformed token');
    }

    // get the client ID from the token payload
    const client_id = (currentToken as any).payload.sub.split('@')[0];

    // Check if the client id represents an application in Auth0
    // Auth0 sends back client id as `id@clients`, the value after
    // @ symbol if clients means it is client id for an application
    // if any other value but `clients`, throw error
    if ((currentToken as any).payload.sub.split('@')[1] !== 'clients') {
      throw new errors.NotAuthenticated('Invalid client id.', client_id);
    }

    // Get authentication config
    const authentication = context.app.get('authentication');
    const kid = (currentToken as any).header.kid;
    const jwks_client = getJWKS(authentication.jwksUri);

    // get the signing key from the JWKS endpoint at Auth0
    const key = await getKey(kid, context.app.service('keys'), jwks_client);

    // verify JWT, using options "jwtOptions" set in config file.
    try {
      jwt.verify(token, key, authentication.jwtOptions);
    } catch (err) {
      throw new errors.NotAuthenticated('Token could not be verified.', err.message);
    }

    return context;
  };
};

const getJWKS = (uri: any) => () => rp({ uri, json: true });

async function getKey (kid: any, svc: any, jwksClient: any) {
  try {
    // get the signing key from the in-memory service, if it exists
    const storedKey = await svc.find({ query: { kid } })
      .then((keys: { data: any[]; }) => {
        return keys.data[0];
      });

    // if the storedKey exists, return it
    if (storedKey) {
      return jwkToPem(storedKey);
    }
  } catch (err) {
    // do nothing...
  }

  // otherwise, we need to get it from our JWKS endpoint
  let jwk;
  try {
    const jwks = await jwksClient();
    jwk = _.find(jwks.keys, { kid: kid });
  } catch (err) {
    // throw an error if for some reason cannot fetch keys
    throw new errors.GeneralError('Could not retrieve JWKS', err);
  }

  // throw an error if there were no JWKs that contained our kid
  if (!jwk) throw new errors.GeneralError('Could not find a JWK matching given kid');

  // get the signing key from the retrieved JWK
  const key = jwkToPem(jwk);

  // store the jwk in our in-memory service
  try { svc.create(jwk); } catch (e) { /* no problem if this fails */ }

  // and return the key
  return key;
}
