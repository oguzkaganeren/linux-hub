import React, { Suspense, lazy } from 'react';
import {
  Box, Center, Flex, Spinner, VStack,
} from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';
import EnvironmentStatus from '../components/common/environment/EnvironmentStatus';

const HomeScreen = lazy(() => import('../screens/HomeScreen'));
function getCorrectScreen(activeStep:number) {
  switch (activeStep) {
    case 0:
      return <HomeScreen />;
  }
}
const Initial: React.FC = () => {

  return (
    <VStack mt={63}>
      <Flex
        position="fixed"
        bg="#edf3f8"
        _dark={{ bg: '#1A202C' }}
        padding={5}
        w="100%"
      >
        <Routes>
          <Route
            index
            element={(
              <Suspense
                fallback={(
                  <Box w="100%">
                    <Center>
                      <Spinner mt={20} color="green.300" />
                    </Center>
                  </Box>
                )}
              >
                {getCorrectScreen(0)}
              </Suspense>
            )}
          />
        </Routes>
        <Suspense
          fallback={(
            <Box w="100%">
              <Center>
                <Spinner mt={20} color="green.300" />
              </Center>
            </Box>
          )}
        >
          <EnvironmentStatus />
        </Suspense>
      </Flex>
    </VStack>
  );
};

export default Initial;
