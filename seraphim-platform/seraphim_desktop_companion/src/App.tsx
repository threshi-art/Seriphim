import { SeraphimProvider } from "./state/SeraphimState";
import { AppShell } from "./components/AppShell";
import "./App.css";

export default function App() {
  return (
    <SeraphimProvider>
      <AppShell />
    </SeraphimProvider>
  );
}
