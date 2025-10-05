import {
  Switch,
  HStack,
  Spacer,
  Fieldset,
  SwitchCheckedChangeDetails,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { resolveResource, configDir } from "@tauri-apps/api/path";
import { copyFile, remove, exists } from "@tauri-apps/plugin-fs";
import { info } from "@tauri-apps/plugin-log";

const StartLaunch = (): JSX.Element => {
  const { t } = useTranslation();
  const [launch, setLaunch] = useState(false);
  const handleLaunchChange = async (event: SwitchCheckedChangeDetails) => {
    setLaunch(event.checked);
    const configDirPath = await configDir();
    if (event.checked) {
      const resourcePath = await resolveResource("resources/manj.desktop");
      info(`${resourcePath} copy to ${configDirPath}autostart/manj.desktop`);
      copyFile(resourcePath, `${configDirPath}autostart/manj.desktop`);
    } else {
      info(`${configDirPath}autostart/manj.desktop removed if it exists`);
      remove(`${configDirPath}autostart/manj.desktop`);
    }
  };

  useEffect(() => {
    const getLocalData = async () => {
      const configDirPath = await configDir();
      if (
        (await exists(
          `${configDirPath}autostart/manj.desktop`
        )) as unknown as boolean
      ) {
        setLaunch(true);
      }
    };
    getLocalData();
  }, []);
  return (
    <Fieldset.Root
      py={4}
      px={8}
      mt={4}
      bg="white"
      _dark={{
        bg: "gray.800",
      }}
      shadow="lg"
      rounded="lg"
    >
      <HStack>
        <Spacer />

        <Switch.Root
          checked={launch}
          onCheckedChange={handleLaunchChange}
          id="launch-start"
        >
          <Switch.HiddenInput />
          <Switch.Control />
          <Switch.Label>{t("launchStart")}</Switch.Label>
        </Switch.Root>
      </HStack>
    </Fieldset.Root>
  );
};

export default StartLaunch;
