
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react"
import { ColorModeProvider } from "@/components/ui/color-mode"
import RootDetector from "./components/common/RootDetector"
import Navbar from "./components/common/Navbar"
import Initial from "./initial/Initial"

const config = defineConfig({
  theme: {
    tokens: {
      colors: {},
    },
  },
})

const system = createSystem(defaultConfig, config)

export default function App() {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>
      <RootDetector/>
       <Navbar />
       <Initial />
       </ColorModeProvider>
    </ChakraProvider>
  )
}
