export interface IFirebaseWebConfig {
  projectId: string;
  apiKey: string;
  authDomain: string;
  appId: string;
  storageBucket: string;
  messagingSenderId: string;
}

export interface IEnvironment {
  production: boolean;
  useEmulators: boolean;
  firebase: IFirebaseWebConfig;
}
