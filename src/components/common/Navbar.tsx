import {
  Flex,
  Stack,
  IconButton,
  ButtonGroup,
  Spacer,
} from '@chakra-ui/react';
import React from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { invoke } from '@tauri-apps/api/core';
import { SquareX,ArrowDownFromLine,AppWindow } from 'lucide-react';
//import AppSettings from './appSetting/AppSettings';
import Theme from './Theme';
const appWindow = getCurrentWebviewWindow()

const Navbar: React.FC = () => (
  <Flex
    as="header"
    pos="fixed"
    top="0"
    w="full"
    boxShadow="sm"
    zIndex={998}
    bg="#edf3f8"
    _dark={{ bg: '#1A202C' }}
  >
    <div data-tauri-drag-region="" className="titlebar" />
    <Spacer />
  
    <Flex
      justify="flex-end"
      h={16}
      mr={5}
      alignItems="center"
      justifyContent="space-between"
    >
      <Stack direction="row" spacing={2}>
        <Theme />
        {/* <AppSettings /> */}
        <ButtonGroup>
          <IconButton
            aria-label="Minimize"
            onClick={() => {
              appWindow.minimize();
            }}
            size="sm"
          ><ArrowDownFromLine /></IconButton>
          <IconButton
            aria-label="Window"
            onClick={() => {
              appWindow.toggleMaximize();
            }}
            size="sm"
          ><AppWindow /></IconButton>
          <IconButton
            aria-label="Close"
            onClick={() => {
              appWindow.close();
            }}
            size="sm"
          ><SquareX /></IconButton>
        </ButtonGroup>
      </Stack>
    </Flex>
  </Flex>
);
export default Navbar;
