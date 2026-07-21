
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { applyPlatformClasses } from "./lib/native";
  import { installDeviceLog } from "./lib/deviceLog";

  applyPlatformClasses();
  // Installed before render so a crash during boot is captured too.
  installDeviceLog();

  createRoot(document.getElementById("root")!).render(<App />);
  