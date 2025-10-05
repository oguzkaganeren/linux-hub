import React, { Suspense } from "react";
import { Stack, Text, Icon, Box, Button, Container } from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { useTranslation } from "react-i18next";
import "@fontsource-variable/caveat";
import LiveInstaller from "../components/home/LiveInstaller";

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container
      maxW="3xl"
      display="flex"
      justifyContent="center"
      alignItems="center"
      minH="90dvh"
    >
      <Stack as={Box} textAlign="center" justify="center" align="center">
        <Text color={useColorModeValue("gray.800", "gray.300")}>
          {t("homeText1")}{" "}
          <Button variant="subtle" onClick={async () => {}}>
            {t("sendFeedback")}
          </Button>
        </Text>

        <Stack
          direction="column"
          align="center"
          alignSelf="center"
          position="relative"
        >
          <Button
            fontWeight="700"
            rounded="md"
            variant="solid"
            colorScheme="whatsapp"
            pt={1}
            px={6}
            size={["xs", "sm", "md", "md"]}
            _hover={{
              bg: "green.500",
            }}
          >
            {t("start")}
          </Button>
          <Suspense>
            <LiveInstaller />
          </Suspense>
        </Stack>
      </Stack>
    </Container>
  );
};
export default HomeScreen;
