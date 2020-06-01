// Initializes the `teams` service on path `/teams`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Teams } from './teams.class';
import createModel from '../../models/teams.model';
import hooks from './teams.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'teams': Teams & ServiceAddons<any>;
  }
}

export default function (app: Application) {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/teams', new Teams(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('teams');

  service.hooks(hooks);
}
