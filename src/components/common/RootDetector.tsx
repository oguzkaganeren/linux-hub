import {
  Text,
  Button,
  useDisclosure,
  Dialog,
} from '@chakra-ui/react';
import { Command } from '@tauri-apps/plugin-shell';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { info, error } from '@tauri-apps/plugin-log';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import commands from '../../assets/Commands';

const appWindow = getCurrentWebviewWindow();

const RootDetector = () => {
  const { t } = useTranslation();
  const { isOpen, onOpen } = useDisclosure();
  const closeHandle = () => {
    appWindow.close();
  };
  useEffect(() => {
    const detectWho = async () => {
      const cmd = Command.create(commands.getWhoami.program);
      cmd.stdout.on('data', (line) => {
        info(`whoami stdout: "${line}"`);
        if (line === 'root') {
          onOpen();
        }
      });
      cmd.on('error', (errors) => {
        error(errors);
      });
      await cmd.spawn();
    };
    detectWho();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Dialog.Root onExitComplete={closeHandle}>
      
      <Dialog.Content>
        <Dialog.Header><Dialog.Title>{t('rootUserDetected')}</Dialog.Title ></Dialog.Header>
        
        <Dialog.Body>
          <Text>{t('rootUserDesc')}</Text>
        </Dialog.Body>
        <Dialog.Footer>
          <Button onClick={closeHandle}>{t('close')}</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default RootDetector;
