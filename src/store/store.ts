import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './themeSlice';
import appReducer from './appSlice';
import packagesReducer from './packagesSlice';
import systemReducer from './systemSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    app: appReducer,
    packages: packagesReducer,
    system: systemReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;