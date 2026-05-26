import { departments, notificationCatalog, roleAccessPreviews, roleNotificationSubscriptions, roles, users } from "../data";
import type { RoleId } from "../types";
import { SectionHeader, StatusTag } from "../components/ui";

function identityText(role?: { label: string; organizationTitle?: string }) {
  if (!role) return "";
  return role.organizationTitle ? `${role.label} · ${role.organizationTitle}` : role.label;
}

export function UserSettings() {
  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>用户设置</h1>
        </div>
        <StatusTag tone="blue">管理员</StatusTag>
      </div>
      <div className="panel">
        <SectionHeader eyebrow="USERS" title="用户与授权范围" />
        <table className="data-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>部门</th>
              <th>角色</th>
              <th>组织身份</th>
              <th>状态</th>
              <th>数据范围</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.name}>
                <td><strong>{user.name}</strong></td>
                <td>{user.department}</td>
                <td>{user.role}</td>
                <td>{user.organizationTitle ?? "普通成员"}</td>
                <td><StatusTag tone="green">{user.status}</StatusTag></td>
                <td>{user.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RoleSettings({ activeRole }: { activeRole: RoleId }) {
  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>角色设置</h1>
        </div>
        <StatusTag tone="violet">管理员</StatusTag>
      </div>
      <div className="role-settings-grid">
        {roleAccessPreviews.map((preview) => {
          const role = roles.find((item) => item.id === preview.roleId);
          if (role?.isDepartmentOwner) return null;
          return (
            <article className={preview.roleId === activeRole ? "role-setting-card selected" : "role-setting-card"} key={preview.roleId}>
              <div className="role-setting-card-head">
                <div>
                  <h3>{identityText(role)}</h3>
                  <p>{role?.department} · {role?.userName}</p>
                </div>
                <StatusTag tone={preview.roleId === "admin" ? "red" : "blue"}>{preview.roleId === "admin" ? "全量" : "受限"}</StatusTag>
              </div>
              <div className="detail-list">
                <div><span>数据范围</span><strong>{preview.dataScope}</strong></div>
              </div>
              <div className="system-pill-block">
                <span>可见模块</span>
                <ul className="pill-list">{preview.visibleModules.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="system-pill-block">
                <span>可执行动作</span>
                <ul className="timeline">{preview.actions.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function DepartmentSettings() {
  const userById = new Map(users.map((user) => [user.id, user]));

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>部门设置</h1>
        </div>
        <StatusTag tone="cyan">管理员</StatusTag>
      </div>
      <div className="department-grid">
        {departments.map((department) => (
          <article className="department-card" key={department.name}>
            <div className="role-setting-card-head">
              <div>
                <h3>{department.name}</h3>
                <p>负责人：{department.ownerUserIds.map((id) => userById.get(id)?.name ?? id).join("、")}</p>
              </div>
              <StatusTag tone="green">{department.status}</StatusTag>
            </div>
            <div className="detail-list">
              <div><span>成员数</span><strong>{department.memberUserIds.length} 人</strong></div>
              <div><span>部门数据边界</span><strong>{department.scope}</strong></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function NotificationSettings() {
  const domains = Array.from(new Set(notificationCatalog.map((item) => item.domain)));

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>通知设置</h1>
        </div>
        <StatusTag tone="red">管理员</StatusTag>
      </div>
      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="CATALOG" title="全局通知目录" />
          <div className="notification-domain-grid single-column">
            {domains.map((domain) => (
              <article className="notification-domain-card" key={domain}>
                <h3>{domain}</h3>
                <div className="catalog-event-list">
                  {notificationCatalog.filter((item) => item.domain === domain).map((item) => (
                    <div className="catalog-event" key={item.id}>
                      <div>
                        <strong>{item.event}</strong>
                        <span>{item.description}</span>
                      </div>
                      <div className="notification-tags">
                        <StatusTag tone={priorityTone(item.priority)}>{item.priority}</StatusTag>
                        <StatusTag tone={item.configurable ? "blue" : "red"}>{item.configurable ? "可配置" : "强提醒"}</StatusTag>
                      </div>
                      <small>{item.channels.join(" / ")}</small>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="panel">
          <SectionHeader eyebrow="ROLE POLICY" title="角色订阅策略" />
          <div className="subscription-policy-list">
            {roleNotificationSubscriptions.map((policy) => {
              const role = roles.find((item) => item.id === policy.roleId);
              return (
                <article className="notification-policy-card" key={policy.roleId}>
                  <div className="role-setting-card-head">
                    <div>
                      <h3>{identityText(role)}</h3>
                      <p>{role?.department} · {policy.note}</p>
                    </div>
                    <StatusTag tone={policy.roleId === "admin" ? "red" : role?.isDepartmentOwner ? "orange" : "blue"}>{policy.roleId === "admin" ? "管理员" : role?.isDepartmentOwner ? "组织身份" : "角色"}</StatusTag>
                  </div>
                  <PolicyLine label="强制通知" ids={policy.locked} tone="red" />
                  <PolicyLine label="默认订阅" ids={policy.defaultOn} tone="green" />
                  <PolicyLine label="可选订阅" ids={policy.optional} tone="gray" />
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PolicyLine({ label, ids, tone }: { label: string; ids: string[]; tone: "red" | "green" | "gray" }) {
  return (
    <div className="system-pill-block">
      <span>{label}</span>
      <div className="policy-chip-list">
        {ids.map((id) => {
          const item = notificationCatalog.find((event) => event.id === id);
          return <StatusTag key={id} tone={tone}>{item?.event ?? id}</StatusTag>;
        })}
      </div>
    </div>
  );
}

function priorityTone(priority: string) {
  if (priority === "高") return "red";
  if (priority === "中") return "orange";
  return "gray";
}
