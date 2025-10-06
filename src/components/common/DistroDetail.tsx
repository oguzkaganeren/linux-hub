import React, { useEffect, useState } from "react";
import { Heading, Highlight, Text, AbsoluteCenter } from "@chakra-ui/react";
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
      <Heading size="xs" letterSpacing="tight">
        <Highlight
          query={codeName}
          styles={{ color: "teal.600", _dark: { color: "teal.300" } }}
        >
          {distro + " " + version + " " + codeName}
        </Highlight>
      </Heading>
    </AbsoluteCenter>
  );
};
export default DistroDetail;
