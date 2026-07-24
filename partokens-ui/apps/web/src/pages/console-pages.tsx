import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Columns3,
  Copy,
  Eye,
  FileSearch,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  Trash2,
  X,
  WalletCards,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createToken,
  deleteToken,
  deleteTokens,
  getLogStats,
  getLogs,
  getPricing,
  getStatus,
  getQuotaData,
  getToken,
  getTokens,
  getTopupInfo,
  getUserGroups,
  getUserModels,
  revealToken,
  searchTokens,
  updateProfile,
  updateToken,
  updateTokenStatus,
  updateUserLanguage,
  updateUserSettings,
  type TokenInput,
  type QuotaDataPoint,
  type TokenSummary,
  type UsageLog,
  type UsageLogQuery,
  type UserSettingsInput,
} from "@partokens/api-client";
import { getCurrentNotice } from "@partokens/content";
import {
  isAppLocale,
  localeLabels,
  locales,
  type AppLocale,
} from "@partokens/i18n";

import { DataState, Metric, PageHeader } from "@/components/ui";
import { Modal } from "@/components/modal";
import {
  extractItems,
  formatDate,
  formatInteger,
  formatQuota,
  maskKey,
  maskTrace,
  quotaDollarsToUnits,
  quotaUnitsToDollars,
} from "@/lib/format";
import { useSessionStore } from "@/stores/session";

function usePageLocale() {
  const params = useParams({ strict: false }) as { locale?: string };
  return isAppLocale(params.locale) ? params.locale : "zh-CN";
}

function lastThirtyDays() {
  const end = Math.floor(Date.now() / 1000);
  return {
    start_timestamp: end - 30 * 86400,
    end_timestamp: end,
  };
}

export function OverviewPage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const { user } = useSessionStore();
  const tokens = useQuery({
    queryKey: ["tokens"],
    queryFn: () => getTokens(),
    retry: false,
  });
  const pricing = useQuery({
    queryKey: ["pricing"],
    queryFn: getPricing,
    retry: false,
  });
  const status = useQuery({
    queryKey: ["status"],
    queryFn: getStatus,
    retry: false,
  });
  const recentRange = useMemo(() => lastThirtyDays(), []);
  const recent = useQuery({
    queryKey: ["log-stats", "overview", recentRange],
    queryFn: () => getLogStats(recentRange),
    retry: false,
  });
  const tokenItems = extractItems<TokenSummary>(tokens.data?.data);
  const models = extractItems<Record<string, unknown>>(pricing.data?.data);
  const availableKeys = tokenItems.filter((token) => token.status === 1);
  const preferredKey = [...availableKeys].sort((left, right) => Number(right.accessed_time || 0) - Number(left.accessed_time || 0))[0];
  const keyReady = Boolean(preferredKey);
  const serviceReady = Boolean(status.data?.success);
  const serviceLabel = status.isLoading ? t("Awaiting status") : serviceReady ? t("Available") : t("Status unavailable");
  const apiBase = `${window.location.origin}/v1`;
  const notice = getCurrentNotice(locale);
  const steps = [
    {
      done: true,
      label: t("Account ready"),
      detail: user?.email || user?.username || "",
    },
    {
      done: keyReady,
      label: t("API key ready"),
      detail: keyReady
        ? `${preferredKey?.name} · ${availableKeys.length} ${t("available")}`
        : t("Create a scoped key"),
    },
    {
      done: Number(user?.request_count || 0) > 0,
      label: t("First request"),
      detail: Number(user?.request_count || 0) > 0 ? t("Usage recorded") : t("Send a compatible API request"),
    },
  ];

  return (
    <div className="console-page">
      <PageHeader
        eyebrow={t("Console overview")}
        title={`${t("Overview")}${user?.display_name ? `, ${user.display_name}` : ""}`}
        description={t("Account readiness, quota, and the next useful action in one view.")}
      />
      <section className="metric-strip">
        <Metric
          label={t("Account balance")}
          value={formatQuota(user?.quota, locale)}
          detail={t("Remaining")}
        />
        <Metric
          label={t("Total usage")}
          value={formatQuota(user?.used_quota, locale)}
          detail={t("Lifetime")}
        />
        <Metric
          label={t("Recent usage")}
          value={formatQuota(recent.data?.data.quota, locale)}
          detail={t("Last 30 days")}
        />
        <Metric
          label={t("Models")}
          value={formatInteger(models.length, locale)}
          detail={t("Currently listed")}
        />
      </section>
      <div className="overview-grid">
        <section className="panel setup-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{t("First request")}</span>
              <h2>{t("Connection checklist")}</h2>
            </div>
            <span>
              {steps.filter((item) => item.done).length}/{steps.length}
            </span>
          </div>
          <div className="setup-list">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className={step.done ? "setup-step complete" : "setup-step"}
              >
                <span>{step.done ? <Check size={15} /> : index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="panel-actions">
            <a
              className="button primary-button"
              href={`/${locale}/console/keys?create=1`}
            >
              <KeyRound size={16} />
              {t("Create a key")}
            </a>
            <a className="button secondary-button" href={`/${locale}/console/wallet`}><WalletCards size={16} />{t("Add balance")}</a>
            <a className="button secondary-button" href={`/${locale}/console/playground`}><Terminal size={16} />{t("Open Playground")}</a>
            <a className="button secondary-button" href={`/${locale}/console/usage-logs`}><FileSearch size={16} />{t("Inspect logs")}</a>
          </div>
        </section>
        <section className="panel endpoint-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{t("Endpoint")}</span>
              <h2>{t("OpenAI compatible")}</h2>
            </div>
            <span className={serviceReady ? "status-badge healthy" : "status-badge"}>
              <span className={serviceReady ? "status-dot healthy" : "status-dot pending"} />
              {serviceLabel}
            </span>
          </div>
          <code className="endpoint-value">{apiBase}</code>
          <pre className="compact-code">
            <code>
              curl /chat/completions{`\n`}Authorization: Bearer sk-...
            </code>
          </pre>
          <div className="endpoint-links"><a className="text-link" href={`/${locale}/models`}>{t("Review model pricing")}<ArrowRight size={14} /></a><a className="text-link" href={`/${locale}/docs`}>{t("Open quick start")}<ArrowRight size={14} /></a></div>
        </section>
        <section className="panel notice-summary">
          <span className="eyebrow">{t("Notice")} / {notice.version}</span>
          <h2>{notice.title}</h2>
          <p>{notice.body}</p>
        </section>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const [days, setDays] = useState(30);
  const range = useMemo(() => {
    const end = Math.floor(Date.now() / 1000);
    return {
      start_timestamp: end - days * 86400,
      end_timestamp: end,
      default_time: days <= 7 ? "hour" : "day",
    };
  }, [days]);
  const query = useQuery({
    queryKey: ["quota-data", days],
    queryFn: () => getQuotaData(range),
    retry: false,
  });
  const points = Array.isArray(query.data?.data) ? query.data.data : [];
  const summary = points.reduce<{
    quota: number;
    tokens: number;
    requests: number;
  }>(
    (acc, point) => ({
      quota: acc.quota + (point.quota || 0),
      tokens: acc.tokens + (point.token_used || 0),
      requests:
        acc.requests +
        (point.request_count || (point as { count?: number }).count || 0),
    }),
    { quota: 0, tokens: 0, requests: 0 },
  );
  const byModel = Object.entries(
    points.reduce<Record<string, number>>((acc, point) => {
      const key = point.model_name || "Other";
      acc[key] = (acc[key] || 0) + (point.quota || 0);
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const max = Math.max(...byModel.map(([, value]) => value), 1);
  return (
    <div className="console-page">
      <PageHeader
        eyebrow="CONSOLE / ANALYTICS"
        title={t("Analytics")}
        description="Inspect requests, tokens, and cost using backend usage aggregates."
        action={
          <div className="segmented-control">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                className={days === value ? "active" : ""}
                onClick={() => setDays(value)}
              >
                {value}D
              </button>
            ))}
          </div>
        }
      />
      <section className="metric-strip">
        <Metric label={t("Cost")} value={formatQuota(summary.quota, locale)} />
        <Metric label="Tokens" value={formatInteger(summary.tokens, locale)} />
        <Metric
          label={t("Requests")}
          value={formatInteger(summary.requests, locale)}
        />
        <Metric label="Models" value={formatInteger(byModel.length, locale)} />
      </section>
      <DataState
        loading={query.isLoading}
        error={query.isError ? t("Interface data unavailable") : null}
        empty={!query.isLoading && points.length === 0}
        onRetry={() => void query.refetch()}
      >
        <section className="analytics-grid">
          <div className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">DISTRIBUTION</span>
                <h2>Cost by model</h2>
              </div>
              <BarChart3 size={18} />
            </div>
            <div className="bar-chart">
              {byModel.map(([name, value]) => (
                <div className="bar-row" key={name}>
                  <span title={name}>{name}</span>
                  <div>
                    <i
                      style={{ width: `${Math.max((value / max) * 100, 2)}%` }}
                    />
                  </div>
                  <strong>{formatQuota(value, locale)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="panel data-table-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">ACCESSIBLE DATA</span>
                <h2>Model totals</h2>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>{t("Model")}</th>
                  <th>{t("Cost")}</th>
                </tr>
              </thead>
              <tbody>
                {byModel.map(([name, value]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td>{formatQuota(value, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </DataState>
    </div>
  );
}

type KeyEditorState = {
  name: string;
  quota: number;
  unlimited: boolean;
  expiresAt: string;
  group: string;
  crossGroupRetry: boolean;
  models: string[];
  allowIps: string;
  enabled: boolean;
};

function toDateTimeInput(timestamp?: number) {
  if (!timestamp || timestamp < 0) return "";
  const date = new Date(timestamp * 1000);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeInput(value: string) {
  return value ? Math.floor(new Date(value).getTime() / 1000) : -1;
}

function keyEditorDefaults(token?: TokenSummary | null): KeyEditorState {
  return {
    name: token?.name || "",
    quota: quotaUnitsToDollars(token?.remain_quota),
    unlimited: token?.unlimited_quota ?? false,
    expiresAt: toDateTimeInput(token?.expired_time),
    group: token?.group || "default",
    crossGroupRetry: token?.cross_group_retry ?? false,
    models: token?.model_limits
      ? token.model_limits.split(",").filter(Boolean)
      : [],
    allowIps: token?.allow_ips || "",
    enabled: token?.status !== 2,
  };
}

function extractStringList(input: unknown): string[] {
  if (Array.isArray(input)) return input.filter((item): item is string => typeof item === "string");
  return [];
}

function extractGroupNames(input: unknown): string[] {
  if (Array.isArray(input)) return extractStringList(input);
  if (input && typeof input === "object") return Object.keys(input);
  return [];
}

function KeyEditor({
  token,
  onClose,
  onSaved,
}: {
  token: TokenSummary | null;
  onClose: () => void;
  onSaved: (saved?: TokenSummary, created?: boolean) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<KeyEditorState>(() => keyEditorDefaults(token));
  const detail = useQuery({
    queryKey: ["token", token?.id],
    queryFn: () => getToken(token!.id),
    enabled: token != null,
    retry: false,
  });
  const modelsQuery = useQuery({
    queryKey: ["user-models", form.group],
    queryFn: () => getUserModels(form.group),
    retry: false,
  });
  const groupsQuery = useQuery({
    queryKey: ["user-groups"],
    queryFn: getUserGroups,
    retry: false,
  });
  const models = extractStringList(modelsQuery.data?.data);
  const groups = extractGroupNames(groupsQuery.data?.data);
  const groupOptions = groups.includes(form.group) ? groups : [form.group, ...groups];

  useEffect(() => {
    const source = detail.data?.data || token;
    setForm(keyEditorDefaults(source));
  }, [detail.data?.data, token]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: TokenInput = {
        name: form.name.trim(),
        remain_quota: form.unlimited ? 0 : quotaDollarsToUnits(form.quota),
        expired_time: fromDateTimeInput(form.expiresAt),
        unlimited_quota: form.unlimited,
        model_limits_enabled: form.models.length > 0,
        model_limits: form.models.join(","),
        allow_ips: form.allowIps.trim(),
        group: form.group,
        cross_group_retry: form.group === "auto" && form.crossGroupRetry,
      };
      if (!payload.name) throw new Error(t("Name is required"));
      const response = token
        ? await updateToken({ ...payload, id: token.id })
        : await createToken(payload);
      if (!response.success) throw new Error(response.message || t("Unable to save key"));
      const id = token?.id || response.data?.id;
      const currentEnabled = token?.status === 1;
      if (id && (token ? currentEnabled !== form.enabled : !form.enabled)) {
        const statusResponse = await updateTokenStatus(id, form.enabled ? 1 : 2);
        if (!statusResponse.success) {
          throw new Error(statusResponse.message || t("Unable to update key status"));
        }
      }
      return response;
    },
    onSuccess: (response) => onSaved(response.data, token == null),
  });

  const update = <K extends keyof KeyEditorState>(key: K, value: KeyEditorState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal
      backdropClassName="drawer-backdrop"
      className="side-drawer key-editor"
      label={token ? t("Edit API key") : t("Create a key")}
      onClose={onClose}
    >
        <header className="drawer-header">
          <div>
            <span className="eyebrow">{token ? t("Edit credential") : t("New credential")}</span>
            <h2>{token ? t("Edit API key") : t("Create a key")}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("Close")}>
            <X size={18} />
          </button>
        </header>
        <form
          className="drawer-form"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <section className="form-section">
            <div className="form-section-heading">
              <KeyRound size={17} />
              <div><strong>{t("Basic settings")}</strong><small>{t("Identity, group, status, and expiry")}</small></div>
            </div>
            <label>
              <span>{t("Name")}</span>
              <input data-modal-initial-focus value={form.name} onChange={(event) => update("name", event.target.value)} required />
            </label>
            <div className="form-grid-two">
              <label>
                <span>{t("Group")}</span>
                <select value={form.group} onChange={(event) => update("group", event.target.value)}>
                  {groupOptions.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </label>
              <label>
                <span>{t("Expiration")}</span>
                <input type="datetime-local" value={form.expiresAt} onChange={(event) => update("expiresAt", event.target.value)} />
              </label>
            </div>
            <label className="switch-row">
              <span><strong>{t("Enabled")}</strong><small>{t("Allow this credential to make requests")}</small></span>
              <input type="checkbox" checked={form.enabled} onChange={(event) => update("enabled", event.target.checked)} />
            </label>
            {form.group === "auto" ? (
              <label className="switch-row">
                <span><strong>{t("Cross-group retry")}</strong><small>{t("Try the next group when the current group fails")}</small></span>
                <input type="checkbox" checked={form.crossGroupRetry} onChange={(event) => update("crossGroupRetry", event.target.checked)} />
              </label>
            ) : null}
          </section>
          <section className="form-section">
            <div className="form-section-heading">
              <WalletCards size={17} />
              <div><strong>{t("Quota settings")}</strong><small>{t("Finite quota is the safer default")}</small></div>
            </div>
            <label className="switch-row">
              <span><strong>{t("Unlimited quota")}</strong><small>{t("Remove the spending limit for this key")}</small></span>
              <input type="checkbox" checked={form.unlimited} onChange={(event) => update("unlimited", event.target.checked)} />
            </label>
            {!form.unlimited ? (
              <label>
                <span>{t("Quota in USD")}</span>
                <input type="number" min="0" step="0.01" value={form.quota} onChange={(event) => update("quota", Number(event.target.value))} required />
              </label>
            ) : null}
          </section>
          <section className="form-section">
            <div className="form-section-heading">
              <Settings2 size={17} />
              <div><strong>{t("Access restrictions")}</strong><small>{t("Limit models and source addresses")}</small></div>
            </div>
            <div className="field-label-row">
              <span>{t("Allowed models")}</span>
              <button type="button" className="text-button" onClick={() => update("models", [])}>{t("Allow all")}</button>
            </div>
            <div className="model-checklist">
              {models.length ? models.map((model) => (
                <label key={model}>
                  <input
                    type="checkbox"
                    checked={form.models.includes(model)}
                    onChange={(event) => update("models", event.target.checked ? [...form.models, model] : form.models.filter((item) => item !== model))}
                  />
                  <span>{model}</span>
                </label>
              )) : <span className="field-help">{t("No model restrictions available")}</span>}
            </div>
            <label>
              <span>{t("IP allowlist")}</span>
              <textarea rows={4} value={form.allowIps} onChange={(event) => update("allowIps", event.target.value)} placeholder={t("One IP or CIDR per line; leave empty to allow all")} />
            </label>
          </section>
          {save.error ? <div className="form-error">{save.error.message}</div> : null}
          <footer className="drawer-actions">
            <button type="button" className="button secondary-button" onClick={onClose}>{t("Cancel")}</button>
            <button className="button primary-button" disabled={save.isPending || detail.isLoading}>
              <Check size={16} />{save.isPending ? t("Saving") : t("Save changes")}
            </button>
          </footer>
        </form>
    </Modal>
  );
}

type KeyColumn = "status" | "key" | "quota" | "group" | "lastUsed";

const defaultKeyColumns: KeyColumn[] = ["status", "key", "quota", "group", "lastUsed"];

function loadKeyColumns(): KeyColumn[] {
  try {
    const value = JSON.parse(window.localStorage.getItem("partokens-key-columns") || "[]");
    return Array.isArray(value) && value.length ? value.filter((item): item is KeyColumn => defaultKeyColumns.includes(item)) : defaultKeyColumns;
  } catch {
    return defaultKeyColumns;
  }
}

async function getFilteredKeys(keyword: string, status: number | null, page: number, pageSize: number) {
  const request = (nextPage: number, size: number) => keyword
    ? searchTokens({ keyword, p: nextPage, size })
    : getTokens({ p: nextPage, size });
  if (status == null) return request(page, pageSize);
  const first = await request(1, 100);
  const all = extractItems<TokenSummary>(first.data);
  const total = Number(first.data?.total || all.length);
  const pages = Math.min(Math.ceil(total / 100), 20);
  for (let nextPage = 2; nextPage <= pages; nextPage += 1) {
    const response = await request(nextPage, 100);
    all.push(...extractItems<TokenSummary>(response.data));
  }
  const filtered = all.filter((item) => item.status === status);
  return {
    ...first,
    data: {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      page_size: pageSize,
    },
  };
}

export function KeysPage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<TokenSummary | null | undefined>(undefined);
  const [revealTarget, setRevealTarget] = useState<TokenSummary | null>(null);
  const [setupTarget, setSetupTarget] = useState<TokenSummary | null>(null);
  const [revealedKey, setRevealedKey] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [columns, setColumns] = useState<KeyColumn[]>(loadKeyColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const createRequested = useLocation({ select: (state) => new URLSearchParams(state.searchStr).get("create") === "1" });
  const pageSize = 20;

  useEffect(() => {
    const timer = window.setTimeout(() => { setKeyword(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => window.localStorage.setItem("partokens-key-columns", JSON.stringify(columns)), [columns]);
  useEffect(() => { if (createRequested) setEditing(null); }, [createRequested]);

  const query = useQuery({
    queryKey: ["tokens", keyword, status, page],
    queryFn: () => getFilteredKeys(keyword, status, page, pageSize),
    retry: false,
  });
  const items = extractItems<TokenSummary>(query.data?.data);
  const total = Number(query.data?.data.total || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const refresh = () => { setSelectedIds([]); void client.invalidateQueries({ queryKey: ["tokens"] }); };
  const toggle = useMutation({ mutationFn: ({ id, status: nextStatus }: { id: number; status: number }) => updateTokenStatus(id, nextStatus), onSuccess: refresh });
  const remove = useMutation({ mutationFn: deleteToken, onSuccess: refresh });
  const batchRemove = useMutation({ mutationFn: deleteTokens, onSuccess: refresh });
  const reveal = useMutation({
    mutationFn: async (id: number) => {
      const response = await revealToken(id);
      if (!response.success || !response.data?.key) throw new Error(response.message || t("Unable to reveal key"));
      return response.data.key;
    },
    onSuccess: setRevealedKey,
  });
  const clearSecret = () => { setRevealedKey(""); reveal.reset(); };
  const closeReveal = () => { setRevealTarget(null); clearSecret(); };
  const closeSetup = () => { setSetupTarget(null); clearSecret(); };
  const visible = (column: KeyColumn) => columns.includes(column);
  const toggleColumn = (column: KeyColumn) => setColumns((current) => current.includes(column) ? current.filter((item) => item !== column) : [...current, column]);
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const setupKey = revealedKey || "sk-your-key";
  const snippets: Array<[string, string]> = [
    ["ENV", `export OPENAI_API_KEY=\"${setupKey}\"\nexport OPENAI_BASE_URL=\"https://partokens.com/v1\"`],
    ["CURL", `curl https://partokens.com/v1/chat/completions \\\n  -H \"Authorization: Bearer ${setupKey}\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"model\":\"gpt-4.1-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'`],
    ["SDK", `const client = new OpenAI({\n  apiKey: \"${setupKey}\",\n  baseURL: \"https://partokens.com/v1\"\n});`],
  ];

  return (
    <div className="console-page">
      <PageHeader eyebrow={t("Console credentials")} title={t("API keys")} description={t("Create and inspect scoped credentials. Full keys are never shown by default.")} action={<button className="button primary-button" onClick={() => setEditing(null)}><Plus size={16} />{t("Create a key")}</button>} />
      <div className="filter-bar key-filter-bar">
        <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Search keys")} /></label>
        <select value={status == null ? "all" : String(status)} onChange={(event) => { setStatus(event.target.value === "all" ? null : Number(event.target.value)); setPage(1); }}><option value="all">{t("All statuses")}</option><option value="1">{t("Enabled")}</option><option value="2">{t("Disabled")}</option></select>
        <div className="column-picker"><button className="button icon-text-button" onClick={() => setColumnsOpen((value) => !value)}><Columns3 size={16} />{t("Columns")}</button>{columnsOpen ? <div className="column-menu">{defaultKeyColumns.map((column) => <label key={column}><input type="checkbox" checked={visible(column)} onChange={() => toggleColumn(column)} />{t(column === "lastUsed" ? "Last used" : column === "key" ? "Key" : column[0]!.toUpperCase() + column.slice(1))}</label>)}</div> : null}</div>
        <button className="button icon-text-button" onClick={() => void query.refetch()}><RefreshCw size={16} />{t("Refresh")}</button>
      </div>
      {selectedIds.length ? <div className="batch-bar"><span>{t("Selected")}: {selectedIds.length}</span><button className="button secondary-button danger-text" disabled={batchRemove.isPending} onClick={() => { if (window.confirm(t("Delete selected keys?"))) batchRemove.mutate(selectedIds); }}><Trash2 size={15} />{t("Delete selected")}</button></div> : null}
      <DataState loading={query.isLoading} error={query.isError ? t("Interface data unavailable") : null} empty={!query.isLoading && items.length === 0} onRetry={() => void query.refetch()}>
        <div className="responsive-table"><table><thead><tr><th className="selection-cell"><input type="checkbox" aria-label={t("Select page")} checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.id) : [])} /></th><th>{t("Name")}</th>{visible("status") ? <th>{t("Status")}</th> : null}{visible("key") ? <th>{t("Key")}</th> : null}{visible("quota") ? <th>{t("Quota")}</th> : null}{visible("group") ? <th>{t("Group")}</th> : null}{visible("lastUsed") ? <th>{t("Last used")}</th> : null}<th><span className="sr-only">{t("Actions")}</span></th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td className="selection-cell"><input type="checkbox" aria-label={`${t("Select")} ${item.name}`} checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /></td><td><strong>{item.name}</strong></td>{visible("status") ? <td><span className={item.status === 1 ? "status-badge healthy" : "status-badge"}>{item.status === 1 ? t("Enabled") : t("Disabled")}</span></td> : null}{visible("key") ? <td><code>{maskKey(item.key)}</code></td> : null}{visible("quota") ? <td>{item.unlimited_quota ? t("Unlimited") : formatQuota(item.remain_quota, locale)}</td> : null}{visible("group") ? <td>{item.group || "default"}</td> : null}{visible("lastUsed") ? <td>{formatDate(item.accessed_time, locale)}</td> : null}<td><div className="table-actions"><button onClick={() => setEditing(item)}><Pencil size={12} />{t("Edit")}</button><button onClick={() => { clearSecret(); setRevealTarget(item); }}><Eye size={12} />{t("Reveal")}</button><button disabled={toggle.isPending} onClick={() => toggle.mutate({ id: item.id, status: item.status === 1 ? 2 : 1 })}>{item.status === 1 ? t("Disable") : t("Enable")}</button><button className="danger-text" disabled={remove.isPending} onClick={() => { if (window.confirm(t("Delete this key?"))) remove.mutate(item.id); }}>{t("Delete")}</button></div></td></tr>)}</tbody></table></div>
        <div className="pagination-bar"><span>{t("Page")} {page} / {totalPages} · {total} {t("records")}</span><div><button className="button secondary-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t("Previous")}</button><button className="button secondary-button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>{t("Next")}</button></div></div>
      </DataState>
      {editing !== undefined ? <KeyEditor token={editing} onClose={() => setEditing(undefined)} onSaved={(saved, created) => { setEditing(undefined); refresh(); if (created && saved) { clearSecret(); setSetupTarget(saved); } }} /> : null}
      {revealTarget ? <Modal className="dialog reveal-dialog" label={revealedKey ? t("Key revealed") : t("Reveal full key?")} onClose={closeReveal}><span className="eyebrow">{t("Sensitive credential")}</span><h2>{revealedKey ? t("Key revealed") : t("Reveal full key?")}</h2>{revealedKey ? <><div className="secret-value"><code>{revealedKey}</code><button className="icon-button" aria-label={t("Copy")} onClick={() => void navigator.clipboard.writeText(revealedKey)}><Copy size={16} /></button></div><p>{t("Close this window when you have stored the key securely.")}</p></> : <p>{t("Anyone with this value can use your quota. Confirm that nobody else can see your screen.")}</p>}{reveal.error ? <div className="form-error">{reveal.error.message}</div> : null}<div className="dialog-actions"><button className="button secondary-button" onClick={closeReveal}>{t("Close")}</button>{!revealedKey ? <button className="button primary-button" disabled={reveal.isPending} onClick={() => reveal.mutate(revealTarget.id)}><Eye size={16} />{reveal.isPending ? t("Loading") : t("Confirm reveal")}</button> : null}</div></Modal> : null}
      {setupTarget ? <Modal className="dialog key-setup-dialog" label={t("Configure your new key")} onClose={closeSetup}><span className="eyebrow">{t("Configure credential")}</span><h2>{t("Configure your new key")}</h2><p>{t("Use the OpenAI-compatible endpoint in your CLI or SDK. The full key is never stored in this browser.")}</p><div className="setup-snippets">{snippets.map(([label, snippet]) => <div key={label}><span>{label}</span><pre><code>{snippet}</code></pre><button className="icon-button" aria-label={`${t("Copy")} ${label}`} onClick={() => void navigator.clipboard.writeText(snippet)}><Copy size={15} /></button></div>)}</div>{reveal.error ? <div className="form-error">{reveal.error.message}</div> : null}<div className="dialog-actions"><button className="button secondary-button" onClick={closeSetup}>{t("Done")}</button>{!revealedKey ? <button className="button primary-button" disabled={reveal.isPending} onClick={() => reveal.mutate(setupTarget.id)}><Terminal size={16} />{reveal.isPending ? t("Loading") : t("Reveal for setup")}</button> : null}</div></Modal> : null}
    </div>
  );
}

const logTypes = [
  [0, "All types"], [1, "Top-up"], [2, "Usage"], [3, "Management"],
  [4, "System"], [5, "Error"], [6, "Refund"], [7, "Login"],
] as const;

type LogFilterState = {
  type: number;
  model: string;
  token: string;
  group: string;
  requestId: string;
  start: string;
  end: string;
};

function defaultLogFilters(): LogFilterState {
  const end = Math.floor(Date.now() / 1000);
  return { type: 0, model: "", token: "", group: "", requestId: "", start: toDateTimeInput(end - 7 * 86400), end: toDateTimeInput(end) };
}

function getLogTypeLabel(type?: number) {
  return logTypes.find(([value]) => value === type)?.[1] || `Event ${type ?? ""}`;
}

function redactLogText(value?: string) {
  if (!value) return "—";
  return value.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-[redacted]").replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

type SafeLogMetadata = {
  billingMode?: string;
  matchedTier?: string;
  modelRatio?: number;
  modelPrice?: number;
  completionRatio?: number;
  groupRatio?: number;
  cacheRatio?: number;
  streamStatus?: { status?: string; endReason?: string; errorCount?: number; endError?: string; errors: string[] };
  mediaUrls: string[];
};

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function safeText(value: unknown, limit = 180) {
  return typeof value === "string" ? redactLogText(value).slice(0, limit) : undefined;
}

function safeMediaUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseSafeLogMetadata(value?: string): SafeLogMetadata {
  const result: SafeLogMetadata = { mediaUrls: [] };
  if (!value) return result;
  try {
    const input = JSON.parse(value) as Record<string, unknown>;
    if (!input || typeof input !== "object" || Array.isArray(input)) return result;
    result.billingMode = safeText(input.billing_mode, 40);
    result.matchedTier = safeText(input.matched_tier, 80);
    result.modelRatio = safeNumber(input.model_ratio);
    result.modelPrice = safeNumber(input.model_price);
    result.completionRatio = safeNumber(input.completion_ratio);
    const userRatio = safeNumber(input.user_group_ratio);
    result.groupRatio = userRatio != null && userRatio !== -1 ? userRatio : safeNumber(input.group_ratio);
    result.cacheRatio = safeNumber(input.cache_ratio);
    if (input.stream_status && typeof input.stream_status === "object" && !Array.isArray(input.stream_status)) {
      const stream = input.stream_status as Record<string, unknown>;
      result.streamStatus = {
        status: safeText(stream.status, 40),
        endReason: safeText(stream.end_reason, 100),
        errorCount: safeNumber(stream.error_count),
        endError: safeText(stream.end_error),
        errors: Array.isArray(stream.errors) ? stream.errors.map((item) => safeText(item)).filter((item): item is string => Boolean(item)).slice(0, 5) : [],
      };
    }
    for (const key of ["image_url", "audio_url", "video_url", "output_url"]) {
      const url = safeMediaUrl(input[key]);
      if (url) result.mediaUrls.push(url);
    }
    if (Array.isArray(input.media_urls)) {
      for (const value of input.media_urls.slice(0, 8)) {
        const url = safeMediaUrl(value);
        if (url) result.mediaUrls.push(url);
      }
    }
    result.mediaUrls = [...new Set(result.mediaUrls)];
  } catch {
    return result;
  }
  return result;
}

export function UsageLogsPage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const [filters, setFilters] = useState<LogFilterState>(defaultLogFilters);
  const [applied, setApplied] = useState<LogFilterState>(defaultLogFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UsageLog | null>(null);
  const params = useMemo<UsageLogQuery>(() => ({
    p: page,
    page_size: 30,
    ...(applied.type ? { type: applied.type } : {}),
    ...(applied.model.trim() ? { model_name: applied.model.trim() } : {}),
    ...(applied.token.trim() ? { token_name: applied.token.trim() } : {}),
    ...(applied.group.trim() ? { group: applied.group.trim() } : {}),
    ...(applied.requestId.trim() ? { request_id: applied.requestId.trim() } : {}),
    ...(applied.start ? { start_timestamp: fromDateTimeInput(applied.start) } : {}),
    ...(applied.end ? { end_timestamp: fromDateTimeInput(applied.end) } : {}),
  }), [applied, page]);
  const query = useQuery({ queryKey: ["logs", params], queryFn: () => getLogs(params), retry: false });
  const statParams = useMemo(() => {
    const { p: _p, page_size: _pageSize, ...rest } = params;
    return rest;
  }, [params]);
  const stats = useQuery({ queryKey: ["log-stats", statParams], queryFn: () => getLogStats(statParams), retry: false });
  const items = extractItems<UsageLog>(query.data?.data);
  const pageData = query.data?.data;
  const total = pageData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / (pageData?.page_size || 30)));
  const updateFilter = <K extends keyof LogFilterState>(key: K, value: LogFilterState[K]) => setFilters((current) => ({ ...current, [key]: value }));
  const applyFilters = (event: FormEvent) => { event.preventDefault(); setPage(1); setApplied(filters); };
  const clearFilters = () => { const next = defaultLogFilters(); setFilters(next); setApplied(next); setPage(1); };
  const stat = stats.data?.data;
  const selectedMetadata = selected ? parseSafeLogMetadata(selected.other) : null;

  return (
    <div className="console-page">
      <PageHeader eyebrow={t("Console requests")} title={t("Usage logs")} description={t("Trace model calls, billing, latency, and account events.")} />
      <section className="metric-strip log-metrics">
        <Metric label={t("Filtered cost")} value={formatQuota(stat?.quota, locale)} />
        <Metric label="RPM" value={formatInteger(stat?.rpm, locale)} />
        <Metric label="TPM" value={formatInteger(stat?.tpm, locale)} />
        <Metric label={t("Records")} value={formatInteger(total, locale)} />
      </section>
      <form className="log-filter-panel" onSubmit={applyFilters}>
        <div className="filter-panel-title"><SlidersHorizontal size={16} /><strong>{t("Filters")}</strong></div>
        <div className="log-filter-grid">
          <label><span>{t("Type")}</span><select value={filters.type} onChange={(event) => updateFilter("type", Number(event.target.value))}>{logTypes.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
          <label><span>{t("Model")}</span><input value={filters.model} onChange={(event) => updateFilter("model", event.target.value)} /></label>
          <label><span>{t("Key name")}</span><input value={filters.token} onChange={(event) => updateFilter("token", event.target.value)} /></label>
          <label><span>{t("Group")}</span><input value={filters.group} onChange={(event) => updateFilter("group", event.target.value)} /></label>
          <label><span>{t("Request ID")}</span><input value={filters.requestId} onChange={(event) => updateFilter("requestId", event.target.value)} /></label>
          <label><span>{t("From")}</span><input type="datetime-local" value={filters.start} onChange={(event) => updateFilter("start", event.target.value)} /></label>
          <label><span>{t("To")}</span><input type="datetime-local" value={filters.end} onChange={(event) => updateFilter("end", event.target.value)} /></label>
        </div>
        <div className="filter-panel-actions"><button type="button" className="button secondary-button" onClick={clearFilters}>{t("Reset")}</button><button className="button primary-button"><Search size={15} />{t("Apply filters")}</button><button type="button" className="icon-button" aria-label={t("Refresh")} onClick={() => { void query.refetch(); void stats.refetch(); }}><RefreshCw size={16} /></button></div>
      </form>
      <DataState loading={query.isLoading} error={query.isError ? t("Interface data unavailable") : null} empty={!query.isLoading && items.length === 0} onRetry={() => void query.refetch()}>
        <div className="responsive-table log-desktop-table">
          <table>
            <thead><tr><th>{t("Time")}</th><th>{t("Type")}</th><th>{t("Key name")}</th><th>{t("Model")}</th><th>{t("Tokens")}</th><th>{t("Cost")}</th><th>{t("Latency")}</th><th><span className="sr-only">{t("Details")}</span></th></tr></thead>
            <tbody>{items.map((item, index) => (
              <tr key={item.id || index}>
                <td>{formatDate(item.created_at, locale)}</td><td><span className={`status-badge log-type-${item.type || 0}`}>{t(getLogTypeLabel(item.type))}</span></td><td>{item.token_name || "—"}</td><td><strong>{item.model_name || "—"}</strong></td><td>{formatInteger((item.prompt_tokens || 0) + (item.completion_tokens || 0), locale)}</td><td>{formatQuota(item.quota, locale)}</td><td>{item.use_time != null ? `${item.use_time}s` : "—"}</td><td><button className="icon-button" aria-label={t("View details")} onClick={() => setSelected(item)}><FileSearch size={15} /></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="log-mobile-list">{items.map((item, index) => <article key={item.id || index}><header><span className={`status-badge log-type-${item.type || 0}`}>{t(getLogTypeLabel(item.type))}</span><time>{formatDate(item.created_at, locale)}</time></header><strong>{item.model_name || t("Account event")}</strong><dl><div><dt>{t("Key name")}</dt><dd>{item.token_name || "—"}</dd></div><div><dt>{t("Tokens")}</dt><dd>{formatInteger((item.prompt_tokens || 0) + (item.completion_tokens || 0), locale)}</dd></div><div><dt>{t("Cost")}</dt><dd>{formatQuota(item.quota, locale)}</dd></div><div><dt>{t("Latency")}</dt><dd>{item.use_time != null ? `${item.use_time}s` : "—"}</dd></div></dl><button className="button secondary-button" onClick={() => setSelected(item)}><FileSearch size={15} />{t("View details")}</button></article>)}</div>
        <div className="pagination-bar"><span>{t("Page")} {page} / {totalPages}</span><div><button className="button secondary-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>{t("Previous")}</button><button className="button secondary-button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>{t("Next")}</button></div></div>
      </DataState>
      {selected ? (
        <Modal backdropClassName="drawer-backdrop" className="side-drawer log-drawer" label={t("Log details")} onClose={() => setSelected(null)}>
            <header className="drawer-header"><div><span className="eyebrow">{t("Request trace")}</span><h2>{t("Log details")}</h2></div><button className="icon-button" aria-label={t("Close")} onClick={() => setSelected(null)}><X size={18} /></button></header>
            <div className="drawer-body">
              <dl className="detail-grid">
                <div><dt>{t("Time")}</dt><dd>{formatDate(selected.created_at, locale)}</dd></div><div><dt>{t("Type")}</dt><dd>{t(getLogTypeLabel(selected.type))}</dd></div><div><dt>{t("Model")}</dt><dd>{selected.model_name || "—"}</dd></div><div><dt>{t("Key name")}</dt><dd>{selected.token_name || "—"}</dd></div><div><dt>{t("Group")}</dt><dd>{selected.group || "—"}</dd></div><div><dt>{t("Streaming")}</dt><dd>{selected.is_stream ? t("Yes") : t("No")}</dd></div><div><dt>{t("Prompt tokens")}</dt><dd>{formatInteger(selected.prompt_tokens, locale)}</dd></div><div><dt>{t("Completion tokens")}</dt><dd>{formatInteger(selected.completion_tokens, locale)}</dd></div><div><dt>{t("Cost")}</dt><dd>{formatQuota(selected.quota, locale)}</dd></div><div><dt>{t("Latency")}</dt><dd>{selected.use_time != null ? `${selected.use_time}s` : "—"}</dd></div>
              </dl>
              <section className="trace-section"><span>{t("Request ID")}</span><code>{maskTrace(selected.request_id)}</code></section>
              {selected.upstream_request_id ? <section className="trace-section"><span>{t("Upstream request ID")}</span><code>{maskTrace(selected.upstream_request_id)}</code></section> : null}
              <section className="log-content-section"><span>{t("Details")}</span><p>{redactLogText(selected.content)}</p></section>
              {selectedMetadata && (selectedMetadata.billingMode || selectedMetadata.modelRatio != null || selectedMetadata.modelPrice != null || selectedMetadata.groupRatio != null) ? <section className="metadata-section"><span>{t("Billing calculation")}</span><dl className="detail-grid"><div><dt>{t("Billing mode")}</dt><dd>{selectedMetadata.billingMode || (selectedMetadata.modelPrice != null ? t("Per call") : t("Token based"))}</dd></div>{selectedMetadata.matchedTier ? <div><dt>{t("Matched tier")}</dt><dd>{selectedMetadata.matchedTier}</dd></div> : null}{selectedMetadata.modelPrice != null ? <div><dt>{t("Model price")}</dt><dd>${selectedMetadata.modelPrice}</dd></div> : null}{selectedMetadata.modelRatio != null ? <div><dt>{t("Model ratio")}</dt><dd>{selectedMetadata.modelRatio}x</dd></div> : null}{selectedMetadata.completionRatio != null ? <div><dt>{t("Completion ratio")}</dt><dd>{selectedMetadata.completionRatio}x</dd></div> : null}{selectedMetadata.groupRatio != null ? <div><dt>{t("Group ratio")}</dt><dd>{selectedMetadata.groupRatio}x</dd></div> : null}{selectedMetadata.cacheRatio != null ? <div><dt>{t("Cache ratio")}</dt><dd>{selectedMetadata.cacheRatio}x</dd></div> : null}</dl></section> : null}
              {selectedMetadata?.streamStatus ? <section className="metadata-section"><span>{t("Stream result")}</span><dl className="detail-grid"><div><dt>{t("Status")}</dt><dd>{selectedMetadata.streamStatus.status || "—"}</dd></div><div><dt>{t("End reason")}</dt><dd>{selectedMetadata.streamStatus.endReason || "—"}</dd></div><div><dt>{t("Error count")}</dt><dd>{selectedMetadata.streamStatus.errorCount ?? 0}</dd></div>{selectedMetadata.streamStatus.endError ? <div><dt>{t("End error")}</dt><dd>{selectedMetadata.streamStatus.endError}</dd></div> : null}</dl>{selectedMetadata.streamStatus.errors.length ? <pre className="safe-error-list">{selectedMetadata.streamStatus.errors.join("\n")}</pre> : null}</section> : null}
              {selectedMetadata?.mediaUrls.length ? <section className="metadata-section"><span>{t("Generated media")}</span><div className="media-link-list">{selectedMetadata.mediaUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer">{t("Open media")} {index + 1}<ArrowRight size={13} /></a>)}</div></section> : null}
            </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function WalletPage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const { user } = useSessionStore();
  const [selected, setSelected] = useState<number | null>(null);
  const query = useQuery({
    queryKey: ["topup-info"],
    queryFn: getTopupInfo,
    retry: false,
  });
  const info = query.data?.data;
  const options = info?.amount_options || [];
  const safeSelected =
    selected != null && options.includes(selected) ? selected : null;
  const discount =
    safeSelected == null ? null : info?.discount[String(safeSelected)];
  return (
    <div className="console-page">
      <PageHeader
        eyebrow="CONSOLE / BILLING"
        title={t("Wallet")}
        description={t("Balance, fixed-value top-up options, and enabled billing capabilities.")}
      />
      <section className="wallet-balance">
        <div>
          <span>{t("Account balance")}</span>
          <strong>{formatQuota(user?.quota, locale)}</strong>
          <small>
            {t("Total usage")}: {formatQuota(user?.used_quota, locale)}
          </small>
        </div>
        <WalletCards size={34} />
      </section>
      <DataState
        loading={query.isLoading}
        error={query.isError ? t("Interface data unavailable") : null}
        onRetry={() => void query.refetch()}
      >
        <div className="wallet-grid">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">TOP UP</span>
                <h2>{t("Preset amounts")}</h2>
              </div>
              <CircleDollarSign size={19} />
            </div>
            {options.length ? (
              <div className="amount-options">
                {options.map((amount) => (
                  <button
                    key={amount}
                    className={safeSelected === amount ? "active" : ""}
                    onClick={() => setSelected(amount)}
                  >
                    <strong>${amount}</strong>
                    {info?.discount[String(amount)] != null ? (
                      <small>
                        {Math.round((1 - info.discount[String(amount)]!) * 100)}
                        % off
                      </small>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="data-state">
                {t("No preset amounts configured")}
              </div>
            )}
            <div className="payment-summary">
              <span>Selected</span>
              <strong>{safeSelected == null ? "—" : `$${safeSelected}`}</strong>
              {discount != null ? (
                <small>Discount multiplier: {discount}</small>
              ) : null}
            </div>
            <button className="button primary-button" disabled>
              {t("Continue to payment")}
            </button>
            <p className="field-help">
              Payment submission is intentionally disabled in the phase-one
              preview. Only server-provided amounts are accepted.
            </p>
          </section>
          <section className="panel wallet-capabilities">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">CAPABILITIES</span>
                <h2>{t("Available methods")}</h2>
              </div>
            </div>
            {[
              ["Online top-up", info?.enable_online_topup],
              ["Stripe", info?.enable_stripe_topup],
              ["Creem", info?.enable_creem_topup],
              ["Waffo", info?.enable_waffo_topup],
              ["Redemption", info?.enable_redemption],
            ].map(([name, enabled]) => (
              <div key={String(name)}>
                <span>{name}</span>
                <strong className={enabled ? "available-text" : ""}>
                  {enabled ? "Available" : "Unavailable"}
                </strong>
              </div>
            ))}
          </section>
        </div>
      </DataState>
    </div>
  );
}

type ParsedUserSettings = UserSettingsInput & { language?: string };

function parseUserSettings(value?: string): ParsedUserSettings {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as ParsedUserSettings : {};
  } catch {
    return {};
  }
}

export function ProfilePage() {
  const { t } = useTranslation();
  const locale = usePageLocale();
  const { user, setUser, signOut } = useSessionStore();
  const storedSettings = useMemo(() => parseUserSettings(user?.setting || user?.settings), [user?.setting, user?.settings]);
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [language, setLanguage] = useState<AppLocale>(isAppLocale(storedSettings.language) ? storedSettings.language : locale);
  const [notifyType, setNotifyType] = useState(storedSettings.notify_type || "email");
  const [warningQuota, setWarningQuota] = useState(quotaUnitsToDollars(storedSettings.quota_warning_threshold || 500_000));
  const [notificationEmail, setNotificationEmail] = useState(storedSettings.notification_email || "");
  const [webhookUrl, setWebhookUrl] = useState(storedSettings.webhook_url || "");
  const [webhookSecret, setWebhookSecret] = useState(storedSettings.webhook_secret || "");
  const [barkUrl, setBarkUrl] = useState(storedSettings.bark_url || "");
  const [gotifyUrl, setGotifyUrl] = useState(storedSettings.gotify_url || "");
  const [gotifyToken, setGotifyToken] = useState(storedSettings.gotify_token || "");
  const [gotifyPriority, setGotifyPriority] = useState(storedSettings.gotify_priority ?? 5);
  const [acceptUnsetRatio, setAcceptUnsetRatio] = useState(storedSettings.accept_unset_model_ratio_model || false);
  const [recordIpLog, setRecordIpLog] = useState(storedSettings.record_ip_log || false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [originalPassword, setOriginalPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => setDisplayName(user?.display_name || ""), [user?.display_name]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const result = await updateProfile({ display_name: displayName.trim() });
      if (!result.success) throw new Error(result.message || t("Unable to save profile"));
      return result;
    },
    onMutate: () => { setProfileError(""); setProfileMessage(""); },
    onSuccess: () => { if (user) setUser({ ...user, display_name: displayName.trim() }); setProfileMessage(t("Profile updated")); },
    onError: (error) => setProfileError(error.message),
  });

  const savePreferences = useMutation({
    mutationFn: async () => {
      const payload: UserSettingsInput = {
        notify_type: notifyType,
        quota_warning_threshold: quotaDollarsToUnits(warningQuota),
        notification_email: notificationEmail.trim(),
        webhook_url: webhookUrl.trim(),
        webhook_secret: webhookSecret,
        bark_url: barkUrl.trim(),
        gotify_url: gotifyUrl.trim(),
        gotify_token: gotifyToken,
        gotify_priority: gotifyPriority,
        accept_unset_model_ratio_model: acceptUnsetRatio,
        record_ip_log: recordIpLog,
      };
      const result = await updateUserSettings(payload);
      if (!result.success) throw new Error(result.message || t("Unable to save preferences"));
      if (language !== locale) {
        const languageResult = await updateUserLanguage(language);
        if (!languageResult.success) throw new Error(languageResult.message || t("Unable to save language"));
      }
      return payload;
    },
    onMutate: () => { setSettingsError(""); setSettingsMessage(""); },
    onSuccess: (payload) => {
      if (user) setUser({ ...user, setting: JSON.stringify({ ...storedSettings, ...payload, language }) });
      setSettingsMessage(t("Preferences updated"));
      if (language !== locale) {
        const nextPath = window.location.pathname.replace(/^\/[^/]+/, `/${language}`);
        window.location.assign(`${nextPath}${window.location.search}`);
      }
    },
    onError: (error) => setSettingsError(error.message),
  });

  const savePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 8) throw new Error(t("Password must contain at least 8 characters"));
      if (newPassword !== confirmPassword) throw new Error(t("Passwords do not match"));
      const result = await updateProfile({ original_password: originalPassword, password: newPassword });
      if (!result.success) throw new Error(result.message || t("Unable to change password"));
      return result;
    },
    onMutate: () => { setPasswordError(""); setPasswordMessage(""); },
    onSuccess: () => { setOriginalPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordMessage(t("Password updated")); },
    onError: (error) => setPasswordError(error.message),
  });

  const connectedAccounts = [
    ["GitHub", Boolean(user?.github_id)],
    ["LinuxDO", Boolean(user?.linux_do_id)],
    ["Google / OIDC", Boolean(user?.oidc_id)],
  ] as const;

  return (
    <div className="console-page">
      <PageHeader eyebrow="CONSOLE / ACCOUNT" title={t("Profile")} description={t("Manage your visible account details and security entry points.")} />
      <div className="profile-grid">
        <form className="panel profile-form" onSubmit={(event) => { event.preventDefault(); saveProfile.mutate(); }}>
          <div className="panel-heading"><div><span className="eyebrow">IDENTITY</span><h2>{t("Account profile")}</h2></div></div>
          <label><span>{t("Display name")}</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <label><span>{t("Username")}</span><input value={user?.username || ""} disabled /></label>
          <label><span>{t("Email")}</span><input value={user?.email || t("Not bound")} disabled /></label>
          {profileMessage ? <div className="form-success"><Check size={15} />{profileMessage}</div> : null}
          {profileError ? <div className="form-error">{profileError}</div> : null}
          <button className="button primary-button" type="submit" disabled={saveProfile.isPending}>{saveProfile.isPending ? t("Saving") : t("Save profile")}</button>
        </form>

        <section className="panel account-status-panel">
          <div className="panel-heading"><div><span className="eyebrow">ACCOUNT STATUS</span><h2>{t("Connected accounts")}</h2></div><ShieldCheck size={19} /></div>
          {connectedAccounts.map(([label, connected]) => <div className="account-status-row" key={label}><span>{label}</span><strong className={connected ? "available-text" : ""}>{connected ? t("Connected") : t("Not connected")}</strong></div>)}
          <div className="account-status-row"><span>{t("Account status")}</span><strong className="available-text">{user?.status === 2 ? t("Disabled") : t("Active")}</strong></div>
          <button className="button secondary-button signout-button" onClick={() => void signOut().then(() => window.location.assign("/"))}>{t("Sign out")}</button>
        </section>
      </div>

      <form className="panel preferences-form" onSubmit={(event) => { event.preventDefault(); savePreferences.mutate(); }}>
        <div className="panel-heading"><div><span className="eyebrow">PREFERENCES</span><h2>{t("Notifications and behavior")}</h2></div><Settings2 size={19} /></div>
        <div className="preferences-grid">
          <label><span>{t("Interface language")}</span><select value={language} onChange={(event) => setLanguage(event.target.value as AppLocale)}>{locales.map((item) => <option key={item} value={item}>{localeLabels[item]}</option>)}</select></label>
          <label><span>{t("Notification method")}</span><select value={notifyType} onChange={(event) => setNotifyType(event.target.value)}><option value="email">Email</option><option value="webhook">Webhook</option><option value="bark">Bark</option><option value="gotify">Gotify</option></select></label>
          <label><span>{t("Balance warning in USD")}</span><input type="number" min="0.01" step="0.01" value={warningQuota} onChange={(event) => setWarningQuota(Number(event.target.value))} required /></label>
          {notifyType === "email" ? <label><span>{t("Notification email")}</span><input type="email" value={notificationEmail} onChange={(event) => setNotificationEmail(event.target.value)} placeholder={user?.email || "mail@example.com"} /></label> : null}
          {notifyType === "webhook" ? <><label><span>{t("Webhook URL")}</span><input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} required /></label><label><span>{t("Webhook secret")}</span><input type="password" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} /></label></> : null}
          {notifyType === "bark" ? <label><span>{t("Bark push URL")}</span><input type="url" value={barkUrl} onChange={(event) => setBarkUrl(event.target.value)} required /></label> : null}
          {notifyType === "gotify" ? <><label><span>{t("Gotify server URL")}</span><input type="url" value={gotifyUrl} onChange={(event) => setGotifyUrl(event.target.value)} required /></label><label><span>{t("Gotify application token")}</span><input type="password" value={gotifyToken} onChange={(event) => setGotifyToken(event.target.value)} required /></label><label><span>{t("Message priority")}</span><input type="number" min="0" max="10" value={gotifyPriority} onChange={(event) => setGotifyPriority(Number(event.target.value))} /></label></> : null}
        </div>
        <div className="preference-switches">
          <label className="switch-row"><span><strong>{t("Allow models without configured pricing")}</strong><small>{t("Requests may use models whose price has not been set")}</small></span><input type="checkbox" checked={acceptUnsetRatio} onChange={(event) => setAcceptUnsetRatio(event.target.checked)} /></label>
          <label className="switch-row"><span><strong>{t("Record request IP in logs")}</strong><small>{t("Store source IP addresses in your private usage logs")}</small></span><input type="checkbox" checked={recordIpLog} onChange={(event) => setRecordIpLog(event.target.checked)} /></label>
        </div>
        {settingsMessage ? <div className="form-success"><Check size={15} />{settingsMessage}</div> : null}
        {settingsError ? <div className="form-error">{settingsError}</div> : null}
        <div className="form-footer"><button className="button primary-button" disabled={savePreferences.isPending}>{savePreferences.isPending ? t("Saving") : t("Save preferences")}</button></div>
      </form>

      <form className="panel password-form" onSubmit={(event) => { event.preventDefault(); savePassword.mutate(); }}>
        <div className="panel-heading"><div><span className="eyebrow">SECURITY</span><h2>{t("Change password")}</h2></div><ShieldCheck size={19} /></div>
        <div className="password-fields"><label><span>{t("Current password")}</span><input type="password" autoComplete="current-password" value={originalPassword} onChange={(event) => setOriginalPassword(event.target.value)} required /></label><label><span>{t("New password")}</span><input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label><label><span>{t("Confirm password")}</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label></div>
        {passwordMessage ? <div className="form-success"><Check size={15} />{passwordMessage}</div> : null}
        {passwordError ? <div className="form-error">{passwordError}</div> : null}
        <div className="form-footer"><button className="button primary-button" disabled={savePassword.isPending}>{savePassword.isPending ? t("Saving") : t("Update password")}</button></div>
      </form>
    </div>
  );
}
