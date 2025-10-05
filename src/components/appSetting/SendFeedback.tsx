import React from "react";
import { useTranslation } from "react-i18next";
import { Popover, Button, ButtonGroup } from "@chakra-ui/react";
import { open } from "@tauri-apps/plugin-shell";

const SendFeedback = () => {
  const { t } = useTranslation();
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size="xs">{t("starterFeedback")}</Button>
      </Popover.Trigger>
      <Popover.Content color="white" bg="blue.800" borderColor="blue.800">
        <Popover.Arrow />
        <Popover.CloseTrigger />
        <Popover.Body>{t("chooseFeedbackWay")}</Popover.Body>
        <Popover.Footer border="0">
          <ButtonGroup size="xs">
            <Button
              colorScheme="orange"
              onClick={async () => {
                await open("https://github.com/oguzkaganeren/manj/issues");
              }}
            >
              Github
            </Button>
          </ButtonGroup>
        </Popover.Footer>
      </Popover.Content>
    </Popover.Root>
  );
};

export default SendFeedback;
