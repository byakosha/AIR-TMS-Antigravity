import { Modal, Form, Row, Col, Card, Select, Input, DatePicker, Button } from "antd";
import type { FormInstance } from "antd/es/form";
import type { DefaultOptionType } from "antd/es/select";

const { RangePicker } = DatePicker;

export interface PlanningFilterModalProps {
  open: boolean;
  onCancel: () => void;
  form: FormInstance;
  onApply: (values: Record<string, unknown>) => void;
  initialValues: Record<string, unknown>;
  airportLoading: boolean;
  airportOptions: DefaultOptionType[];
  directionOptions: DefaultOptionType[];
  options: {
    temperature: { value: string; label: string }[];
    booking: string[];
    handover: string[];
    execution: string[];
    color: string[];
  };
  bookingLabels: Record<string, string>;
  handoverLabels: Record<string, string>;
  executionLabels: Record<string, string>;
  apiBusy: boolean;
  onSeedWorkbench: () => void;
  onResetFilters: () => void;
}

export function PlanningFilterModal({
  open,
  onCancel,
  form,
  onApply,
  initialValues,
  airportLoading,
  airportOptions,
  directionOptions,
  options,
  bookingLabels,
  handoverLabels,
  executionLabels,
  apiBusy,
  onSeedWorkbench,
  onResetFilters,
}: PlanningFilterModalProps) {
  return (
    <Modal title="Настройка фильтров" open={open} onCancel={onCancel} footer={null} width={1000}>
      <Form form={form} layout="vertical" onFinish={onApply} initialValues={initialValues}>
        <Row gutter={[16, 12]} align="stretch">
          <Col xs={24} xl={15}>
            <Card size="small" className="filter-section-card" title="Основные фильтры" bordered={false}>
              <Row gutter={[12, 10]}>
                <Col xs={24} md={12} xl={8}><Form.Item name="search" label="Поиск"><Input allowClear placeholder="AWB, рейс, заказ, комментарий" /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name="airport_code" label="Аэропорт"><Select showSearch allowClear loading={airportLoading} placeholder="Все аэропорты" options={airportOptions} optionFilterProp="label" /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name="direction_code" label="Направление"><Select showSearch allowClear placeholder="Все направления" options={directionOptions} optionFilterProp="label" /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name="temperature_mode" label="Температура"><Select allowClear placeholder="Все режимы" options={options.temperature} /></Form.Item></Col>
                <Col xs={24} md={12} xl={8}><Form.Item name="workbench_date_range" label="Период вылета"><RangePicker style={{ width: "100%" }} /></Form.Item></Col>
              </Row>
            </Card>
          </Col>
          <Col xs={24} xl={9}>
            <Card size="small" className="filter-section-card" title="Статусы и признаки" bordered={false}>
              <Row gutter={[12, 10]}>
                <Col xs={24} md={8} xl={12}><Form.Item name="booking_status" label="Бронь"><Select allowClear placeholder="Все" options={options.booking.map((value) => ({ label: bookingLabels[value] ?? value, value }))} /></Form.Item></Col>
                <Col xs={24} md={8} xl={12}><Form.Item name="handover_status" label="Сдача"><Select allowClear placeholder="Все" options={options.handover.map((value) => ({ label: handoverLabels[value] ?? value, value }))} /></Form.Item></Col>
                <Col xs={24} md={8} xl={12}><Form.Item name="execution_status" label="Вылет"><Select allowClear placeholder="Все" options={options.execution.map((value) => ({ label: executionLabels[value] ?? value, value }))} /></Form.Item></Col>
                <Col xs={24} md={8} xl={12}><Form.Item name="color_tag" label="Цвет"><Select allowClear placeholder="Все" options={options.color.map((value) => ({ label: value, value }))} /></Form.Item></Col>
                <Col xs={24} md={8} xl={12}><Form.Item name="has_awb" label="С AWB"><Select allowClear placeholder="Все" options={[{ label: "Да", value: true }, { label: "Нет", value: false }]} /></Form.Item></Col>
                <Col xs={24} md={8} xl={12}><Form.Item name="has_flight" label="С рейсом"><Select allowClear placeholder="Все" options={[{ label: "Да", value: true }, { label: "Нет", value: false }]} /></Form.Item></Col>
                <Col xs={24} md={12} xl={24}><Form.Item name="is_outside_final_manifest" label="Вне манифеста"><Select allowClear placeholder="Все" options={[{ label: "Да", value: true }, { label: "Нет", value: false }]} /></Form.Item></Col>
              </Row>
            </Card>
          </Col>
        </Row>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 8 }} className="filter-actions">
          <Button onClick={onSeedWorkbench} loading={apiBusy} style={{ marginRight: 'auto' }}>Загрузить демо-данные</Button>
          <Button onClick={onResetFilters}>Сбросить всё</Button>
          <Button onClick={onCancel}>Отмена</Button>
          <Button type="primary" htmlType="submit">Применить</Button>
        </div>
      </Form>
    </Modal>
  );
}
