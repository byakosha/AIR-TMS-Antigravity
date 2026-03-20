import React, { ErrorInfo, ReactNode } from "react";
import { Result, Button, Typography, Collapse } from "antd";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught frontend error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f2f5" }}>
          <Result
            status="500"
            title="Ой! Что-то пошло не так."
            subTitle="Компонент интерфейса вызвал критическую ошибку. Пожалуйста, перезагрузите страницу."
            extra={
              <Button type="primary" onClick={() => window.location.reload()}>
                Перезагрузить страницу
              </Button>
            }
          >
            {this.state.error && (
              <Collapse
                items={[
                  {
                    key: '1',
                    label: 'Детали ошибки (Для разработчиков)',
                    children: (
                      <div>
                        <Typography.Text type="danger" strong>
                          {this.state.error.toString()}
                        </Typography.Text>
                        <br />
                        <Typography.Text type="secondary" style={{ whiteSpace: "pre-wrap" }}>
                          {this.state.errorInfo?.componentStack}
                        </Typography.Text>
                      </div>
                    )
                  }
                ]}
              />
            )}
          </Result>
        </div>
      );
    }

    return this.props.children;
  }
}
