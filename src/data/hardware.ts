export interface Driver {
    name: string;
    openSource: boolean;
    installed: boolean;
    icon: 'intel' | 'nvidia' | 'video-linux';
}

export interface Device {
    name: string;
    drivers: Driver[];
}

export interface HardwareCategory {
    name: string;
    devices: Device[];
}

export const hardwareData: HardwareCategory[] = [
  {
    name: 'display_controller',
    devices: [
      {
        name: 'GM107M [GeForce GTX 960M] (Nvidia Corporation)',
        drivers: [
          { name: 'video-hybrid-intel-nvidia-prime', openSource: false, installed: true, icon: 'intel' },
          { name: 'video-hybrid-intel-nvidia-470xx-prime', openSource: false, installed: false, icon: 'intel' },
          { name: 'video-hybrid-intel-nvidia-390xx-bumblebee', openSource: false, installed: false, icon: 'intel' },
          { name: 'video-nvidia', openSource: false, installed: false, icon: 'nvidia' },
          { name: 'video-nvidia-575xx', openSource: false, installed: false, icon: 'nvidia' },
          { name: 'video-nvidia-570xx', openSource: false, installed: false, icon: 'nvidia' },
          { name: 'video-nvidia-470xx', openSource: false, installed: false, icon: 'nvidia' },
          { name: 'video-nvidia-390xx', openSource: false, installed: false, icon: 'nvidia' },
          { name: 'video-linux', openSource: true, installed: true, icon: 'video-linux' },
        ],
      },
      {
        name: 'HD Graphics 530 (Intel Corporation)',
        drivers: [
           { name: 'video-hybrid-intel-nvidia-prime', openSource: false, installed: true, icon: 'intel' },
           { name: 'video-hybrid-intel-nvidia-470xx-prime', openSource: false, installed: false, icon: 'intel' },
           { name: 'video-hybrid-intel-nvidia-390xx-bumblebee', openSource: false, installed: false, icon: 'intel' },
        ]
      }
    ]
  }
];