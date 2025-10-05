import React, { useEffect, useState } from "react";
import { Heading, VStack, Text, AbsoluteCenter } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";

const DistroDetail = () => {
  const [version, setVersion] = useState("");
  const [codeName, setCodeName] = useState("");
  const [distro, setDistro] = useState("");
  const { t } = useTranslation();
  useEffect(() => {
    invoke("run_shell_command_with_result", {
      command: "cat /etc/lsb-release",
    }).then((response) => {
      if (response) {
        const variables = (response as string).split("\\n");
        const versionTemp = variables[1].split("=")[1].replaceAll('\\"', "");
        const codeNameTemp = variables[2].split("=")[1].replaceAll('\\"', "");
        const dist = variables[variables.length - 2]
          .split("=")[1]
          .replaceAll('\\"', "");

        setVersion(versionTemp);
        setCodeName(codeNameTemp);
        setDistro(dist);
      }
    });
  }, []);
  return (
    <AbsoluteCenter>
      <VStack mt={2}>
        {distro}
        <br />
        <Text
          as="span"
          fontSize="md"
          style={{ textTransform: "capitalize" }}
          color="green.400"
        >
          {version} {codeName}
        </Text>
      </VStack>
    </AbsoluteCenter>
  );
};
export default DistroDetail;
