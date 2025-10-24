import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import BlurredCard from '../../components/BlurredCard';
import Panel from '../../components/configuration/Panel';
import AppIcon from '../../components/icons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addBluetoothDevice, removeBluetoothDevice, addPrinter, removePrinter } from '../../store/appSlice';
import { translations } from '../../data/translations';
import { BluetoothDevice, PrinterDevice } from '../../types';

const DevicesPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const { language, bluetoothDevices, printers } = useAppSelector(state => state.app);
    const t = useCallback((key: string): string => {
        return translations[language]?.[key] || translations['en']?.[key] || key;
    }, [language]);

    const handleAddDevice = (type: 'bluetooth' | 'printer') => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 2000)),
            {
                loading: t('toast_searching_devices'),
                success: () => {
                    if (type === 'bluetooth') {
                        const newDevice: BluetoothDevice = { id: `bt-${Date.now()}`, name: 'New Bluetooth Keyboard', status: 'Connected' };
                        dispatch(addBluetoothDevice(newDevice));
                    } else {
                        const newPrinter: PrinterDevice = { id: `pr-${Date.now()}`, name: 'Canon PIXMA TS6420a', status: 'Ready' };
                        dispatch(addPrinter(newPrinter));
                    }
                    return t('toast_device_added');
                },
                error: 'Failed to add device',
            }
        );
    };
    
    const handleRemoveDevice = (id: string, type: 'bluetooth' | 'printer') => {
        if (type === 'bluetooth') {
            dispatch(removeBluetoothDevice(id));
        } else {
            dispatch(removePrinter(id));
        }
        toast.success(t('toast_device_removed'));
    };

    const getStatusChip = (status: string) => {
        const s = status.toLowerCase();
        let colorClasses = 'bg-gray-200 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300';
        if (s.includes('connected') || s.includes('ready')) {
            colorClasses = 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300';
        } else if (s.includes('offline') || s.includes('disconnected')) {
            colorClasses = 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300';
        } else if (s.includes('printing')) {
             colorClasses = 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
        }
        return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorClasses}`}>{status}</span>;
    };

    return (
        <Panel title={t('device_management')}>
            {/* Bluetooth Devices */}
            <BlurredCard className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t('bluetooth_devices')}</h2>
                    <button onClick={() => handleAddDevice('bluetooth')} className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:brightness-90 transition-all">
                        <Plus size={16} /> {t('add_bluetooth_device')}
                    </button>
                </div>
                <div className="space-y-2">
                    {bluetoothDevices.map(device => (
                        <div key={device.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50">
                            <div className="flex items-center gap-3">
                                <AppIcon name="bluetooth" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                <p className="font-medium">{device.name}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                {getStatusChip(device.status)}
                                <button onClick={() => handleRemoveDevice(device.id, 'bluetooth')} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </BlurredCard>

            {/* Printers */}
            <BlurredCard className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t('printers')}</h2>
                    <button onClick={() => handleAddDevice('printer')} className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary-color)] text-white font-semibold rounded-lg hover:brightness-90 transition-all">
                        <Plus size={16} /> {t('add_printer')}
                    </button>
                </div>
                <div className="space-y-2">
                    {printers.map(printer => (
                        <div key={printer.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50">
                            <div className="flex items-center gap-3">
                                <AppIcon name="printer" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                <p className="font-medium">{printer.name}</p>
                            </div>
                             <div className="flex items-center gap-4">
                                {getStatusChip(printer.status)}
                                <button onClick={() => handleRemoveDevice(printer.id, 'printer')} className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-500/20 hover:text-red-500 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </BlurredCard>
        </Panel>
    );
};

export default DevicesPanel;