import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Theme } from '../types';

const initialState: Theme = {
    mode: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    primaryColor: '#3b82f6',
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleThemeMode: (state) => {
            state.mode = state.mode === 'dark' ? 'light' : 'dark';
        },
        setPrimaryColor: (state, action: PayloadAction<string>) => {
            state.primaryColor = action.payload;
        },
    },
});

export const { toggleThemeMode, setPrimaryColor } = themeSlice.actions;
export default themeSlice.reducer;
