import formData from 'express-form-data';
import os from 'os';

const options = {
  uploadDir: os.tmpdir(),
  autoClean: true,
};

export const formDataHandler = formData.parse(options);
