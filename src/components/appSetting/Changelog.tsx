import React, { useEffect, useState } from "react";
import {
  Button,
  useDisclosure,
  Box,
  Text,
  Heading,
  Dialog,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import remarkGfm from "remark-gfm";
import { open } from "@tauri-apps/plugin-shell";
// Remove the import and use a relative path string for fetch
const notesUrl = "/assets/CHANGELOG.md";

const newTheme = {
  a: (props: any) => {
    const { children, href } = props;

    return (
      <Button
        whiteSpace="initial"
        size="sm"
        onClick={async () => {
          await open(href);
        }}
      >
        <Text as="u">{children}</Text>
      </Button>
    );
  },
  h3: (props: any) => {
    const { children } = props;
    return (
      <Heading as="h6" size="xs">
        {children}
      </Heading>
    );
  },
  h2: (props: any) => {
    const { children } = props;
    return (
      <Heading as="h5" size="xs">
        {children}
      </Heading>
    );
  },
  h1: (props: any) => {
    const { children } = props;
    return (
      <Heading as="h4" size="xs">
        {children}
      </Heading>
    );
  },
};

const Changelog = () => {
  const { t } = useTranslation();
  const [mdContent, setMdContent] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  fetch(notesUrl)
    .then((response) => response.text())
    .then((text) => {
      setMdContent(text);
    });
  return (
    <Box>
      <Button size="xs" onClick={onOpen}>
        {t("appChangelog")}
      </Button>

      <Dialog.Root open={isOpen} onExitComplete={onClose}>
        <Dialog.Content p={4}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={newTheme}>
            {mdContent}
          </ReactMarkdown>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
};

export default Changelog;
