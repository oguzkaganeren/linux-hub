import React from "react";
import { Button } from "@chakra-ui/react";
import { open } from "@tauri-apps/plugin-shell";
import { useTranslation } from "react-i18next";

const BugReport = () => {
  const { t } = useTranslation();
  return (
    <Button
      size="xs"
      colorScheme="red"
      onClick={async () => {
        await open(
          "https://github.com/oguzkaganeren/manj/issues/new?assignees=&labels=&template=bug_report.md&title="
        );
      }}
    >
      {t("bugReport")}
    </Button>
  );
};

export default BugReport;
