"use client";
import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react";
import { useColorMode, useColorModeValue } from "@/components/ui/color-mode";
import { Moon, Sun } from "lucide-react";
import { FC } from "react";

const Theme: FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const text = useColorModeValue("dark", "light");
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <IconButton
        size="xs"
        variant="outline"
        aria-label={`Switch to ${text} mode`}
        onClick={toggleColorMode}
      >
        {colorMode === "light" ? <Moon /> : <Sun />}
      </IconButton>
    </ClientOnly>
  );
};
export default Theme;
