import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ConvexReactClient, ConvexProvider } from "convex/react";

// подключаем локальный Convex backend
const client = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || "http://127.0.0.1:3210");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConvexProvider client={client}>
      <App />
    </ConvexProvider>
  </React.StrictMode>
);
