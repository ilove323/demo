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
          <SectionHeader title={`${roleName} 权限预览`} />
          <div className="detail-list">
            <div><span>数据范围</span><strong>{preview.dataScope}</strong></div>
          </div>
          <SectionHeader title="可见模块" />
          <ul className="pill-list">{preview.visibleModules.map((item) => <li key={item}>{item}</li>)}</ul>
          <SectionHeader title="可执行动作" />
          <ul className="timeline">{preview.actions.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="panel">
          <SectionHeader title="角色说明" />
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
          <SectionHeader title="用户、角色与组织身份" />
          <table className="data-table">
            <thead><tr><th>姓名</th><th>部门</th><th>角色</th><th>组织身份</th><th>数据范围</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.name}><td><strong>{user.name}</strong></td><td>{user.department}</td><td>{user.role}</td><td>{user.organizationTitle ?? "普通成员"}</td><td>{user.scope}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <SectionHeader title="数据范围与行级权限口径" />
        <div className="permission-scope-grid">
          {rowLevelExamples.map((item) => (
            <article className="scope-card" key={item.title}>
              <div>
                <strong>{item.title}</strong>
                <StatusTag tone={item.tone}>{item.scope}</StatusTag>
              </div>
              <p>{item.rule}</p>
              <span>{item.example}</span>
            </article>
          ))}
        </div>
      </div>
      <div className="panel permission-grid">
        <SectionHeader title="权限矩阵" />
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

const rowLevelExamples = [
  {
    title: "本人数据",
    scope: "个人",
    tone: "blue" as const,
    rule: "业务只能查看本人提交或被邀请验收的需求；开发只能查看本人任务、排期和工时。",
    example: "沈岚只看到自己的需求，吴承只看到自己的任务。"
  },
  {
    title: "本部门数据",
    scope: "部门",
    tone: "cyan" as const,
    rule: "部门负责人以原业务角色进入系统，但数据范围扩展到本部门需求、任务、投入和验收结果。",
    example: "业务部门负责人可调整业务部门全部需求优先级。"
  },
  {
    title: "项目池数据",
    scope: "项目",
    tone: "violet" as const,
    rule: "项目经理查看自己负责或被分配治理的 IT 项目，IT负责人查看 IT部项目池和供应商预算。",
    example: "项目详情页展示关联需求、资源申请、供应商预算和操作记录。"
  },
  {
    title: "全局数据",
    scope: "全局",
    tone: "orange" as const,
    rule: "管理员和高管可查看全局汇总；管理员额外维护用户、角色、部门、通知和集成配置。",
    example: "高管看项目组合与绩效，管理员看权限矩阵和集成状态。"
  }
];
