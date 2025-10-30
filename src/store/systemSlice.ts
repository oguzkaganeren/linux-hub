import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { SystemInfo } from '../types';

interface SystemState {
  info: SystemInfo | null;
  status: 'idle' | 'streaming' | 'failed';
  error: string | null;
}

const initialState: SystemState = {
  info: null,
  status: 'idle',
  error: null,
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    updateSystemInfo: (state, action: PayloadAction<SystemInfo>) => {
      state.info = action.payload;
      state.status = 'streaming';
      state.error = null;
    },
    systemInfoError: (state, action: PayloadAction<string>) => {
      state.status = 'failed';
      state.error = action.payload;
    }
  },
});

export const { updateSystemInfo, systemInfoError } = systemSlice.actions;

export const selectSystemInfo = (state: RootState) => state.system.info;
export const selectSystemStatus = (state: RootState) => state.system.status;

export default systemSlice.reducer;
