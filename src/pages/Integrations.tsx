import { Bot, PlugZap } from "lucide-react";
import { botMessages, integrationEndpoints, notificationCatalog } from "../data";
import { SectionHeader, StatusTag, toneForStatus } from "../components/ui";

export function Integrations() {
  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>集成中心</h1>
          <p>展示企业微信内嵌 H5、MCP 接口和智能机器人能力口径，当前不调用真实外部服务。</p>
        </div>
        <StatusTag tone="cyan">H5 / MCP / 机器人</StatusTag>
      </div>

      <div className="grid-2">
        <div className="panel">
          <SectionHeader title="MCP 能力卡片" action={<PlugZap size={18} />} />
          <div className="integration-grid">
            {integrationEndpoints.map((endpoint) => (
              <article className="integration-card" key={endpoint.path}>
                <div>
                  <StatusTag tone="blue">{endpoint.method}</StatusTag>
                  <StatusTag tone={toneForStatus(endpoint.status)}>{endpoint.status}</StatusTag>
                </div>
                <strong>{endpoint.name}</strong>
                <code>{endpoint.path}</code>
                <p>{endpoint.capability}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="panel">
          <SectionHeader title="企业微信机器人对话样例" action={<Bot size={18} />} />
          <div className="bot-chat">
            {botMessages.map((message, index) => (
              <div className={message.speaker === "user" ? "chat-bubble user" : "chat-bubble bot"} key={`${message.speaker}${index}`}>
                <span>{message.speaker === "user" ? "用户" : "机器人"}</span>
                <p>{message.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <SectionHeader title="企业微信内嵌 H5 访问" />
        <div className="permission-scope-grid">
          <article className="scope-card">
            <div><strong>统一页面</strong><StatusTag tone="blue">单套 H5</StatusTag></div>
            <p>桌面、平板和企业微信内嵌浏览器访问同一套业务页面，不维护独立移动端页面体系。</p>
            <span>手机宽度下导航转为顶部横向入口，表格和甘特在组件内部横向滚动。</span>
          </article>
          <article className="scope-card">
            <div><strong>轻操作能力</strong><StatusTag tone="green">原型展示</StatusTag></div>
            <p>需求查看、任务状态、工时填报和验收评分使用同一套 React 状态演示。</p>
            <span>当前不接企业微信 JS-SDK、OAuth 或真实消息推送。</span>
          </article>
        </div>
      </div>

      <div className="panel">
        <SectionHeader title="通知与订阅渠道状态" />
        <table className="data-table">
          <thead><tr><th>通知类型</th><th>站内信</th><th>企业微信</th><th>说明</th></tr></thead>
          <tbody>
            {notificationCatalog.filter((item) => item.channels.includes("企业微信") || item.channels.includes("机器人")).slice(0, 8).map((item) => (
              <tr key={item.id}>
                <td><strong>{item.domain} · {item.event}</strong></td>
                <td><StatusTag tone="green">已启用</StatusTag></td>
                <td><StatusTag tone={item.configurable ? "orange" : "green"}>{item.configurable ? "按角色订阅" : "强提醒"}</StatusTag></td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
