// =============================================================
// FILE: src/main.jsx
// PURPOSE: React entry point. Wraps everything in BrowserRouter,
//          AuthProvider, BatchProvider, StudentProvider.
//          ToastContainer configured here for global toasts.
//          Import globals.css here so it applies app-wide.
// =============================================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider }    from "./context/AuthContext";
import { BatchProvider }   from "./context/BatchContext";
import { StudentProvider } from "./context/StudentContext";
import "./styles/globals.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BatchProvider>
          <StudentProvider>
            <App />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              draggable
            />
          </StudentProvider>
        </BatchProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);