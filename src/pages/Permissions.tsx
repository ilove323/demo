import { permissionRows, roleAccessPreviews, roles, users } from "../data";
import type { RoleId } from "../types";
import { SectionHeader, StatusTag } from "../components/ui";

export function Permissions({ activeRole }: { activeRole: RoleId }) {
  const preview = roleAccessPreviews.find((item) => item.roleId === activeRole) ?? roleAccessPreviews[0];
  const activePersona = roles.find((role) => role.id === activeRole);
  const roleName = activePersona?.organizationTitle ? `${activePersona.label} · ${activePersona.organizationTitle}` : activePersona?.label ?? "当前身份";

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>权限管理</h1>
        </div>
        <StatusTag tone="red">系统设置 / 管理员</StatusTag>
      </div>
      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="ACCESS PREVIEW" title={`${roleName} 权限预览`} />
          <div className="detail-list">
            <div><span>数据范围</span><strong>{preview.dataScope}</strong></div>
          </div>
          <SectionHeader title="可见模块" />
          <ul className="pill-list">{preview.visibleModules.map((item) => <li key={item}>{item}</li>)}</ul>
          <SectionHeader title="可执行动作" />
          <ul className="timeline">{preview.actions.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="panel">
          <SectionHeader eyebrow="ROLES" title="角色说明" />
          <div className="role-card-list">
            {roles.filter((role) => !role.isDepartmentOwner).map((role) => (
              <div className={role.id === activeRole ? "role-card selected" : "role-card"} key={role.id}>
                <strong>{role.label}</strong>
                <span>{role.department} · {role.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="USERS" title="用户、角色与组织身份" />
          <table className="data-table">
            <thead><tr><th>姓名</th><th>部门</th><th>角色</th><th>组织身份</th><th>数据范围</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.name}><td><strong>{user.name}</strong></td><td>{user.department}</td><td>{user.role}</td><td>{user.organizationTitle ?? "普通成员"}</td><td>{user.scope}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="panel permission-grid">
        <SectionHeader eyebrow="MATRIX" title="权限矩阵" />
        <table className="data-table">
          <thead><tr><th>模块</th><th>查看</th><th>新建</th><th>编辑</th><th>审批</th><th>导出</th><th>数据范围</th></tr></thead>
          <tbody>
            {permissionRows.map((row) => (
              <tr key={row.module}>
                <td><strong>{row.module}</strong></td>
                <td>{mark(row.view)}</td>
                <td>{mark(row.create)}</td>
                <td>{mark(row.edit)}</td>
                <td>{mark(row.approve)}</td>
                <td>{mark(row.export)}</td>
                <td>{row.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function mark(value: boolean) {
  return value ? <span className="check">是</span> : <span className="cross">否</span>;
}
