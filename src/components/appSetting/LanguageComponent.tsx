import {
  Select,
  HStack,
  Spacer,
  Field,
  Fieldset,
  NativeSelect,
} from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import availableLanguages from "../../i18n";

const LanguageComponent: React.FC = () => {
  const { i18n, t } = useTranslation();
  return (
    <Fieldset.Root
      py={4}
      px={8}
      bg="white"
      _dark={{
        bg: "gray.800",
      }}
      shadow="lg"
      rounded="lg"
    >
      <Field.Root>
        <Field.Label>{t("language")}</Field.Label>
        <NativeSelect.Root>
          <NativeSelect.Field
            id="lan"
            defaultValue={i18n.resolvedLanguage}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            {availableLanguages.map((language) => (
              <option key={language}>{language}</option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Field.Root>
    </Fieldset.Root>
  );
};
export default LanguageComponent;
