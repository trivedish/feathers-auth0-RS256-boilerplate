import { Application } from '../declarations';
import users from './users/users.service';
import organizations from './organizations/organizations.service';
import teams from './teams/teams.service';
import roles from './roles/roles.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application) {
  app.configure(users);
  app.configure(organizations);
  app.configure(teams);
  app.configure(roles);
}
