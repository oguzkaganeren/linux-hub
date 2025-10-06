import {
  useDisclosure,
  IconButton,
  Dialog,
  Portal,
  CloseButton,
} from "@chakra-ui/react";
import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import AboutComponent from "./AboutComponent";
import LanguageComponent from "./LanguageComponent";
import StartLaunch from "./StartLaunch";
import { Settings } from "lucide-react";

const AppSettings: FC = () => {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <Dialog.Root
      open={open}
      size={{ mdDown: "full", md: "sm" }}
      placement={"top"}
      lazyMount
      onOpenChange={(e) => setOpen(e.open)}
    >
      <Dialog.Trigger asChild>
        <IconButton size="xs" aria-label="Menu" variant="outline">
          <Settings />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger />
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
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};
export default AppSettings;
