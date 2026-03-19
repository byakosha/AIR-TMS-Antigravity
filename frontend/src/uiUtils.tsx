import { Tag } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

export const statusColor: Record<string, string> = {
  pending: "gold",
  draft: "default",
  confirmed: "green",
  partial: "orange",
  fixed: "blue",
  handed_over_partial: "orange",
  handed_over_full: "green",
  not_handed_over: "default",
  flown_partial: "orange",
  flown_full: "green",
  not_flown: "red",
  postponed: "volcano",
};

export const bookingLabels: Record<string, string> = {
  pending: "Ожидает",
  draft: "Черновик",
  confirmed: "Подтверждено",
  partial: "Частично",
  fixed: "Зафиксировано"
};

export const handoverLabels: Record<string, string> = {
  not_handed_over: "Не сдано",
  handed_over_partial: "Сдано частично",
  handed_over_full: "Сдано полностью"
};

export const executionLabels: Record<string, string> = {
  pending: "Ожидает",
  flown_partial: "Вылетело частично",
  flown_full: "Вылетело полностью",
  not_flown: "Не вылетело",
  postponed: "Отложено"
};

export function getStatusIcon(statusText: string | undefined | null) {
  if (!statusText) return <FileTextOutlined />;
  switch (statusText.toLowerCase()) {
    case "confirmed":
    case "handed_over_full":
    case "flown_full":
    case "fixed":
      return <CheckCircleOutlined />;
    case "partial":
    case "handed_over_partial":
    case "flown_partial":
      return <SyncOutlined spin />;
    case "not_flown":
    case "not_handed_over":
    case "postponed":
      return <WarningOutlined />;
    case "pending":
    case "draft":
    default:
      return <ClockCircleOutlined />;
  }
}

export function StatusTag({ status, type }: { status: string; type: "booking" | "handover" | "execution" }) {
  const color = statusColor[status] ?? "default";
  let label = status;
  if (type === "booking") label = bookingLabels[status] ?? status;
  if (type === "handover") label = handoverLabels[status] ?? status;
  if (type === "execution") label = executionLabels[status] ?? status;

  return (
    <Tag color={color} icon={getStatusIcon(status)}>
      {label}
    </Tag>
  );
}
