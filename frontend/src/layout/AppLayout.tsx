import { Layout, Menu } from "antd";
import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

const { Header, Content } = Layout;

const navItems = [
  { key: "/overview", label: <Link to="/overview"><span className="nav-item"><span className="nav-dot nav-dot-overview" />Обзор</span></Link> },
  { key: "/planning", label: <Link to="/planning"><span className="nav-item"><span className="nav-dot nav-dot-planning" />Планирование (AWB)</span></Link> },
  { key: "/execution", label: <Link to="/execution"><span className="nav-item"><span className="nav-dot nav-dot-execution" />Исполнение</span></Link> },
  { key: "/settings", label: <Link to="/settings"><span className="nav-item"><span className="nav-dot nav-dot-settings" />Настройки</span></Link> },
  { key: "/knowledge-base", label: <Link to="/knowledge-base"><span className="nav-item"><span className="nav-dot nav-dot-knowledge" />База знаний</span></Link> },
];

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const selectedKey = navItems.find((item) => location.pathname.startsWith(item.key))?.key ?? "/overview";

  return (
    <Layout className="app-shell">
      <Header className="app-topbar">
        <div className="topbar-brand" aria-label="BIOCARD">
          <img className="brand-logo" src="/biocard-logo.svg" alt="BIOCARD" />
        </div>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={navItems}
          className="topbar-menu"
          style={{ justifyContent: "center" }}
        />
        <div className="topbar-user">
          <div className="topbar-user-copy">
            <span className="topbar-user-role">{user?.role ?? "guest"}</span>
            <strong>{user?.full_name ?? "Guest"}</strong>
          </div>
          <button className="topbar-logout" type="button" onClick={logout}>
            Выйти
          </button>
        </div>
      </Header>
      <Content className="app-content">
        <div className="app-content-inner">{children}</div>
      </Content>
    </Layout>
  );
}
