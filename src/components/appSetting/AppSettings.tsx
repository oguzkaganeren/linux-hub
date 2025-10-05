import {
  useDisclosure,
  IconButton,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import AboutComponent from "./AboutComponent";
import LanguageComponent from "./LanguageComponent";
import StartLaunch from "./StartLaunch";

const AppSettings: FC = () => {
  const { open, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation();
  return (
    <>
      <IconButton size="sm" aria-label="Menu" onClick={onOpen} />
      <Dialog.Root open={open} size="md" onExitComplete={onClose}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Content bg="#edf3f8" _dark={{ bg: "#2D3748" }}>
            <Dialog.Header>{t("appSettings")}</Dialog.Header>
            <Dialog.Body pb={6}>
              <LanguageComponent />
              <StartLaunch />
              <AboutComponent />
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Portal>
      </Dialog.Root>
    </>
  );
};
export default AppSettings;
