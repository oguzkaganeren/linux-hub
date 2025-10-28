

import { createSlice, PayloadAction, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import { invoke } from '@tauri-apps/api/core';
import { AllPackagesState, PackageStatus, Kernel, App } from '../types';
import { packageData } from '../data/packages';
import type { RootState } from './store';
import toast from 'react-hot-toast';

interface PackagesState {
  packagesState: AllPackagesState;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
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
  status: 'idle',
  error: null,
};

// --- ASYNC THUNKS ---

export const checkAllPackageStates = createAsyncThunk(
    'packages/checkAllStates',
    async (_, { rejectWithValue }) => {
        try {
            const statusPromises = allInstallables.map(async (installable) => {
                try {
                    const resultJson = await invoke('check_package_status', {
                        packageName: installable.pkg,
                    });
                    const status = JSON.parse(resultJson as string);
                    return { pkg: installable.pkg, ...status };
                } catch (e) {
                    console.error(`Failed to check status for ${installable.pkg}:`, e);
                    // Return a default "NotInstalled" state for this package on error
                    return { pkg: installable.pkg, installed: false, available_update: false, error: true };
                }
            });

            const results = await Promise.all(statusPromises);

            const newPackagesState: AllPackagesState = {};
            results.forEach(status => {
                let pkgStatus: PackageStatus;
                if (!status.installed) {
                    pkgStatus = PackageStatus.NotInstalled;
                } else if (status.available_update) {
                    pkgStatus = PackageStatus.UpdateAvailable;
                } else {
                    pkgStatus = PackageStatus.Installed;
                }
                newPackagesState[status.pkg] = { status: pkgStatus, progress: 0 };
            });

            return newPackagesState;
        } catch (e: any) {
            console.error("Failed to check all package states:", e);
            return rejectWithValue(e.toString());
        }
    }
);

export const install = createAsyncThunk(
    'packages/install',
    async (pkg: string, { rejectWithValue }) => {
        try {
            const resultJson = await invoke('manage_pacman_package', {
                operation: 'install',
                packageName: pkg,
            });
            const result = JSON.parse(resultJson as string);
            if (result.success) {
                const installable = allInstallables.find(i => i.pkg === pkg);
                const name = installable ? installable.name : pkg;
                toast.success(`${name} installed successfully!`);
                return { pkg };
            }
            return rejectWithValue({ pkg, error: result.error || `Failed to install ${pkg}` });
        } catch (e: any) {
            return rejectWithValue({ pkg, error: e.toString() });
        }
    }
);

export const remove = createAsyncThunk(
    'packages/remove',
    async (pkg: string, { rejectWithValue }) => {
        try {
            const resultJson = await invoke('manage_pacman_package', {
                operation: 'remove',
                packageName: pkg,
            });
            const result = JSON.parse(resultJson as string);
            if (result.success) {
                const installable = allInstallables.find(i => i.pkg === pkg);
                const name = installable ? installable.name : pkg;
                toast.success(`${name} removed successfully!`);
                return { pkg };
            }
            return rejectWithValue({ pkg, error: result.error || `Failed to remove ${pkg}` });
        } catch (e: any) {
            return rejectWithValue({ pkg, error: e.toString() });
        }
    }
);

export const cancelInstallation = createAsyncThunk(
    'packages/cancelInstallation',
    async (pkg: string, { rejectWithValue }) => {
        try {
            await invoke('manage_pacman_package', {
                operation: 'cancel',
                packageName: pkg,
            });
            return { pkg };
        } catch (e: any) {
            console.error(`Failed to cancel installation for ${pkg}:`, e);
            return rejectWithValue({ pkg, error: e.toString() });
        }
    }
);

const packagesSlice = createSlice({
    name: 'packages',
    initialState,
    reducers: {
        setProgress: (state, action: PayloadAction<{ pkg: string; progress?: number, detail?: string }>) => {
            const { pkg, progress, detail } = action.payload;
            const pkgState = state.packagesState[pkg];
            if (pkgState?.status === PackageStatus.Installing) {
                if (typeof progress === 'number') {
                    pkgState.progress = progress;
                }
                if (detail) {
                    pkgState.progressDetail = detail;
                }
            }
        },
        removeFromQueue: (state, action: PayloadAction<string>) => {
            const pkg = action.payload;
            const currentStatus = state.packagesState[pkg]?.status;
            if (currentStatus === PackageStatus.Error) {
                state.packagesState[pkg] = { status: PackageStatus.NotInstalled, progress: 0 };
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Check All States lifecycle
            .addCase(checkAllPackageStates.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(checkAllPackageStates.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.packagesState = action.payload;
            })
            .addCase(checkAllPackageStates.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
                toast.error("Could not sync package statuses with system.");
            })
            // Install lifecycle
            .addCase(install.pending, (state, action) => {
                const pkg = action.meta.arg;
                state.packagesState[pkg] = { status: PackageStatus.Installing, progress: 0, progressDetail: 'Preparing...' };
            })
            .addCase(install.fulfilled, (state, action) => {
                const { pkg } = action.payload;
                state.packagesState[pkg] = { status: PackageStatus.Installed, progress: 100 };
            })
            .addCase(install.rejected, (state, action) => {
                const { pkg, error } = action.payload as { pkg: string; error: string };
                const installable = allInstallables.find(i => i.pkg === pkg);
                const name = installable ? installable.name : pkg;
                toast.error(`Failed to install ${name}.`);
                state.packagesState[pkg] = { status: PackageStatus.Error, error: error || 'Installation failed' };
            })
            // Remove lifecycle
            .addCase(remove.pending, (state, action) => {
                const pkg = action.meta.arg;
                // Use 'Installing' as a generic "working..." state for removal
                state.packagesState[pkg] = { status: PackageStatus.Installing, progress: 0, progressDetail: 'Preparing removal...' };
            })
            .addCase(remove.fulfilled, (state, action) => {
                const { pkg } = action.payload;
                state.packagesState[pkg] = { status: PackageStatus.NotInstalled, progress: 0 };
            })
            .addCase(remove.rejected, (state, action) => {
                const { pkg, error } = action.payload as { pkg: string; error: string };
                const installable = allInstallables.find(i => i.pkg === pkg);
                const name = installable ? installable.name : pkg;
                toast.error(`Failed to remove ${name}: ${error}`);
                // On failure, revert to 'Installed' since it's still there.
                state.packagesState[pkg] = { status: PackageStatus.Installed, error: `Removal failed: ${error}` };
            })
            // Cancel lifecycle
            .addCase(cancelInstallation.fulfilled, (state, action) => {
                const { pkg } = action.payload;
                state.packagesState[pkg] = { status: PackageStatus.NotInstalled, progress: 0 };
            })
            .addCase(cancelInstallation.rejected, (state, action) => {
                const { pkg, error } = action.payload as { pkg: string, error: string };
                toast.error(`Failed to cancel task for ${pkg}: ${error}`);
                // If cancellation fails, the task is likely still running. Keep it in 'Installing' state.
                if(state.packagesState[pkg]) {
                    state.packagesState[pkg].status = PackageStatus.Installing;
                }
            });
    }
});

export const { setProgress, removeFromQueue } = packagesSlice.actions;

// Selectors
const selectPkgState = (state: RootState): AllPackagesState => state.packages.packagesState;

export const selectInstallQueue = createSelector(
  [selectPkgState],
  (packagesState: AllPackagesState): App[] => {
    return allApps.filter(app => {
        const status = packagesState[app.pkg]?.status;
        return status === PackageStatus.Installing || status === PackageStatus.Error;
    });
  }
);

export const selectIsInstalling = createSelector(
  [selectPkgState],
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