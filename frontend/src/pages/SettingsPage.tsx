import { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Divider, Empty, Form, Input, List, Modal, Row, Select, Space, Spin, Tag, Typography, message } from "antd";

import { createUser, deleteUser, fetchSettingsSummary, fetchUsers, type SettingsSummary, type UserRecord, getAirlines, createAirline, createAwbRange, getSupplyChains, createSupplyChainRule, deleteSupplyChainRule, type AirlineDetails, type AwbBlankRange, type SupplyChainRule } from "../api";

const defaultSummary: SettingsSummary = {
  hero_stats: [
    { label: "Справочники", value: "28", note: "аэропорты и базовые каталоги" },
    { label: "Направления", value: "4", note: "рабочие маршруты в манифесте" },
    { label: "AWB", value: "0", note: "актуальные авианакладные" },
    { label: "Рейсы", value: "0", note: "зафиксированные flight records" },
  ],
  sections: [
    {
      key: "directories",
      title: "Справочники",
      subtitle: "Базовые объекты, которые дают системе единый язык данных",
      accent: "blue",
      tags: ["Аэропорты", "Авиакомпании", "Агенты", "Направления", "Грузы"],
      items: [
        { title: "Аэропорты", description: "Коды IATA, статус активности, регионы и поиск по справочнику." },
        { title: "Авиакомпании", description: "Тип взаимодействия, активность, связка с перевозчиками и агентами." },
        { title: "Агенты и соглашения", description: "Договоры, SLA, правила работы и доступность для маршрутов." },
      ],
      actions: ["Открыть справочники", "Импорт / экспорт"],
    },
    {
      key: "rules",
      title: "Правила и статусы",
      subtitle: "Логика, которая превращает данные в управляемый рабочий процесс",
      accent: "gold",
      tags: ["Статусы", "Матрица", "Фиксация", "Причины", "Ограничения"],
      items: [
        { title: "Причины изменений", description: "Операционные причины, источник ответственности и комментарии для аудита." },
        { title: "Статусы и матрицы", description: "Статусы брони, сдачи, вылета и правила смешивания температур и флагов." },
        { title: "Правила фиксации", description: "Что блокирует план, что требует подтверждения и какие поля обязательны." },
      ],
      actions: ["Открыть правила", "Проверить конфликт"],
    },
    {
      key: "integrations",
      title: "Интеграции",
      subtitle: "Связь с 1С TMS, скрейперами и внешними системами бронирования",
      accent: "green",
      tags: ["1С TMS", "API", "Скрейпер", "Очереди", "Проверка"],
      items: [
        { title: "1С TMS", description: "Входящие заказы, обратная передача подтвержденного результата и сверка." },
        { title: "API / scraper", description: "Рейсы, факты вылета, сырые ответы и частота синхронизации." },
        { title: "Внешние системы бронирования", description: "Ручной ввод в MVP и готовность к будущему автоматическому обмену." },
      ],
      actions: ["Проверить соединение", "Настроить polling"],
    },
    {
      key: "access",
      title: "Роли и доступ",
      subtitle: "Кто и что может менять, утверждать и просматривать",
      accent: "purple",
      tags: ["Роли", "Права", "Аудит", "Журнал", "Пользователи"],
      items: [
        { title: "Роли пользователей", description: "Администратор, планировщик, оператор исполнения, руководитель смены." },
        { title: "Права доступа", description: "Кто видит, кто редактирует, кто фиксирует и кто утверждает изменения." },
        { title: "Аудит и журнал", description: "История изменений, критичные события и прозрачность решений." },
      ],
      actions: ["Управление ролями", "Просмотр аудита"],
    },
  ],
  operational_notes: [
    "Один экран = одна понятная зона ответственности.",
    "Крупные секции читаются быстрее, чем сетка одинаковых квадратиков.",
    "Частые действия должны быть рядом с контекстом, а не на отдельной панели.",
  ],
  side_metrics: [
    { label: "Справочники", value: "аэропорты, направления, статусы" },
    { label: "Интеграции", value: "1С TMS, API, polling" },
    { label: "Доступ", value: "роли, аудит, права" },
  ],
};

const defaultUsers: UserRecord[] = [
  { id: 1, username: "admin", full_name: "BIOCARD Admin", email: "admin@biocard.local", role: "admin", is_active: true, is_superuser: true },
  { id: 2, username: "planner", full_name: "Planning Dispatcher", email: "planner@biocard.local", role: "planner", is_active: true, is_superuser: false },
  { id: 3, username: "execution", full_name: "Execution Operator", email: "execution@biocard.local", role: "execution_operator", is_active: true, is_superuser: false },
  { id: 4, username: "supervisor", full_name: "Shift Supervisor", email: "supervisor@biocard.local", role: "supervisor", is_active: true, is_superuser: false },
];

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase());
}

export function SettingsPage() {
  const [summary, setSummary] = useState<SettingsSummary>(defaultSummary);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>(defaultUsers);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [usersSubmitting, setUsersSubmitting] = useState(false);
  const [usersForm] = Form.useForm();

  useEffect(() => {
    let active = true;

    fetchSettingsSummary()
      .then((data) => {
        if (!active) return;
        setSummary(data);
      })
      .catch(() => {
        message.warning("Не удалось загрузить настройки с backend, показан локальный fallback.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchUsers()
      .then((data) => {
        if (active) {
          setUsers(data);
        }
      })
      .catch(() => {
        message.warning("Не удалось загрузить пользователей, показан локальный список.");
      })
      .finally(() => {
        if (active) {
          setUsersLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const [airlines, setAirlines] = useState<AirlineDetails[]>([]);
  const [supplyChains, setSupplyChains] = useState<SupplyChainRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  const [airlineModalOpen, setAirlineModalOpen] = useState(false);
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [chainModalOpen, setChainModalOpen] = useState(false);
  
  const [activeAirlineId, setActiveAirlineId] = useState<number | null>(null);

  const [airlineForm] = Form.useForm();
  const [rangeForm] = Form.useForm();
  const [chainForm] = Form.useForm();

  const loadRules = async () => {
    setRulesLoading(true);
    try {
      setAirlines(await getAirlines());
      setSupplyChains(await getSupplyChains());
    } catch (err) {
      console.error(err);
      message.error("Failed to load supply chains and airlines");
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, []);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return summary.sections;
    }

    return summary.sections
      .map((section) => {
        const sectionMatches =
          matchesQuery(section.title, query) ||
          matchesQuery(section.subtitle, query) ||
          section.tags.some((tag) => matchesQuery(tag, query));
        const items = section.items.filter(
          (item) => matchesQuery(item.title, query) || matchesQuery(item.description, query),
        );

        if (sectionMatches) {
          return section;
        }

        if (items.length === 0) {
          return null;
        }

        return {
          ...section,
          items,
        };
      })
      .filter((section): section is SettingsSummary["sections"][number] => section !== null);
  }, [search, summary.sections]);

  const handleReload = async () => {
    setLoading(true);
    try {
      const data = await fetchSettingsSummary();
      setSummary(data);
      message.success("Настройки обновлены.");
    } catch {
      message.warning("Не удалось обновить данные, оставлен локальный fallback.");
    } finally {
      setLoading(false);
    }
  };

  const handleReloadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
      message.success("Пользователи обновлены.");
    } catch {
      message.warning("Не удалось обновить пользователей.");
    }
  };

  const handleCreateUser = async () => {
    try {
      const values = await usersForm.validateFields();
      setUsersSubmitting(true);
      const created = await createUser(values);
      setUsers((current) => [created, ...current]);
      message.success("Пользователь создан.");
      setUsersModalOpen(false);
      usersForm.resetFields();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    } finally {
      setUsersSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await deleteUser(userId);
      setUsers((current) => current.filter((user) => user.id !== userId));
      message.success("Пользователь удален.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Не удалось удалить пользователя";
      message.error(text);
    }
  };

  return (
    <Spin spinning={loading} tip="Загружаем справочники и правила">
      <Space direction="vertical" size="large" className="settings-page" style={{ width: "100%" }}>
        <Card className="settings-hero" bordered={false}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <Typography.Text className="settings-eyebrow">BIOCARD / System Control</Typography.Text>
              <Typography.Title level={3} style={{ margin: 0 }}>
                Настройки системы
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, maxWidth: 940 }}>
                Единое место для справочников, правил, интеграций и доступа. Без квадратиков, без лишнего шума, с управляемыми секциями
                и удобной адаптацией под большие экраны.
              </Typography.Paragraph>
            </Space>

            <div className="settings-hero-grid">
              {summary.hero_stats.map((item) => (
                <div className="settings-hero-stat" key={item.label}>
                  <Typography.Text type="secondary">{item.label}</Typography.Text>
                  <Typography.Title level={4} style={{ margin: "4px 0 0" }}>
                    {item.value}
                  </Typography.Title>
                  <Typography.Text className="settings-hero-note">{item.note}</Typography.Text>
                </div>
              ))}
            </div>

            <div className="settings-hero-actions">
              <Input.Search
                allowClear
                placeholder="Найти справочник, правило или интеграцию"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="settings-search"
              />
              <Space wrap>
                <Button onClick={handleReload}>Обновить</Button>
                <Button onClick={() => message.info("Импорт справочников будет подключен следующим спринтом.")}>
                  Импорт справочника
                </Button>
                <Button type="primary" onClick={() => message.info("Сохранение настроек будет доступно после подключения форм.")}>
                  Сохранить изменения
                </Button>
              </Space>
            </div>
          </Space>
        </Card>

        <div className="settings-layout">
          <div className="settings-main">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <Card key={section.key} className={`settings-section-card settings-section-${section.accent}`} bordered={false}>
                  <div className="settings-section-head">
                    <div className="settings-section-head-copy">
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {section.title}
                      </Typography.Title>
                      <Typography.Text type="secondary">{section.subtitle}</Typography.Text>
                    </div>
                    <Tag color={section.accent}>{section.items.length} пункта</Tag>
                  </div>

                  <Space wrap className="settings-section-tags">
                    {section.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>

                  <List
                    className="settings-section-list"
                    dataSource={section.items}
                    renderItem={(item) => (
                      <List.Item className="settings-section-item">
                        <div className="settings-section-item-copy">
                          <Typography.Text strong>{item.title}</Typography.Text>
                          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            {item.description}
                          </Typography.Paragraph>
                        </div>
                        <Button type="text">Открыть</Button>
                      </List.Item>
                    )}
                  />

                  <Divider style={{ margin: "16px 0 12px" }} />

                  <Space wrap className="settings-section-actions">
                    {section.actions.map((action, index) => (
                      <Button key={action} type={index === 0 ? "primary" : "default"}>
                        {action}
                      </Button>
                    ))}
                  </Space>
                </Card>
              ))
            ) : (
              <Card className="settings-empty-card" bordered={false}>
                <Empty description="Ничего не найдено по этому запросу" />
              </Card>
            )}
          </div>

          <div className="settings-rail">
            <Card className="settings-rail-card" title="Операционная логика" bordered={false}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {summary.operational_notes.map((note) => (
                  <div className="settings-rail-note" key={note}>
                    <span className="settings-rail-dot" />
                    <Typography.Text>{note}</Typography.Text>
                  </div>
                ))}
              </Space>
            </Card>

            <Card className="settings-rail-card" title="Что меняют чаще всего" bordered={false}>
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                {summary.side_metrics.map((metric) => (
                  <div className="settings-rail-metric" key={metric.label}>
                    <Typography.Text type="secondary">{metric.label}</Typography.Text>
                    <Typography.Text strong>{metric.value}</Typography.Text>
                  </div>
                ))}
              </Space>
            </Card>
          </div>
        </div>

        <Card
          className="settings-users-card"
          title="Управление пользователями"
          bordered={false}
          extra={
            <Space>
              <Button onClick={() => void handleReloadUsers()}>Обновить</Button>
              <Button type="primary" onClick={() => setUsersModalOpen(true)}>
                Добавить пользователя
              </Button>
            </Space>
          }
        >
          <Spin spinning={usersLoading}>
            <div className="settings-users-grid">
              {users.map((user) => (
                <div className="settings-user-row" key={user.id}>
                  <div className="settings-user-copy">
                    <Typography.Text strong>{user.full_name}</Typography.Text>
                    <Typography.Text type="secondary">
                      {user.username} · {user.role === 'admin' ? 'Администратор' : user.role === 'planner' ? 'Планировщик' : user.role === 'execution_operator' ? 'Оператор исполнения' : user.role === 'supervisor' ? 'Руководитель смены' : user.role}
                    </Typography.Text>
                  </div>
                  <div className="settings-user-meta">
                    <Tag color={user.is_superuser ? "blue" : "default"}>{user.is_superuser ? "Админ" : "Сотрудник"}</Tag>
                    <Tag color={user.is_active ? "green" : "red"}>{user.is_active ? "Активен" : "Отключен"}</Tag>
                    <Button danger type="text" onClick={() => void handleDeleteUser(user.id)}>
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Spin>
        </Card>

        <Modal
          title="Новый пользователь"
          open={usersModalOpen}
          onCancel={() => setUsersModalOpen(false)}
          onOk={() => void handleCreateUser()}
          confirmLoading={usersSubmitting}
          okText="Создать"
          cancelText="Отмена"
        >
          <Form form={usersForm} layout="vertical" initialValues={{ role: "planner", is_active: true, is_superuser: false }}>
            <Form.Item name="full_name" label="Полное имя" rules={[{ required: true, message: "Введите имя" }]}>
              <Input placeholder="Иван Иванов" />
            </Form.Item>
            <Form.Item name="username" label="Логин" rules={[{ required: true, message: "Введите логин" }]}>
              <Input placeholder="planner2" />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input placeholder="user@biocard.local" />
            </Form.Item>
            <Form.Item name="role" label="Роль" rules={[{ required: true, message: "Выберите роль" }]}>
              <Select
                options={[
                  { value: "admin", label: "Администратор" },
                  { value: "planner", label: "Планировщик" },
                  { value: "execution_operator", label: "Оператор исполнения" },
                  { value: "supervisor", label: "Руководитель смены" },
                ]}
              />
            </Form.Item>
            <Form.Item name="password" label="Пароль" rules={[{ required: true, message: "Введите пароль" }]}>
              <Input.Password placeholder="changeme123" />
            </Form.Item>
          </Form>
        </Modal>

        {/* --- SUPPLY CHAINS --- */}
        <Card
          className="settings-users-card"
          title="Цепи поставок (Маршрутизация)"
          bordered={false}
          extra={<Button type="primary" onClick={() => setChainModalOpen(true)}>Добавить правило</Button>}
        >
          <Spin spinning={rulesLoading}>
            <List
              dataSource={supplyChains}
              renderItem={(chain) => (
                <List.Item
                  actions={[<Button danger type="text" onClick={async () => {
                    try {
                      await deleteSupplyChainRule(chain.id);
                      message.success("Правило удалено");
                      void loadRules();
                    } catch { message.error("Ошибка"); }
                  }}>Удалить</Button>]}
                >
                  <List.Item.Meta
                    title={<Typography.Text strong>{chain.airport_code} ➝ {chain.carrier_code}</Typography.Text>}
                    description={`Все грузы в ${chain.airport_code} будут автоматически направляться на рейсы ${chain.carrier_code}`}
                  />
                </List.Item>
              )}
            />
          </Spin>
        </Card>

        {/* --- AIRLINES & BLANKS --- */}
        <Card
          className="settings-users-card"
          title="Авиакомпании и бланки AWB"
          bordered={false}
          extra={<Button type="primary" onClick={() => setAirlineModalOpen(true)}>Добавить авиакомпанию</Button>}
        >
          <Spin spinning={rulesLoading}>
            <List
              dataSource={airlines}
              renderItem={(airline) => (
                <List.Item
                  actions={[
                    <Button type="link" onClick={() => { setActiveAirlineId(airline.id); setRangeModalOpen(true); }}>Добавить бланки</Button>
                  ]}
                >
                  <List.Item.Meta
                    title={<Typography.Text strong>{airline.name} ({airline.carrier_code})</Typography.Text>}
                    description={
                      <Space direction="vertical" size={2}>
                        <Typography.Text type="secondary">Префикс AWB: {airline.awb_prefix}</Typography.Text>
                        {airline.ranges && airline.ranges.length > 0 ? (
                          airline.ranges.map(r => (
                            <Tag color={r.is_active ? "green" : "default"} key={r.id}>
                              Диапазон: {r.start_number} - {r.end_number} (Текущий: {r.current_number})
                            </Tag>
                          ))
                        ) : (
                          <Typography.Text type="danger">Нет активных бланков</Typography.Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Spin>
        </Card>

        {/* Modals for Rules */}
        <Modal title="Новое правило цепи поставок" open={chainModalOpen} onCancel={() => setChainModalOpen(false)} onOk={async () => {
          try {
            const vals = await chainForm.validateFields();
            await createSupplyChainRule(vals);
            message.success("Правило добавлено");
            setChainModalOpen(false);
            chainForm.resetFields();
            void loadRules();
          } catch(e) { console.error(e); }
        }}>
          <Form form={chainForm} layout="vertical">
            <Form.Item name="airport_code" label="Аэропорт назначения (Например: KJA)" rules={[{required: true}]}><Input /></Form.Item>
            <Form.Item name="carrier_code" label="Авиакомпания (Например: SU)" rules={[{required: true}]}><Input /></Form.Item>
          </Form>
        </Modal>

        <Modal title="Новая авиакомпания" open={airlineModalOpen} onCancel={() => setAirlineModalOpen(false)} onOk={async () => {
          try {
            const vals = await airlineForm.validateFields();
            await createAirline(vals);
            message.success("Авиакомпания добавлена");
            setAirlineModalOpen(false);
            airlineForm.resetFields();
            void loadRules();
          } catch(e) { message.error("Ошибка добавления"); }
        }}>
          <Form form={airlineForm} layout="vertical">
            <Form.Item name="carrier_code" label="Код IATA (Например: SU)" rules={[{required: true}]}><Input /></Form.Item>
            <Form.Item name="name" label="Название (Например: Аэрофлот)" rules={[{required: true}]}><Input /></Form.Item>
            <Form.Item name="awb_prefix" label="Префикс AWB (Например: 555)" rules={[{required: true}]}><Input /></Form.Item>
          </Form>
        </Modal>

        <Modal title="Добавить диапазон бланков" open={rangeModalOpen} onCancel={() => setRangeModalOpen(false)} onOk={async () => {
          if (!activeAirlineId) return;
          try {
            const vals = await rangeForm.validateFields();
            await createAwbRange(activeAirlineId, vals);
            message.success("Диапазон добавлен");
            setRangeModalOpen(false);
            rangeForm.resetFields();
            void loadRules();
          } catch(e) { message.error("Ошибка добавления бланков"); }
        }}>
          <Form form={rangeForm} layout="vertical">
            <Form.Item name="start_number" label="Начальный номер (7 цифр)" rules={[{required: true}]}><Input type="number" /></Form.Item>
            <Form.Item name="end_number" label="Конечный номер (7 цифр)" rules={[{required: true}]}><Input type="number" /></Form.Item>
          </Form>
        </Modal>

      </Space>
    </Spin>
  );
}
