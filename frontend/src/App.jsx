import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import MyVideos from "./pages/MyVideos.jsx";

export default function App() {
  const location = useLocation();
  const title =
    location.pathname === "/chat"
      ? "Main Chat"
      : location.pathname === "/videos"
        ? "My Videos"
        : "Dashboard";
  return (
    <Layout title={title}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/videos" element={<MyVideos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
