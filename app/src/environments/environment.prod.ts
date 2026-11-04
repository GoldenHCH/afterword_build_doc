import { IEnvironment } from './environment.interfaces';

export const environment: IEnvironment = {
  production: true,
  useEmulators: false,
  firebase: {
    projectId: 'afterword-fyi',
    apiKey: '',
    authDomain: '',
    appId: '',
    storageBucket: '',
    messagingSenderId: '',
  },
};
