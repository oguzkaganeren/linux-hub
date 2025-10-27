// FIX: Update the packages slice to handle installation errors. This includes
// a new `failInstall` action to set a package's state to `Error` with a
// message, and modifies the `install` action to allow retrying failed
// installations.
import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { AllPackagesState, PackageStatus, Kernel, App } from '../types';
import { packageData } from '../data/packages';
// FIX: Use 'import type' to prevent circular dependency issues with the store.
import type { RootState } from './store';

interface PackagesState {
  packagesState: AllPackagesState;
}

const allApps = packageData.flatMap(cat => cat.apps);
const allKernels: Omit<Kernel, 'running'>[] = [
    { version: '6.5.3-1', releaseType: 'stable', pkg: 'linux65' },
    { version: '6.4.16-2', releaseType: 'recommended', pkg: 'linux64' },
    { version: '6.1.55-1', releaseType: 'lts', pkg: 'linux61' },
    { version: '5.15.131-1', releaseType: 'lts', pkg: 'linux515' },
];

const allInstallables: { pkg: string; name: string }[] = [
    ...allApps.map(app => ({ pkg: app.pkg, name: app.name })),
    ...allKernels.map(k => ({ pkg: k.pkg, name: `Linux ${k.version}` }))
];


const initialPackagesState: AllPackagesState = [...allApps, ...allKernels.map(k=>({pkg: k.pkg}))].reduce((acc, app) => {
    const status = app.pkg === 'linux65' ? PackageStatus.Installed : PackageStatus.NotInstalled;
    acc[app.pkg] = { status, progress: 0 };
    return acc;
}, {} as AllPackagesState);

const initialState: PackagesState = {
  packagesState: initialPackagesState,
};

const packagesSlice = createSlice({
    name: 'packages',
    initialState,
    reducers: {
        install: (state, action: PayloadAction<string>) => {
            const pkg = action.payload;
            const currentState = state.packagesState[pkg];
            if (currentState?.status === PackageStatus.NotInstalled || 
                currentState?.status === PackageStatus.UpdateAvailable ||
                currentState?.status === PackageStatus.Error) {
                state.packagesState[pkg] = { status: PackageStatus.Installing, progress: 0 };
            }
        },
        setProgress: (state, action: PayloadAction<{ pkg: string; progress: number }>) => {
            const { pkg, progress } = action.payload;
            if (state.packagesState[pkg]?.status === PackageStatus.Installing) {
                state.packagesState[pkg].progress = progress;
            }
        },
        finishInstall: (state, action: PayloadAction<string>) => {
            const pkg = action.payload;
            state.packagesState[pkg] = { status: PackageStatus.Installed, progress: 100 };
        },
        failInstall: (state, action: PayloadAction<{ pkg: string; error: string }>) => {
            const { pkg, error } = action.payload;
            state.packagesState[pkg] = { status: PackageStatus.Error, error: error };
        },
        removeFromQueue: (state, action: PayloadAction<string>) => {
            const pkg = action.payload;
            const currentStatus = state.packagesState[pkg]?.status;
            if (currentStatus === PackageStatus.Installing || currentStatus === PackageStatus.Error) {
                state.packagesState[pkg] = { status: PackageStatus.NotInstalled, progress: 0 };
            }
        },
        remove: (state, action: PayloadAction<string>) => {
            const pkg = action.payload;
             if (state.packagesState[pkg]?.status === PackageStatus.Installed) {
                state.packagesState[pkg] = { status: PackageStatus.NotInstalled, progress: 0 };
             }
        },
    },
});

export const { install, setProgress, finishInstall, failInstall, removeFromQueue, remove } = packagesSlice.actions;

// Selectors
// FIX: Add explicit return type to the input selector to ensure correct type inference downstream.
const selectPkgState = (state: RootState): AllPackagesState => state.packages.packagesState;

export const selectInstallQueue = createSelector(
  [selectPkgState],
  // FIX: Explicitly type packagesState and the return type to prevent it from being inferred as 'unknown'.
  (packagesState: AllPackagesState): App[] => {
    return allApps.filter(app => {
        const status = packagesState[app.pkg]?.status;
        return status === PackageStatus.Installing || status === PackageStatus.Error;
    });
  }
);

export const selectIsInstalling = createSelector(
  [selectPkgState],
  // FIX: Explicitly type packagesState and the return type to prevent it from being inferred as 'unknown'.
  (packagesState: AllPackagesState): boolean => 
    Object.values(packagesState).some(p => p.status === PackageStatus.Installing)
);

export const selectInstallingPackages = createSelector(
  [selectPkgState],
  (packagesState: AllPackagesState): { pkg: string, name: string }[] => {
    const installingPkgs = Object.entries(packagesState)
      .filter(([_, state]) => state.status === PackageStatus.Installing)
      .map(([pkg]) => pkg);
    
    return allInstallables.filter(item => installingPkgs.includes(item.pkg));
  }
);


export default packagesSlice.reducer;