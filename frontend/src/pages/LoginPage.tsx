import { useMemo, useState } from "react";
import { Button, Card, Form, Input, Space, Typography, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = useMemo(() => (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname ?? "/overview", [location.state]);

  const handleFinish = async (values: { username: string; password: string }) => {
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      message.success("Добро пожаловать в BIOCARD TMS");
      navigate(from, { replace: true });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Не удалось выполнить вход";
      message.error(text);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <div style={{ marginBottom: "16px" }}>
              <img src="/biocard-logo.svg" alt="BIOCARD Logo" style={{ height: "48px" }} />
            </div>
            <Typography.Text className="hero-eyebrow">BIOCARD access</Typography.Text>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Вход в авиационный контур
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Используй демо-аккаунты для тестирования UI и прав доступа. После входа откроется единый рабочий экран.
            </Typography.Paragraph>
          </Space>

          <Form layout="vertical" onFinish={handleFinish} requiredMark={false} autoComplete="off">
            <Form.Item label="Логин" name="username" initialValue="admin" rules={[{ required: true, message: "Введите логин" }]}>
              <Input placeholder="admin" size="large" />
            </Form.Item>
            <Form.Item
              label="Пароль"
              name="password"
              initialValue="admin123"
              rules={[{ required: true, message: "Введите пароль" }]}
            >
              <Input.Password placeholder="admin123" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
              Войти
            </Button>
          </Form>

          <div className="login-hints">
            <Typography.Text type="secondary">Демо-аккаунты:</Typography.Text>
            <Space wrap>
              <Typography.Text code>admin / admin123</Typography.Text>
              <Typography.Text code>planner / planner123</Typography.Text>
              <Typography.Text code>execution / execution123</Typography.Text>
              <Typography.Text code>supervisor / supervisor123</Typography.Text>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
}
