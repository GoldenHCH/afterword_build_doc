import { IEnvironment } from './environment.interfaces';

export const environment: IEnvironment = {
  production: false,
  useEmulators: true,
  firebase: {
    projectId: 'afterword-fyi',
    apiKey: '',
    authDomain: '',
    appId: '',
    storageBucket: '',
    messagingSenderId: '',
  },
};
