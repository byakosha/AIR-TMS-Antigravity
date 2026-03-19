import { useEffect, useState } from "react";
import { Button, Card, Col, Form, Input, List, Modal, Row, Select, Space, Spin, Table, Tabs, Tag, Typography, message } from "antd";
import { createUser, deleteUser, fetchUsers, getAirlines, createAirline, createAwbRange, getSupplyChains, createSupplyChainRule, deleteSupplyChainRule, type UserRecord, type AirlineDetails, type SupplyChainRule } from "../api";

export function SettingsPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [usersForm] = Form.useForm();

  const [airlines, setAirlines] = useState<AirlineDetails[]>([]);
  const [supplyChains, setSupplyChains] = useState<SupplyChainRule[]>([]);
  
  const [airlineModalOpen, setAirlineModalOpen] = useState(false);
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [chainModalOpen, setChainModalOpen] = useState(false);
  const [activeAirlineId, setActiveAirlineId] = useState<number | null>(null);

  const [airlineForm] = Form.useForm();
  const [rangeForm] = Form.useForm();
  const [chainForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
      setAirlines(await getAirlines());
      setSupplyChains(await getSupplyChains());
    } catch {
      message.error("Не удалось загрузить часть настроек (backend недоступен)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateUser = async () => {
    try {
      const values = await usersForm.validateFields();
      await createUser(values);
      message.success("Пользователь создан");
      setUsersModalOpen(false);
      usersForm.resetFields();
      void loadData();
    } catch (e: any) { message.error(e.message || "Ошибка!"); }
  };

  const handleCreateAirline = async () => {
    try {
      const vals = await airlineForm.validateFields();
      await createAirline(vals);
      message.success("Авиакомпания добавлена");
      setAirlineModalOpen(false);
      airlineForm.resetFields();
      void loadData();
    } catch { message.error("Ошибка"); }
  };

  const handleCreateAwbRange = async () => {
    if (!activeAirlineId) return;
    try {
      const vals = await rangeForm.validateFields();
      await createAwbRange(activeAirlineId, vals);
      message.success("Диапазон добавлен");
      setRangeModalOpen(false);
      rangeForm.resetFields();
      void loadData();
    } catch { message.error("Ошибка"); }
  };

  const handleCreateChain = async () => {
    try {
      const vals = await chainForm.validateFields();
      await createSupplyChainRule(vals);
      message.success("Правило добавлено");
      setChainModalOpen(false);
      chainForm.resetFields();
      void loadData();
    } catch { message.error("Ошибка"); }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%", paddingBottom: 40 }}>
      {/* Premium Luxury Hero */}
      <div className="premium-hero" style={{ padding: "40px" }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: '-0.03em' }}>
          Настройки системы
        </Typography.Title>
        <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 16 }}>
          Управление доступом, справочниками и правилами маршрутизации BIOCARD.
        </Typography.Text>
      </div>

      <Spin spinning={loading}>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-subtle)' }}>
          <Tabs 
            defaultActiveKey="1" 
            size="large"
            items={[
              {
                key: '1',
                label: <span style={{fontWeight: 500}}>Доступ и Пользователи</span>,
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                      <Typography.Text type="secondary">Здесь вы можете управлять логинами и ролями сотрудников.</Typography.Text>
                      <Button type="primary" onClick={() => setUsersModalOpen(true)}>Новый пользователь</Button>
                    </div>
                    <Table 
                      dataSource={users} 
                      rowKey="id" 
                      pagination={false}
                      className="premium-table"
                      columns={[
                        { title: 'Имя', dataIndex: 'full_name', render: text => <Typography.Text strong>{text}</Typography.Text> },
                        { title: 'Логин', dataIndex: 'username' },
                        { title: 'Роль', dataIndex: 'role', render: text => <Tag color="blue">{text}</Tag> },
                        { title: 'Статус', dataIndex: 'is_active', render: active => <Tag color={active ? 'green' : 'red'}>{active ? 'Активен' : 'Отключен'}</Tag> },
                        { title: '', key: 'action', align: 'right', render: (_, record) => (
                           <Button danger type="text" onClick={async () => {
                             await deleteUser(record.id);
                             message.success("Пользователь удален");
                             void loadData();
                           }}>Удалить</Button>
                        )},
                      ]} 
                    />
                  </div>
                )
              },
              {
                key: '2',
                label: <span style={{fontWeight: 500}}>Авиакомпании и Бланки AWB</span>,
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                      <Typography.Text type="secondary">Пулы накладных разбиты по Carrier ID. Добавьте новые диапазоны, когда бланки заканчиваются.</Typography.Text>
                      <Button type="primary" onClick={() => setAirlineModalOpen(true)}>Новая авиакомпания</Button>
                    </div>
                    <List
                      dataSource={airlines}
                      className="premium-table"
                      renderItem={(airline) => (
                        <List.Item
                          actions={[<Button type="link" onClick={() => { setActiveAirlineId(airline.id); setRangeModalOpen(true); }}>Добавить сток AWB</Button>]}
                        >
                          <List.Item.Meta
                            title={<Typography.Text strong style={{fontSize: 16}}>{airline.name} ({airline.carrier_code})</Typography.Text>}
                            description={
                              <Space direction="vertical" size={4} style={{marginTop: 8}}>
                                <Tag color="purple">Префикс: {airline.awb_prefix}</Tag>
                                {airline.ranges?.length ? airline.ranges.map(r => (
                                  <Tag color={r.is_active ? "green" : "default"} key={r.id}>
                                    Диапазон: {r.start_number} - {r.end_number} (Выдается: {r.current_number})
                                  </Tag>
                                )) : <Typography.Text type="danger">Нет доступных бланков для печати</Typography.Text>}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                )
              },
              {
                key: '3',
                label: <span style={{fontWeight: 500}}>Маршрутизация грузов</span>,
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                      <Typography.Text type="secondary">Настройте автоматическое присвоение авиакомпаний при появлении груза в определенном аэропорту назначения.</Typography.Text>
                      <Button type="primary" onClick={() => setChainModalOpen(true)}>Настроить маршрут</Button>
                    </div>
                    <List
                      dataSource={supplyChains}
                      renderItem={(chain) => (
                        <List.Item
                          actions={[<Button danger type="text" onClick={async () => { await deleteSupplyChainRule(chain.id); message.success("Удалено"); void loadData(); }}>Удалить правило</Button>]}
                        >
                          <List.Item.Meta
                            title={<Typography.Text strong style={{fontSize: 16}}>{chain.airport_code} ➝ Рейсы {chain.carrier_code}</Typography.Text>}
                            description={`Все грузы в ${chain.airport_code} автоматически планируются на перевозчика ${chain.carrier_code}`}
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                )
              }
            ]}
          />
        </div>
      </Spin>

      {/* MODALS */}
      <Modal title="Новый пользователь" open={usersModalOpen} onCancel={() => setUsersModalOpen(false)} onOk={handleCreateUser}>
        <Form form={usersForm} layout="vertical">
          <Form.Item name="full_name" label="Полное имя" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="username" label="Логин" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input /></Form.Item>
          <Form.Item name="role" label="Роль" rules={[{ required: true }]}>
            <Select options={[
              { value: "admin", label: "Администратор" },
              { value: "planner", label: "Планировщик" },
              { value: "execution_operator", label: "Оператор" },
            ]} />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true }]}><Input.Password /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Новая авиакомпания" open={airlineModalOpen} onCancel={() => setAirlineModalOpen(false)} onOk={handleCreateAirline}>
        <Form form={airlineForm} layout="vertical">
          <Form.Item name="carrier_code" label="Код IATA (Например: SU)" rules={[{required: true}]}><Input /></Form.Item>
          <Form.Item name="name" label="Название (Например: Аэрофлот)" rules={[{required: true}]}><Input /></Form.Item>
          <Form.Item name="awb_prefix" label="Префикс AWB (Например: 555)" rules={[{required: true}]}><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Добавить сток AWB" open={rangeModalOpen} onCancel={() => setRangeModalOpen(false)} onOk={handleCreateAwbRange}>
        <Form form={rangeForm} layout="vertical">
          <Form.Item name="start_number" label="Начальный номер (7 цифр)" rules={[{required: true}]}><Input type="number" /></Form.Item>
          <Form.Item name="end_number" label="Конечный номер (7 цифр)" rules={[{required: true}]}><Input type="number" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Новое правило маршрутизации" open={chainModalOpen} onCancel={() => setChainModalOpen(false)} onOk={handleCreateChain}>
        <Form form={chainForm} layout="vertical">
          <Form.Item name="airport_code" label="Аэропорт назначения (KJA)" rules={[{required: true}]}><Input /></Form.Item>
          <Form.Item name="carrier_code" label="Авиакомпания (SU)" rules={[{required: true}]}><Input /></Form.Item>
        </Form>
      </Modal>

    </Space>
  );
}
