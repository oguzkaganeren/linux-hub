import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Page, UserProfile, BluetoothDevice, PrinterDevice } from '../types';

interface AppState {
    page: Page;
    online: boolean;
    language: string;
    isSettingsModalOpen: boolean;
    isProfileModalOpen: boolean;
    launchOnStart: boolean;
    user: UserProfile;
    bluetoothDevices: BluetoothDevice[];
    printers: PrinterDevice[];
    isLiveMode: boolean;
    isCheckingLiveMode: boolean;
}

const initialState: AppState = {
    page: 'landing',
    online: navigator.onLine,
    language: 'en',
    isSettingsModalOpen: false,
    isProfileModalOpen: false,
    launchOnStart: true,
    user: {
        name: 'User Demo',
        email: 'user@linux.com',
        avatarUrl: '',
    },
    bluetoothDevices: [
        { id: 'bt-1', name: 'Logitech MX Master 3', status: 'Connected' },
        { id: 'bt-2', name: 'Sony WH-1000XM4', status: 'Disconnected' },
    ],
    printers: [
        { id: 'pr-1', name: 'HP LaserJet Pro M404dn', status: 'Ready' },
        { id: 'pr-2', name: 'Epson WorkForce WF-7720', status: 'Offline' },
    ],
    isLiveMode: false,
    isCheckingLiveMode: true,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        navigateTo: (state, action: PayloadAction<Page>) => {
            state.page = action.payload;
        },
        setOnlineStatus: (state, action: PayloadAction<boolean>) => {
            state.online = action.payload;
        },
        setLanguage: (state, action: PayloadAction<string>) => {
            state.language = action.payload;
        },
        openSettingsModal: (state) => {
            state.isSettingsModalOpen = true;
        },
        closeSettingsModal: (state) => {
            state.isSettingsModalOpen = false;
        },
        setLaunchOnStart: (state, action: PayloadAction<boolean>) => {
            state.launchOnStart = action.payload;
        },
        openProfileModal: (state) => {
            state.isProfileModalOpen = true;
        },
        closeProfileModal: (state) => {
            state.isProfileModalOpen = false;
        },
        updateUserProfile: (state, action: PayloadAction<UserProfile>) => {
            state.user = action.payload;
        },
        addBluetoothDevice: (state, action: PayloadAction<BluetoothDevice>) => {
            state.bluetoothDevices.push(action.payload);
        },
        removeBluetoothDevice: (state, action: PayloadAction<string>) => {
            state.bluetoothDevices = state.bluetoothDevices.filter(d => d.id !== action.payload);
        },
        addPrinter: (state, action: PayloadAction<PrinterDevice>) => {
            state.printers.push(action.payload);
        },
        removePrinter: (state, action: PayloadAction<string>) => {
            state.printers = state.printers.filter(d => d.id !== action.payload);
        },
        setLiveMode: (state, action: PayloadAction<boolean>) => {
            state.isLiveMode = action.payload;
            state.isCheckingLiveMode = false;
        },
    },
});

export const { 
    navigateTo, 
    setOnlineStatus, 
    setLanguage, 
    openSettingsModal, 
    closeSettingsModal, 
    setLaunchOnStart,
    openProfileModal,
    closeProfileModal,
    updateUserProfile,
    addBluetoothDevice,
    removeBluetoothDevice,
    addPrinter,
    removePrinter,
    setLiveMode
} = appSlice.actions;

export default appSlice.reducer;