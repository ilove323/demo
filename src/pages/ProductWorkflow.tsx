import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { productWorkflowItems } from "../data";
import { DemandProjectFlowBoard } from "../components/DemandProjectFlowBoard";
import { FilterPanel } from "../components/FilterPanel";
import type { DeliveryRequest, Demand, DemandProjectFlow, FlowActionId, FlowActionLog, FlowBoardAction, FlowNode, RoleId, RoleOption } from "../types";
import { MetricCard, SectionHeader, StatusTag, toneForStatus } from "../components/ui";

const allOption = "全部";

export function ProductWorkflow({
  demands: liveDemands,
  flows,
  deliveryRequests,
  activeRole,
  activeUser,
  flowActionLogs,
  canConfigureFlow,
  onFlowNodeChange,
  onApplyFlowAction,
  onAssignWork
}: {
  demands: Demand[];
  flows: DemandProjectFlow[];
  deliveryRequests: DeliveryRequest[];
  activeRole: RoleId;
  activeUser: RoleOption;
  flowActionLogs: FlowActionLog[];
  canConfigureFlow: boolean;
  onFlowNodeChange: (flowId: string, nodeId: string, patch: Partial<FlowNode>) => void;
  onApplyFlowAction: (flowId: string, actionId: FlowActionId, note?: string) => void;
  onAssignWork: (targetUserName: string, relatedType: "demand" | "project" | "task" | "resource" | "flow", relatedId: string, summary: string) => void;
}) {
  const [selectedFlowId, setSelectedFlowId] = useState(flows[0]?.id ?? "");
  const [productAssignee, setProductAssignee] = useState("陈彦");
  const [filters, setFilters] = useState({
    keyword: "",
    demandStatus: allOption,
    priority: allOption,
    implementation: allOption,
    owner: allOption,
    flowStage: allOption,
    flowStatus: allOption,
    flowMode: allOption
  });
  const workflowOwnerOptions = useMemo(
    () => unique([...liveDemands.map((demand) => demand.handler), ...productWorkflowItems.map((item) => item.owner), ...flows.flatMap((flow) => flow.nodes.map((node) => node.owner))]),
    [flows, liveDemands]
  );
  const productManagerOptions = useMemo(
    () =>
      unique([
        ...liveDemands.map((demand) => demand.handler.replace(" / 产品", "")),
        ...productWorkflowItems.map((item) => item.owner),
        ...deliveryRequests.map((request) => request.productOwner),
        ...flows.flatMap((flow) => flow.nodes.filter((node) => node.lane === "产品经理").map((node) => node.owner))
      ]).filter((name) => !name.includes("/") && name !== "无外部供应商"),
    [deliveryRequests, flows, liveDemands]
  );
  const flowStageOptions = useMemo(
    () => unique([...productWorkflowItems.map((item) => item.stage), ...flows.flatMap((flow) => flow.nodes.map((node) => node.name))]),
    [flows]
  );
  const flowStatusOptions = useMemo(
    () => unique([...productWorkflowItems.map((item) => item.status), ...flows.flatMap((flow) => flow.nodes.map((node) => node.status))]),
    [flows]
  );
  const filteredDemands = useMemo(
    () =>
      liveDemands.filter((demand) => {
        const keyword = filters.keyword.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          [
            demand.id,
            demand.name,
            demand.requester,
            demand.team,
            demand.handler,
            demand.objective,
            demand.description,
            demand.analysis.resourcePlan,
            demand.analysis.iteration
          ].some((value) => value.toLowerCase().includes(keyword));
        return (
          matchesKeyword &&
          matchesSelect(demand.status, filters.demandStatus) &&
          matchesSelect(demand.priority, filters.priority) &&
          matchesSelect(demand.implementation, filters.implementation) &&
          matchesPerson(demand.handler, filters.owner)
        );
      }),
    [filters, liveDemands]
  );
  const filteredDemandIds = useMemo(() => new Set(filteredDemands.map((demand) => demand.id)), [filteredDemands]);
  const filteredFlows = useMemo(
    () =>
      flows.filter((flow) => {
        const keyword = filters.keyword.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          [
            flow.id,
            flow.title,
            flow.demandId,
            flow.projectId,
            flow.resourceRequest.need,
            ...flow.nodes.flatMap((node) => [node.name, node.owner, node.deliverable, node.description])
          ].some((value) => value.toLowerCase().includes(keyword));
        const matchesStage = filters.flowStage === allOption || flow.nodes.some((node) => node.name === filters.flowStage);
        const matchesStatus = filters.flowStatus === allOption || flow.nodes.some((node) => node.status === filters.flowStatus);
        const matchesOwner =
          filters.owner === allOption ||
          flow.nodes.some((node) => matchesPerson(node.owner, filters.owner)) ||
          matchesPerson(flow.resourceRequest.requester, filters.owner);
        return (
          filteredDemandIds.has(flow.demandId) &&
          matchesKeyword &&
          matchesSelect(flow.mode, filters.flowMode) &&
          matchesStage &&
          matchesStatus &&
          matchesOwner
        );
      }),
    [filteredDemandIds, filters, flows]
  );
  const filteredWorkflowItems = useMemo(
    () =>
      productWorkflowItems.filter((item) => {
        const demand = liveDemands.find((entry) => entry.id === item.demandId);
        const keyword = filters.keyword.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          [item.id, item.title, item.stage, item.status, item.owner, item.description, item.decision, item.nextAction, demand?.name ?? ""].some((value) =>
            value.toLowerCase().includes(keyword)
          );
        return (
          filteredDemandIds.has(item.demandId) &&
          matchesKeyword &&
          matchesPerson(item.owner, filters.owner) &&
          matchesSelect(item.stage, filters.flowStage) &&
          matchesSelect(item.status, filters.flowStatus)
        );
      }),
    [filteredDemandIds, filters, liveDemands]
  );
  const filteredDeliveryRequests = useMemo(
    () =>
      deliveryRequests.filter((request) => {
        const demand = liveDemands.find((entry) => entry.id === request.demandId);
        const keyword = filters.keyword.trim().toLowerCase();
        const matchesKeyword =
          !keyword ||
          [
            request.id,
            request.title,
            request.productOwner,
            request.projectManager,
            request.resourceNeed,
            request.supplierNeed,
            request.status,
            request.decision,
            demand?.name ?? ""
          ].some((value) => value.toLowerCase().includes(keyword));
        return filteredDemandIds.has(request.demandId) && matchesKeyword && matchesPerson(request.productOwner, filters.owner) && matchesSelect(request.requestedMode, filters.implementation);
      }),
    [deliveryRequests, filteredDemandIds, filters, liveDemands]
  );
  const pendingAnalysis = filteredDemands.filter((demand) => demand.status === "需求评审");
  const acceptance = filteredDemands.filter((demand) => demand.status === "项目验收");
  const productEvaluationItems = filteredWorkflowItems.filter((item) => item.stage === "产品评估").length;
  const projectRequestItems = filteredWorkflowItems.filter((item) => item.stage === "项目申请").length;
  const pendingDeliveryRequests = filteredDeliveryRequests.filter((item) => ["草稿", "退回方案确认", "待项目经理启动"].includes(item.status));
  const selectedFlow = filteredFlows.find((flow) => flow.id === selectedFlowId) ?? filteredFlows[0];
  const selectedFlowLogs = selectedFlow ? flowActionLogs.filter((log) => log.flowId === selectedFlow.id) : [];
  const productActions = selectedFlow ? getProductFlowActions(activeRole, selectedFlow) : [];
  const activeFilterCount = countActiveFilters(filters, {
    keyword: "",
    demandStatus: allOption,
    priority: allOption,
    implementation: allOption,
    owner: allOption,
    flowStage: allOption,
    flowStatus: allOption,
    flowMode: allOption
  });
  const resetFilters = () =>
    setFilters({
      keyword: "",
      demandStatus: allOption,
      priority: allOption,
      implementation: allOption,
      owner: allOption,
      flowStage: allOption,
      flowStatus: allOption,
      flowMode: allOption
    });

  return (
    <section className="page">
      <div className="page-title">
        <div>
          <h1>产品工作台</h1>
        </div>
        <StatusTag tone="violet">待处理 {pendingAnalysis.length + pendingDeliveryRequests.length + acceptance.length}</StatusTag>
      </div>

      <div className="grid-4">
        <MetricCard label="待承接/评估" value={String(pendingAnalysis.length)} delta="产品侧待推进" tone="orange" />
        <MetricCard label="项目申请" value={String(pendingDeliveryRequests.length + projectRequestItems)} delta="待提交或项目启动" tone="cyan" />
        <MetricCard label="产品评估项" value={String(productEvaluationItems)} delta="范围 / 方案 / 资源 / 供应商" tone="violet" />
        <MetricCard label="待组织验收" value={String(acceptance.length)} delta="业务部门待评分" tone="green" />
      </div>

      <div className="panel">
        <FilterPanel eyebrow="FILTERS" title="产品协作筛选" summary={`需求 ${filteredDemands.length} / ${liveDemands.length} · 流程 ${filteredFlows.length} / ${flows.length}`} activeCount={activeFilterCount}>
          <div className="filter-bar">
            <input
              aria-label="按需求、流程、负责人搜索"
              placeholder="搜索需求 / 流程 / 负责人"
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
            />
            <select value={filters.demandStatus} onChange={(event) => setFilters((current) => ({ ...current, demandStatus: event.target.value }))}>
              <option value={allOption}>全部需求状态</option>
              {unique(liveDemands.map((demand) => demand.status)).map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
              <option value={allOption}>全部优先级</option>
              {["P0", "P1", "P2", "P3"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
            <select value={filters.implementation} onChange={(event) => setFilters((current) => ({ ...current, implementation: event.target.value }))}>
              <option value={allOption}>全部实现方式</option>
              {unique(liveDemands.map((demand) => demand.implementation)).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={filters.owner} onChange={(event) => setFilters((current) => ({ ...current, owner: event.target.value }))}>
              <option value={allOption}>全部负责人</option>
              {workflowOwnerOptions.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
            </select>
            <select value={filters.flowStage} onChange={(event) => setFilters((current) => ({ ...current, flowStage: event.target.value }))}>
              <option value={allOption}>全部流程阶段</option>
              {flowStageOptions.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </select>
            <select value={filters.flowStatus} onChange={(event) => setFilters((current) => ({ ...current, flowStatus: event.target.value }))}>
              <option value={allOption}>全部流程状态</option>
              {flowStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={filters.flowMode} onChange={(event) => setFilters((current) => ({ ...current, flowMode: event.target.value }))}>
              <option value={allOption}>全部转化模式</option>
              {unique(flows.map((flow) => flow.mode)).map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
            <button className="btn secondary" onClick={resetFilters}>清空筛选</button>
          </div>
        </FilterPanel>
      </div>

      <div className="workflow-lane">
        {["产品指派", "产品评估", "项目申请", "项目受理", "资源排期", "实施联调", "业务验收", "上线归档"].map((step, index) => (
          <div className="workflow-step" key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
            {index < 5 ? <ArrowRight size={16} /> : <CheckCircle2 size={16} />}
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="panel">
          <SectionHeader eyebrow="MY ACTIONS" title="我的待处理" />
          <div className="action-list">
            {pendingAnalysis.slice(0, 3).map((demand) => (
              <article className="action-row" key={demand.id}>
                <div>
                  <strong>{demand.name}</strong>
                  <span>{demand.id} · {demand.status} · {demand.priority}</span>
                </div>
                <StatusTag tone={toneForStatus(demand.status)}>{demand.implementation}</StatusTag>
              </article>
            ))}
            {pendingDeliveryRequests.slice(0, 3).map((request) => (
              <article className="action-row" key={request.id}>
                <div>
                  <strong>{request.title}</strong>
                  <span>{request.status} · 项目经理：{request.projectManager}</span>
                </div>
                <StatusTag tone={toneForStatus(request.status)}>{request.requestedMode}</StatusTag>
              </article>
            ))}
            {pendingAnalysis.length + pendingDeliveryRequests.length === 0 ? <div className="empty-state table-empty"><strong>暂无待处理</strong><span>当前筛选范围内没有产品侧待处理事项。</span></div> : null}
          </div>
        </div>
        <div className="panel">
          <SectionHeader eyebrow="PROJECT REQUEST" title="项目申请" />
          <table className="data-table compact-table">
            <thead><tr><th>申请</th><th>项目经理</th><th>模式</th><th>状态</th></tr></thead>
            <tbody>
              {filteredDeliveryRequests.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.title}</strong><div className="muted-text">{request.resourceNeed}</div></td>
                  <td>{request.projectManager}</td>
                  <td><StatusTag tone={request.requestedMode === "合作实现" ? "blue" : request.requestedMode === "内部实现" ? "cyan" : "violet"}>{request.requestedMode}</StatusTag></td>
                  <td><StatusTag tone={toneForStatus(request.status)}>{request.status}</StatusTag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedFlow ? (
        <div className="panel">
          <SectionHeader
            eyebrow="DEMAND TO PROJECT"
            title="协作链路 / 交接记录"
            action={
              <select className="inline-select" value={selectedFlow.id} onChange={(event) => setSelectedFlowId(event.target.value)}>
                {filteredFlows.map((flow) => <option key={flow.id} value={flow.id}>{flow.title}</option>)}
              </select>
            }
          />
          {["admin", "pm"].includes(activeRole) ? (
            <div className="assignment-strip">
              <div>
                <strong>产品指派与承接启动</strong>
                <span>{activeUser.userName} 可指定产品经理承接当前需求，开启产品承接环节。</span>
              </div>
              <div className="assignment-controls">
                <select className="inline-select" value={productAssignee} onChange={(event) => setProductAssignee(event.target.value)}>
                  {productManagerOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <button className="btn" type="button" onClick={() => onAssignWork(productAssignee, "demand", selectedFlow.demandId, `${selectedFlow.title} 的产品承接`)}>
                  指派给{productAssignee}
                </button>
              </div>
            </div>
          ) : null}
          <DemandProjectFlowBoard
            flow={selectedFlow}
            canConfigure={canConfigureFlow}
            actions={productActions}
            actionTitle="产品经理业务动作"
            logs={selectedFlowLogs}
            onNodeChange={onFlowNodeChange}
            onApplyAction={onApplyFlowAction}
          />
        </div>
      ) : (
        <div className="empty-state">
          <strong>没有符合条件的转项目流程</strong>
          <span>当前条件下暂无转项目流程。</span>
        </div>
      )}

      <div className="grid-2">
        {filteredWorkflowItems.map((item) => {
          const demand = liveDemands.find((entry) => entry.id === item.demandId);
          return (
            <article className="panel workflow-card" key={item.id}>
              <SectionHeader eyebrow={`${item.id} · ${item.stage}`} title={item.title} action={<StatusTag tone={toneForStatus(item.status)}>{item.status}</StatusTag>} />
              <p>{item.description}</p>
              <div className="detail-list">
                <div><span>关联需求</span><strong>{demand?.name ?? item.demandId}</strong></div>
                <div><span>产品负责人</span><strong>{item.owner}</strong></div>
                <div><span>当前决策</span><strong>{item.decision}</strong></div>
                <div><span>下一步</span><strong>{item.nextAction}</strong></div>
              </div>
              <ul className="pill-list">
                {item.artifacts.map((artifact) => <li key={artifact}>{artifact}</li>)}
              </ul>
            </article>
          );
        })}
      </div>
      {filteredWorkflowItems.length === 0 ? (
        <div className="empty-state">
          <strong>没有符合条件的产品协作事项</strong>
          <span>请放宽负责人、流程阶段或流程状态筛选。</span>
        </div>
      ) : null}

      <div className="panel">
        <SectionHeader eyebrow="ITERATION" title="需求分析与迭代版本" />
        <table className="data-table">
          <thead><tr><th>需求</th><th>价值评分</th><th>实现方式</th><th>资源方案</th><th>迭代</th></tr></thead>
          <tbody>
            {filteredDemands.map((demand) => (
              <tr key={demand.id}>
                <td><strong>{demand.name}</strong><div className="muted-text">{demand.id}</div></td>
                <td>{demand.analysis.valueScore}</td>
                <td><StatusTag tone={demand.implementation === "合作实现" ? "blue" : demand.implementation === "内部实现" ? "cyan" : "violet"}>{demand.implementation}</StatusTag></td>
                <td>{demand.analysis.resourcePlan}</td>
                <td>{demand.analysis.iteration}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredDemands.length === 0 ? (
          <div className="empty-state table-empty">
            <strong>没有符合条件的需求分析记录</strong>
            <span>当前条件下暂无需求分析记录。</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean);
}

function matchesSelect(value: string, selected: string) {
  return selected === allOption || value === selected;
}

function countActiveFilters<T extends Record<string, string>>(filters: T, defaults: T) {
  return Object.keys(filters).filter((key) => filters[key].trim() !== defaults[key]).length;
}

function matchesPerson(value: string, selected: string) {
  return selected === allOption || value === selected || value.includes(selected) || selected.includes(value);
}

function getProductFlowActions(activeRole: RoleId, flow: DemandProjectFlow): FlowBoardAction[] {
  if (!["admin", "product"].includes(activeRole)) return [];
  const isCurrent = (id: string) => flow.currentNodeId === id;
  return [
    {
      id: "product.returnDemand",
      label: "打回需求",
      description: "背景、目标、价值或验收边界不足时，打回给需求方补充。",
      stage: "阶段1：需求评审",
      tone: "orange",
      impact: ["泳道回到阶段0草稿", "需求状态变为已打回", "操作留言写入记录和通知"],
      disabled: !isCurrent("demandReview"),
      disabledReason: "只有需求评审阶段可打回需求。"
    },
    {
      id: "product.submitSolution",
      label: "发起方案确认",
      description: "提交解决方案、资源投入测算和 AI 评分，交给需求方确认。",
      stage: "阶段1：需求评审",
      tone: "blue",
      impact: ["泳道推进到阶段2方案确认", "需求方收到方案确认通知", "操作留言写入记录和通知"],
      disabled: !isCurrent("demandReview"),
      disabledReason: "只有需求评审阶段可发起方案确认。"
    },
    {
      id: "product.returnExecution",
      label: "退回项目进行",
      description: "验收不通过时退回项目进行阶段继续整改。",
      stage: "阶段5：项目验收",
      tone: "red",
      impact: ["泳道回到阶段4项目进行", "项目状态改为项目进行", "项目经理和开发收到整改通知"],
      disabled: !isCurrent("projectAcceptance"),
      disabledReason: "只有项目验收阶段可退回整改。"
    },
    {
      id: "product.completeAcceptance",
      label: "验收完成",
      description: "产品经理确认项目交付通过，进入需求方最终评分。",
      stage: "阶段5：项目验收",
      tone: "green",
      impact: ["泳道推进到阶段6验收完成", "需求方收到评分通知", "操作留言写入记录和通知"],
      disabled: !isCurrent("projectAcceptance"),
      disabledReason: "只有项目验收阶段可确认验收完成。"
    }
  ];
}
