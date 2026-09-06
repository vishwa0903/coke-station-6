import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import RootErrorBoundary from "./RootErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
