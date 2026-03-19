import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "antd";
import "antd/dist/reset.css";

import { AuthProvider } from "./auth/AuthContext";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={{ 
        token: { 
          colorPrimary: '#7c1623', 
          colorInfo: '#1890ff', 
          borderRadius: 12, 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorText: '#1d1d1f'
        },
        components: {
          Card: { paddingLG: 24 }
        }
      }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
