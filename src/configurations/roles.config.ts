/* src/config/roles.config.ts */

const AccessControl = require('accesscontrol');
const ac = new AccessControl();

export const roles = (function () {
  ac.grant('standard')
    .readOwn('profile')
    .updateOwn('profile')
    // product
    .readAny('product')
    .readAny('package')
    .readAny('sale-package');

  ac.grant('administrator')
    .extend('standard')
    .extend('support')
    .extend('assistant')
    // profile
    .createAny('profile')
    .updateAny('profile')
    .deleteAny('profile')
    // product
    .updateAny('product')
    .deleteAny('product');

  return ac;
})();
