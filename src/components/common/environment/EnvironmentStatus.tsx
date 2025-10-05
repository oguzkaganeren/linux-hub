import { Badge, Box } from '@chakra-ui/react';
import { Tooltip } from "@/components/ui/tooltip"
import { useTranslation } from 'react-i18next';
//import useEnvHook from './useEnvHook';

const EnvironmentStatus = () => {
  const { t } = useTranslation();
  const isLive = false; // Replace with actual logic to determine if the environment is live
  const isOnline = true; // Replace with actual logic to determine if the app is online
  // const { isOnline } = useEnvHook();
  return (
    <Box position="absolute" ml={3} fontSize="xs" mt={2} color="gray.500">
      {isLive && (
        <Tooltip content={t('liveTooltip')}>
          <Badge ml="1" size="sm" colorScheme="purple">
            {t('live')}
          </Badge>
        </Tooltip>
      )}
      {!isOnline && (
        <Tooltip content={t('offlineTooltip')}>
          <Badge ml="1" size="sm" colorScheme="red">
            {t('offline')}
          </Badge>
        </Tooltip>
      )}
    </Box>
  );
};

export default EnvironmentStatus;
