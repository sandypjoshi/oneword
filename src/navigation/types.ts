/**
 * Navigation types for the app
 */

export type TabParamList = {
  index: undefined;
  practice: undefined;
  profile: undefined;
};

export type RootStackParamList = {
  '(tabs)': undefined;
  modal: undefined;
  onboarding: undefined;
  'auth/login': undefined;
  'auth/signup': undefined;
};

export type AppParamList = TabParamList & RootStackParamList; 