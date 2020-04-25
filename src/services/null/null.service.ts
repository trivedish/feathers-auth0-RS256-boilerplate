// Initializes the `null` service on path `/null`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Null } from './null.class';
import createModel from '../../models/null.model';
import hooks from './null.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'null': Null & ServiceAddons<any>;
  }
}

export default function (app: Application) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/null', new Null(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('null');

  service.hooks(hooks);
}
