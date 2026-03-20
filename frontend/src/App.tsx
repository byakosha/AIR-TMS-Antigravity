import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./layout/AppLayout";
import { BookingPage } from "./pages/BookingPage";
import { ExecutionPage } from "./pages/ExecutionPage";
import { KnowledgeBasePage } from "./pages/KnowledgeBasePage";
import { LoginPage } from "./pages/LoginPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PlanningPage } from "./pages/PlanningPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

function ProtectedApp() {
  return (
    <RequireAuth>
      <AppLayout>
        <ErrorBoundary>
        <Routes>
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/execution" element={<ExecutionPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
        </ErrorBoundary>
      </AppLayout>
    </RequireAuth>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  );
}
