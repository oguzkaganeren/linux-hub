import React from "react";
import {
  Button,
  Popover,
  ButtonGroup,
  useDisclosure,
  Code,
  VStack,
  Spacer,
  Portal,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

type Props = {
  isButtonDisabled: boolean;
  confirmationDesc: string;
  handleClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  commands?: Array<string>;
  portalEnabled?: boolean;
};

const ConfirmPopComponent = ({
  isButtonDisabled,
  confirmationDesc,
  handleClick,
  children,
  commands,
  portalEnabled,
}: Props) => {
  const { onOpen, onClose, open } = useDisclosure();
  const { t } = useTranslation();
  const popContent = (
    <Popover.Content
      fontSize={["xs", "xs", "md", "md"]}
      color="white"
      bg="blue.800"
      borderColor="blue.800"
    >
      <Popover.Header pt={4} fontWeight="bold" border="0">
        {t("confirmation")}
      </Popover.Header>
      <Popover.Arrow>
        <Popover.ArrowTip />
      </Popover.Arrow>

      <Popover.Body>
        {t(confirmationDesc)}
        <Spacer />
        {t("belowCommandsRun")}
        <VStack alignItems="flex-start" mt={1} mx={0}>
          {commands &&
            commands.map((cmd) => (
              <Code fontSize={["xs", "xs", "md", "md"]} maxW={300}>
                {cmd}
              </Code>
            ))}
        </VStack>
      </Popover.Body>
      <Popover.Footer
        display="flex"
        border="0"
        pb={4}
        justifyContent="flex-end"
      >
        <ButtonGroup size="sm">
          <Button
            fontSize={["xs", "xs", "md", "md"]}
            variant="outline"
            onClick={onClose}
          >
            {t("cancel")}
          </Button>
          <Button
            colorScheme="orange"
            disabled={isButtonDisabled}
            fontSize={["xs", "xs", "md", "md"]}
            onClick={(event) => {
              handleClick(event);
              onClose();
            }}
          >
            {t("apply")}
          </Button>
        </ButtonGroup>
      </Popover.Footer>
    </Popover.Content>
  );
  const popContentWithPortal = <Portal>{popContent}</Portal>;
  return (
    <Popover.Root open={open} onOpenChange={onOpen} onExitComplete={onClose}>
      <Popover.Trigger>{children}</Popover.Trigger>
      {portalEnabled ? popContentWithPortal : popContent}
    </Popover.Root>
  );
};

ConfirmPopComponent.defaultProps = {
  children: undefined,
  commands: undefined,
  portalEnabled: true,
};
export default ConfirmPopComponent;
