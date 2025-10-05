import React from 'react';
import {
  Dialog,
  IconButton,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SquareX } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
const appWindow = getCurrentWindow()

const CloseAppComponent = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation();
  return (
    <>
      <IconButton
        aria-label="Close"
        onClick={onOpen}
        size="sm"
      ><SquareX /></IconButton>
      <Dialog.Root
        motionPreset="slide-in-bottom"
      >
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              {t('exitApplication')}
            </Dialog.Title>
            </Dialog.Header>
          <Dialog.CloseTrigger />
          <Dialog.Body>
            {t('appCloseDesc')}
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              onClick={() => {
                appWindow.close();
              }}
              colorScheme="red"
              size="sm"
            >
              {t('exitApplication')}
            </Button>
            <Button
              colorScheme="yellow"
              onClick={async () => {
                appWindow.toggleMaximize()
              }}
              size="sm"
              ml={3}
            >
              {t('hideAsTrayIcon')}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default CloseAppComponent;
