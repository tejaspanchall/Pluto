import { SafeAreaProvider } from "react-native-safe-area-context";
import { MainScreen } from "./src/screens/MainScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}
