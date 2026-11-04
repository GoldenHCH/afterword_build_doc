import { IEnvironment } from './environment.interfaces';

export const environment: IEnvironment = {
  production: true,
  useEmulators: false,
  firebase: {
    projectId: 'afterword-hackathon',
    apiKey: '',
    authDomain: '',
    appId: '',
    storageBucket: '',
    messagingSenderId: '',
  },
};
