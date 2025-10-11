import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/ibm-plex-mono";

createRoot(document.getElementById("root")!).render(<App />);
