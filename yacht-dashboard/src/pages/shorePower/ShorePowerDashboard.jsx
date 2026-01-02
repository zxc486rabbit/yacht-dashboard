// src/pages/shorePower/ShorePowerDashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/shorePower/ShorePowerDashboard.css";

import { BERTHS, EVENTS } from "../../data/shorePower/shorePowerMock";

import SectionCard from "../../components/shorePower/SectionCard";
import StatsCard from "../../components/shorePower/StatsCard";
import BerthCard from "../../components/shorePower/BerthCard";
import EventList from "../../components/shorePower/EventList";
import MiniTrend from "../../components/shorePower/MiniTrend";

import { FaBolt, FaWater, FaRegClock } from "react-icons/fa";
import { MdOutlineErrorOutline } from "react-icons/md";
import { LuPower } from "react-icons/lu";
import { TbCircuitAmmeter } from "react-icons/tb";
import { FiMove, FiSettings, FiX } from "react-icons/fi";

import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS as DndCSS } from "@dnd-kit/utilities";

const ResponsiveGridLayout = WidthProvider(Responsive);

const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);
const LS_KEY = "shorePower.dashboard.v3";

// ✅ 固定 12 欄
const GRID_COLS = 12;
const ROW_HEIGHT = 48;

// ✅ 預設版面（12 欄）— 不限縮最小寬度（minW: 1）
// ✅ 今日用量高度預設 3
const DEFAULT_CFG = {
  visible: {
    stats: true,
    shipStatus: true,
    todayUsage: true,
    berth: true,
    trend: true,
    events: true,
    shortcuts: true,
  },
  layout: [
    { i: "stats", x: 0, y: 0, w: 8, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 6 },
    { i: "shipStatus", x: 8, y: 0, w: 4, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 6 },

    { i: "todayUsage", x: 0, y: 3, w: 12, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 6 },

    { i: "berth", x: 0, y: 6, w: 12, h: 8, minW: 1, minH: 5, maxW: 12, maxH: 20 },

    { i: "trend", x: 0, y: 14, w: 6, h: 4, minW: 1, minH: 3, maxW: 12, maxH: 10 },
    { i: "events", x: 6, y: 14, w: 6, h: 4, minW: 1, minH: 3, maxW: 12, maxH: 12 },

    { i: "shortcuts", x: 0, y: 18, w: 12, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 8 },
  ],
  berthOrder: BERTHS.map((b) => b.berthId),
};

// ✅ 快速套用：標準 / 監控大屏 / 值班模式
const PRESET_CFGS = {
  standard: () => ({
    visible: { ...DEFAULT_CFG.visible },
    layout: DEFAULT_CFG.layout.map((x) => ({ ...x })),
  }),

  wallboard: () => ({
    visible: {
      stats: true,
      shipStatus: true,
      todayUsage: true,
      berth: true,
      trend: true,
      events: true,
      shortcuts: false,
    },
    layout: [
      { i: "stats", x: 0, y: 0, w: 7, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 8 },
      { i: "shipStatus", x: 7, y: 0, w: 5, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 8 },

      { i: "todayUsage", x: 0, y: 3, w: 12, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 8 },

      { i: "berth", x: 0, y: 6, w: 12, h: 10, minW: 1, minH: 6, maxW: 12, maxH: 24 },

      { i: "trend", x: 0, y: 16, w: 6, h: 5, minW: 1, minH: 3, maxW: 12, maxH: 12 },
      { i: "events", x: 6, y: 16, w: 6, h: 5, minW: 1, minH: 3, maxW: 12, maxH: 16 },

      { i: "shortcuts", x: 0, y: 21, w: 12, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 8 },
    ],
  }),

  oncall: () => ({
    visible: {
      stats: false,
      shipStatus: true,
      todayUsage: false,
      berth: true,
      trend: false,
      events: true,
      shortcuts: false,
    },
    layout: [
      { i: "shipStatus", x: 0, y: 0, w: 4, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 10 },
      { i: "events", x: 4, y: 0, w: 8, h: 6, minW: 1, minH: 4, maxW: 12, maxH: 18 },

      { i: "berth", x: 0, y: 6, w: 12, h: 10, minW: 1, minH: 6, maxW: 12, maxH: 24 },

      { i: "stats", x: 0, y: 16, w: 8, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 8 },
      { i: "todayUsage", x: 0, y: 19, w: 12, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 8 },
      { i: "trend", x: 0, y: 22, w: 6, h: 4, minW: 1, minH: 3, maxW: 12, maxH: 12 },
      { i: "shortcuts", x: 0, y: 26, w: 12, h: 3, minW: 1, minH: 2, maxW: 12, maxH: 8 },
    ],
  }),
};

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v && typeof v === "object" ? v : fallback;
  } catch {
    return fallback;
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function migrateLayoutTo12(layout) {
  const arr = Array.isArray(layout) ? layout : [];
  if (!arr.length) return arr;

  const looks4Cols = arr.every((it) => (it?.maxW ?? 4) <= 4 && (it?.w ?? 4) <= 4);
  if (!looks4Cols) return arr;

  const factor = 3;
  return arr.map((it) => {
    const next = { ...it };
    const minW = next.minW ?? 1;
    const maxW = next.maxW ?? 4;

    next.x = Math.round((next.x ?? 0) * factor);
    next.w = Math.round((next.w ?? 1) * factor);
    next.minW = Math.round(minW * factor);
    next.maxW = Math.round(maxW * factor);

    next.minW = clamp(next.minW, 1, GRID_COLS);
    next.maxW = clamp(next.maxW, 1, GRID_COLS);
    next.w = clamp(next.w, next.minW, next.maxW);

    if ((next.x ?? 0) + next.w > GRID_COLS) {
      next.x = Math.max(0, GRID_COLS - next.w);
    }
    return next;
  });
}

function updateLayoutItemWH(layout, key, nextW, nextH, cols) {
  const cloned = Array.isArray(layout) ? layout.map((x) => ({ ...x })) : [];
  const idx = cloned.findIndex((x) => x.i === key);
  if (idx === -1) return cloned;

  const item = cloned[idx];

  const minW = item.minW ?? 1;
  const maxW = item.maxW ?? cols;
  const minH = item.minH ?? 1;
  const maxH = item.maxH ?? 999;

  const w = clamp(Number(nextW) || item.w || 1, minW, maxW);
  const h = clamp(Number(nextH) || item.h || 1, minH, maxH);

  let x = item.x ?? 0;
  if (x + w > cols) x = Math.max(0, cols - w);

  cloned[idx] = { ...item, x, w, h };
  return cloned;
}

function applyBerthOrder(list, order) {
  const map = new Map(list.map((x) => [x.berthId, x]));
  const ordered = [];
  (order || []).forEach((id) => {
    const hit = map.get(id);
    if (hit) ordered.push(hit);
    map.delete(id);
  });
  for (const v of map.values()) ordered.push(v);
  return ordered;
}

function getItem(layout, key) {
  return (layout || []).find((x) => x.i === key);
}

function mergeLayoutsKeepAll(prevLayout, nextPartialLayout) {
  const prev = Array.isArray(prevLayout) ? prevLayout : [];
  const next = Array.isArray(nextPartialLayout) ? nextPartialLayout : [];

  const nextMap = new Map(next.map((x) => [x.i, x]));
  const merged = prev.map((p) => (nextMap.has(p.i) ? { ...p, ...nextMap.get(p.i) } : p));

  const prevSet = new Set(prev.map((x) => x.i));
  next.forEach((n) => {
    if (!prevSet.has(n.i)) merged.push({ ...n });
  });

  return merged;
}

function ensureLayoutItem(layout, key) {
  const arr = Array.isArray(layout) ? [...layout] : [];
  if (arr.some((x) => x.i === key)) return arr;

  const def = getItem(DEFAULT_CFG.layout, key);
  if (def) arr.push({ ...def });
  return arr;
}

function SortableBerthItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: DndCSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "sp-berthSortItem",
        isDragging ? "is-dragging" : "",
        isOver ? "is-over" : "",
      ].join(" ")}
      data-berth-id={id}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="sp-berthSortHandle"
        title="拖曳排序"
        {...attributes}
        {...listeners}
      >
        <FiMove />
      </button>

      <div className={isDragging ? "sp-berthSortItem__dragging" : ""}>{children}</div>
    </div>
  );
}

export default function ShorePowerDashboard() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("ALL");

  const [cfg, setCfg] = useState(() => {
    const saved = safeParse(localStorage.getItem(LS_KEY), null);
    if (!saved) return DEFAULT_CFG;

    const merged = { ...DEFAULT_CFG, ...saved };
    if (saved?.layout) merged.layout = migrateLayoutTo12(saved.layout);

    ["shipStatus", "todayUsage", "stats", "trend", "events", "shortcuts", "berth"].forEach((k) => {
      merged.layout = ensureLayoutItem(merged.layout, k);
    });

    merged.visible = { ...DEFAULT_CFG.visible, ...(saved.visible || {}) };
    return merged;
  });

  const [openPanel, setOpenPanel] = useState(false);

  const [sizePopover, setSizePopover] = useState({ open: false, key: null, top: 0, left: 0 });
  const popoverRef = useRef(null);

  const [resizeHint, setResizeHint] = useState({
    show: false,
    key: null,
    w: 0,
    h: 0,
    pxW: 0,
    pxH: 0,
  });

  const [dragState, setDragState] = useState({ draggingKey: null, targetKey: null });

  const [rglOverlay, setRglOverlay] = useState({
    on: false,
    key: null,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    dx: 0,
    dy: 0,
  });

  const [activeBerthId, setActiveBerthId] = useState(null);
  const [berthOverlaySize, setBerthOverlaySize] = useState({ w: 0, h: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  }, [cfg]);

  useEffect(() => {
    function onDocDown(e) {
      if (!sizePopover.open) return;
      const pop = popoverRef.current;
      if (pop && pop.contains(e.target)) return;
      setSizePopover({ open: false, key: null, top: 0, left: 0 });
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [sizePopover.open]);

  useEffect(() => {
    if (!rglOverlay.on) return;
    const onMove = (e) => {
      setRglOverlay((p) => (p.on ? { ...p, x: e.clientX - p.dx, y: e.clientY - p.dy } : p));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [rglOverlay.on]);

  const visibleKeys = useMemo(() => {
    const v = cfg.visible || {};
    return Object.keys(v).filter((k) => v[k]);
  }, [cfg.visible]);

  const setVisible = (key, val) => {
    setCfg((p) => {
      const next = { ...p, visible: { ...(p.visible || {}), [key]: val } };
      if (val) next.layout = ensureLayoutItem(next.layout, key);
      return next;
    });
  };

  const resetLayout = () => {
    setCfg({
      visible: DEFAULT_CFG.visible,
      layout: DEFAULT_CFG.layout,
      berthOrder: DEFAULT_CFG.berthOrder,
    });
  };

  const onLayoutChange = (nextPartialLayout) => {
    setCfg((p) => ({
      ...p,
      layout: mergeLayoutsKeepAll(p.layout || DEFAULT_CFG.layout, nextPartialLayout),
    }));
  };

  const metrics = useMemo(() => {
    const powering = BERTHS.filter((x) => x.status === "POWERING").length;
    const ready = BERTHS.filter((x) => x.status === "READY").length;
    const alarm = BERTHS.filter((x) => x.status === "ALARM").length;

    const totalKW = sum(BERTHS.map((x) => x.kW));
    const totalKwhToday = sum(BERTHS.map((x) => x.kWhToday));
    const totalWaterToday = sum(BERTHS.map((x) => x.waterToday_m3));

    const r = sum(BERTHS.map((x) => x.amps?.r));
    const s = sum(BERTHS.map((x) => x.amps?.s));
    const t = sum(BERTHS.map((x) => x.amps?.t));

    return { powering, ready, alarm, totalKW, totalKwhToday, totalWaterToday, phase: { r, s, t } };
  }, []);

  const orderedBerths = useMemo(() => {
    const ordered = applyBerthOrder(BERTHS, cfg.berthOrder);
    const kw = keyword.trim();
    return ordered.filter((x) => {
      const okStatus = status === "ALL" ? true : x.status === status;
      const okKw = !kw ? true : x.berthName.includes(kw);
      return okStatus && okKw;
    });
  }, [cfg.berthOrder, keyword, status]);

  const onOpenBerth = (item) => {
    alert(`開啟：${item.berthName}（之後導到席位詳細頁）`);
  };

  const onBerthDragStart = (event) => {
    setActiveBerthId(event.active?.id ?? null);

    // ✅ 取 active item 實際尺寸，讓 DragOverlay 更貼近原卡片
    const r = event?.active?.rect?.current?.initial;
    if (r?.width && r?.height) setBerthOverlaySize({ w: r.width, h: r.height });
    else setBerthOverlaySize({ w: 0, h: 0 });
  };

  const onBerthDragEnd = (event) => {
    const { active, over } = event;
    setActiveBerthId(null);
    setBerthOverlaySize({ w: 0, h: 0 });

    if (!over) return;
    if (active.id === over.id) return;

    setCfg((p) => {
      const ids = Array.isArray(p.berthOrder) ? [...p.berthOrder] : [];
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      if (oldIndex < 0 || newIndex < 0) return p;
      return { ...p, berthOrder: arrayMove(ids, oldIndex, newIndex) };
    });
  };

  const onBerthDragCancel = () => {
    setActiveBerthId(null);
    setBerthOverlaySize({ w: 0, h: 0 });
  };

  const activeBerthItem = useMemo(() => {
    if (!activeBerthId) return null;
    return BERTHS.find((b) => b.berthId === activeBerthId) || null;
  }, [activeBerthId]);

  const DragHandle = (
    <span className="sp-dragHandle" title="拖曳更換位置">
      <FiMove />
    </span>
  );

  const openSizePopover = (key, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setSizePopover({
      open: true,
      key,
      top: rect.bottom + 8 + window.scrollY,
      left: rect.right - 260 + window.scrollX,
    });
  };

  const applySize = (key, w, h, opts = { close: true }) => {
    setCfg((p) => ({
      ...p,
      layout: updateLayoutItemWH(p.layout, key, w, h, GRID_COLS),
    }));
    if (opts?.close) setSizePopover({ open: false, key: null, top: 0, left: 0 });
  };

  const PRESETS = {
    S: { w: 4, h: 3 },
    M: { w: 6, h: 4 },
    L: { w: 12, h: 8 },
  };

  const getCurrentWH = (key) => {
    const it = getItem(cfg.layout, key) || getItem(DEFAULT_CFG.layout, key);
    return {
      w: it?.w ?? 1,
      h: it?.h ?? 1,
      minW: it?.minW ?? 1,
      minH: it?.minH ?? 1,
      maxW: it?.maxW ?? GRID_COLS,
      maxH: it?.maxH ?? 999,
    };
  };

  const SizePopover = sizePopover.open ? (() => {
    const key = sizePopover.key;
    const cur = getCurrentWH(key);

    return (
      <div
        ref={popoverRef}
        className="sp-sizePopover"
        style={{ top: sizePopover.top, left: sizePopover.left }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sp-sizePopover__hd">
          <div className="sp-sizePopover__title">卡片大小</div>
          <button
            type="button"
            className="sp-iconBtn sp-iconBtn--sm"
            onClick={() => setSizePopover({ open: false, key: null, top: 0, left: 0 })}
            title="關閉"
          >
            <FiX />
          </button>
        </div>

        <div className="sp-sizePopover__row sp-muted">
          目前：<b>{cur.w} × {cur.h}</b>（格）
        </div>

        <div className="sp-sizePopover__row">
          <div className="sp-sizePopover__label">快速預設</div>
          <div className="sp-sizePopover__btns">
            <button type="button" className="sp-chip" onClick={() => applySize(key, PRESETS.S.w, PRESETS.S.h, { close: true })}>
              小 {PRESETS.S.w}×{PRESETS.S.h}
            </button>
            <button type="button" className="sp-chip" onClick={() => applySize(key, PRESETS.M.w, PRESETS.M.h, { close: true })}>
              中 {PRESETS.M.w}×{PRESETS.M.h}
            </button>
            <button type="button" className="sp-chip" onClick={() => applySize(key, PRESETS.L.w, PRESETS.L.h, { close: true })}>
              大 {PRESETS.L.w}×{PRESETS.L.h}
            </button>
          </div>
        </div>

        <div className="sp-sizePopover__row">
          <div className="sp-sizePopover__label">微調（不關閉視窗）</div>
          <div className="sp-sizePopover__steppers">
            <div className="sp-stepper">
              <span className="sp-stepper__k">寬</span>
              <button type="button" onClick={() => applySize(key, cur.w - 1, cur.h, { close: false })}>-</button>
              <span className="sp-stepper__v">{cur.w}</span>
              <button type="button" onClick={() => applySize(key, cur.w + 1, cur.h, { close: false })}>+</button>
            </div>

            <div className="sp-stepper">
              <span className="sp-stepper__k">高</span>
              <button type="button" onClick={() => applySize(key, cur.w, cur.h - 1, { close: false })}>-</button>
              <span className="sp-stepper__v">{cur.h}</span>
              <button type="button" onClick={() => applySize(key, cur.w, cur.h + 1, { close: false })}>+</button>
            </div>
          </div>

          <div className="sp-muted" style={{ marginTop: 6 }}>
            限制：寬 {cur.minW}~{cur.maxW}、高 {cur.minH}~{cur.maxH}
          </div>
        </div>
      </div>
    );
  })() : null;

  const BerthFilters = (
    <div className="sp-berthFilters">
      <div className="sp-filter sp-filter--mini">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜尋船位（例如：船位 03）"
        />
      </div>

      <div className="sp-tabs sp-tabs--mini">
        {[
          ["ALL", "全部"],
          ["POWERING", "供電中"],
          ["READY", "待啟動"],
          ["ALARM", "異常"],
          ["OFFLINE", "離線"],
        ].map(([k, label]) => (
          <button
            key={k}
            className={`sp-tab ${status === k ? "is-active" : ""}`}
            onClick={() => setStatus(k)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="sp-muted">共 {orderedBerths.length} 席</div>

      <button type="button" className="sp-iconBtn" title="調整卡片大小" onClick={(e) => openSizePopover("berth", e)}>
        <FiSettings />
      </button>

      {DragHandle}
    </div>
  );

  const applyQuickPreset = (mode) => {
    const maker = PRESET_CFGS[mode];
    if (!maker) return;

    setCfg((p) => {
      const next = maker();
      const keepOrder =
        Array.isArray(p.berthOrder) && p.berthOrder.length ? p.berthOrder : DEFAULT_CFG.berthOrder;

      const needKeys = ["stats", "shipStatus", "todayUsage", "berth", "trend", "events", "shortcuts"];
      let fullLayout = next.layout;
      needKeys.forEach((k) => (fullLayout = ensureLayoutItem(fullLayout, k)));

      return {
        ...p,
        visible: { ...DEFAULT_CFG.visible, ...(next.visible || {}) },
        layout: fullLayout,
        berthOrder: keepOrder,
      };
    });

    setOpenPanel(false);
  };

  const SidePanel = (
    <>
      {openPanel ? <div className="sp-sideBackdrop" onClick={() => setOpenPanel(false)} /> : null}

      <div className={`sp-sidePanel sp-sidePanel--drawer ${openPanel ? "is-open" : ""}`}>
        <div className="sp-sidePanel__hd">
          <div className="sp-sidePanel__title">版面設定</div>
          <button type="button" className="sp-iconBtn" title="關閉" onClick={() => setOpenPanel(false)}>
            <FiX />
          </button>
        </div>

        <div className="sp-sidePanel__bd">
          <div className="sp-sidePanel__sectionTitle">快速套用</div>
          <div className="sp-presetRow">
            <button className="sp-presetBtn" type="button" onClick={() => applyQuickPreset("standard")}>
              標準
            </button>
            <button className="sp-presetBtn" type="button" onClick={() => applyQuickPreset("wallboard")}>
              監控大屏
            </button>
            <button className="sp-presetBtn" type="button" onClick={() => applyQuickPreset("oncall")}>
              值班模式
            </button>
          </div>

          <div className="sp-sidePanel__sectionTitle" style={{ marginTop: 14 }}>顯示內容</div>
          <div className="sp-sidePanel__checks">
            {[
              ["stats", "統計總覽"],
              ["shipStatus", "船舶狀態概覽"],
              ["todayUsage", "今日用量"],
              ["berth", "船位總覽"],
              ["trend", "即時趨勢"],
              ["events", "最新事件"],
              ["shortcuts", "快捷入口"],
            ].map(([k, label]) => (
              <label key={k}>
                <input type="checkbox" checked={!!cfg.visible[k]} onChange={(e) => setVisible(k, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>

          <div className="sp-sidePanel__tips sp-muted">
            每張卡片右上 <FiSettings /> 可調整大小；縮放中會顯示尺寸預覽。
          </div>

          <button className="sp-btn sp-btn--ghost sp-sidePanel__reset" type="button" onClick={resetLayout}>
            還原預設版面
          </button>
        </div>
      </div>

      {!openPanel ? (
        <button className="sp-sideFab" type="button" onClick={() => setOpenPanel(true)} title="開啟版面設定">
          <FiSettings />
        </button>
      ) : null}
    </>
  );

  const computeTargetKey = (layout, movingItem) => {
    if (!movingItem) return null;
    const a = { x: movingItem.x, y: movingItem.y, w: movingItem.w, h: movingItem.h };
    const overlap = (p) => a.x < p.x + p.w && a.x + a.w > p.x && a.y < p.y + p.h && a.y + a.h > p.y;
    const hit = (layout || []).find((p) => p.i !== movingItem.i && overlap(p));
    return hit?.i ?? null;
  };

  const renderWidgetByKey = (key, { overlay = false } = {}) => {
    const rightWrap = (k) => (
      <div className="sp-cardRight">
        <button type="button" className="sp-iconBtn" title="調整卡片大小" onClick={(e) => openSizePopover(k, e)}>
          <FiSettings />
        </button>
        {DragHandle}
      </div>
    );

    const overlayProps = overlay ? { onClickCapture: (e) => e.preventDefault() } : {};

    if (key === "shipStatus") {
      return (
        <SectionCard title="船舶狀態概覽" right={rightWrap("shipStatus")}>
          <div className="sp-stats sp-stats--shipStatus" {...overlayProps}>
            <StatsCard title="供電中" value={`${metrics.powering} 席`} icon={<FaBolt />} tone="ok" />
            <StatsCard title="待啟動" value={`${metrics.ready} 席`} icon={<LuPower />} tone="info" />
            <StatsCard title="異常" value={`${metrics.alarm} 席`} icon={<MdOutlineErrorOutline />} tone="alarm" />
          </div>
        </SectionCard>
      );
    }

    if (key === "todayUsage") {
      return (
        <SectionCard title="今日用量" right={rightWrap("todayUsage")}>
          <div className="sp-stats sp-stats--todayUsage" {...overlayProps}>
            <StatsCard title="今日用電量" value={`${metrics.totalKwhToday.toFixed(1)} kWh`} sub="全席加總" icon={<FaBolt />} />
            <StatsCard title="今日用水量" value={`${metrics.totalWaterToday.toFixed(2)} m³`} sub="全席加總" icon={<FaWater />} />
          </div>
        </SectionCard>
      );
    }

    if (key === "stats") {
      return (
        <SectionCard title="統計總覽" right={rightWrap("stats")}>
          <div className="sp-stats" {...overlayProps}>
            <StatsCard title="總功率" value={`${metrics.totalKW.toFixed(1)} kW`} sub="即時加總" icon={<FaRegClock />} />
            <StatsCard title="R 相電流" value={`${metrics.phase.r.toFixed(0)} A`} sub="全席加總" icon={<TbCircuitAmmeter />} />
            <StatsCard title="S 相電流" value={`${metrics.phase.s.toFixed(0)} A`} sub="全席加總" icon={<TbCircuitAmmeter />} />
            <StatsCard title="T 相電流" value={`${metrics.phase.t.toFixed(0)} A`} sub="全席加總" icon={<TbCircuitAmmeter />} />
          </div>
        </SectionCard>
      );
    }

    if (key === "berth") {
      // ✅ 這裡是本次關鍵修正：DragOverlay 用 createPortal 掛到 body，避免被 transform 影響而偏移
      const overlayNode =
        typeof document !== "undefined"
          ? createPortal(
              <DragOverlay dropAnimation={null} adjustScale={false} className="sp-dndOverlay">
                {activeBerthItem ? (
                  <div
                    className="sp-berthOverlay"
                    style={berthOverlaySize.w ? { width: berthOverlaySize.w, height: berthOverlaySize.h } : undefined}
                  >
                    <BerthCard item={activeBerthItem} onClick={() => {}} />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )
          : null;

      return (
        <SectionCard title="船位總覽" right={BerthFilters}>
          <div className="sp-berthList sp-berthList--inGrid">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={onBerthDragStart}
              onDragEnd={onBerthDragEnd}
              onDragCancel={onBerthDragCancel}
            >
              <SortableContext items={orderedBerths.map((x) => x.berthId)} strategy={rectSortingStrategy}>
                {orderedBerths.map((x) => (
                  <SortableBerthItem key={x.berthId} id={x.berthId}>
                    <BerthCard item={x} onClick={onOpenBerth} />
                  </SortableBerthItem>
                ))}
              </SortableContext>

              {overlayNode}
            </DndContext>
          </div>
        </SectionCard>
      );
    }

    if (key === "trend") {
      return (
        <SectionCard title="即時趨勢" right={rightWrap("trend")}>
          <div className="sp-trendGrid" {...overlayProps}>
            <div className="sp-trendItem">
              <div className="sp-trendTitle">總功率</div>
              <MiniTrend data={[12, 15, 18, 13, 16, 22, 19, 24, 20, 21]} />
            </div>
            <div className="sp-trendItem">
              <div className="sp-trendTitle">用水量</div>
              <MiniTrend data={[2, 3, 4, 2, 5, 4, 6, 5, 4, 6]} />
            </div>
          </div>
        </SectionCard>
      );
    }

    if (key === "events") {
      return (
        <SectionCard title="最新事件 / 告警" right={rightWrap("events")}>
          <div {...overlayProps}>
            <EventList items={EVENTS} />
          </div>
        </SectionCard>
      );
    }

    if (key === "shortcuts") {
      return (
        <SectionCard title="快捷入口" right={rightWrap("shortcuts")}>
          <div className="sp-shortcuts" {...overlayProps}>
            <button className="sp-btn" type="button">進入：席位控制</button>
            <button className="sp-btn" type="button">進入：告警中心</button>
            <button className="sp-btn" type="button">進入：排程器</button>
            <button className="sp-btn" type="button">進入：歷史報表</button>
            <button className="sp-btn" type="button">進入：操作稽核</button>
          </div>
        </SectionCard>
      );
    }

    return null;
  };

  return (
    <div className="sp-page sp-noX">
      {SidePanel}

      <div className="sp-header">
        <div>
          <div className="sp-h1">岸電總覽</div>
          <div className="sp-sub">11 席船位即時狀態、功率、用電用水與事件監控</div>
        </div>
      </div>

      <div className="sp-gridWrap">
        <ResponsiveGridLayout
          className="layout"
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: GRID_COLS, md: GRID_COLS, sm: 6, xs: 2, xxs: 1 }}
          rowHeight={ROW_HEIGHT}
          margin={[14, 14]}
          containerPadding={[0, 0]}
          preventCollision={false}
          compactType="vertical"
          useCSSTransforms={true}
          draggableHandle=".sp-dragHandle"
          draggableCancel=".sp-card__bd, input, button, .sp-berthList, .sp-sizePopover"
          layouts={{
            lg: (cfg.layout || DEFAULT_CFG.layout).filter((l) => visibleKeys.includes(l.i)),
          }}
          onLayoutChange={onLayoutChange}
          onDragStart={(layout, oldItem, newItem, placeholder, e, element) => {
            const key = newItem?.i;
            setDragState({ draggingKey: key, targetKey: null });

            try {
              const rect = element?.getBoundingClientRect?.();
              if (rect && e) {
                const dx = e.clientX - rect.left;
                const dy = e.clientY - rect.top;

                setRglOverlay({
                  on: true,
                  key,
                  x: rect.left,
                  y: rect.top,
                  w: rect.width,
                  h: rect.height,
                  dx,
                  dy,
                });
              }
            } catch {
              // ignore
            }
          }}
          onDrag={(layout, oldItem, newItem, placeholder, e) => {
            const target = computeTargetKey(layout, newItem);
            setDragState((p) => ({ draggingKey: p.draggingKey, targetKey: target }));

            if (e && rglOverlay.on) {
              setRglOverlay((p) => (p.on ? { ...p, x: e.clientX - p.dx, y: e.clientY - p.dy } : p));
            }
          }}
          onDragStop={() => {
            setDragState({ draggingKey: null, targetKey: null });
            setRglOverlay({ on: false, key: null, x: 0, y: 0, w: 0, h: 0, dx: 0, dy: 0 });
          }}
          onResize={(_, item) => {
            setResizeHint({
              show: true,
              key: item.i,
              w: item.w,
              h: item.h,
              pxW: item.w * (1200 / GRID_COLS),
              pxH: item.h * ROW_HEIGHT,
            });
          }}
          onResizeStop={() => {
            setTimeout(() => setResizeHint({ show: false, key: null, w: 0, h: 0, pxW: 0, pxH: 0 }), 450);
          }}
        >
          {visibleKeys.map((k) => (
            <div
              key={k}
              className={[
                "sp-widget",
                dragState.draggingKey === k ? "is-dragging" : "",
                dragState.targetKey === k ? "is-target" : "",
              ].join(" ")}
            >
              {renderWidgetByKey(k)}
              {resizeHint.show && resizeHint.key === k ? (
                <div className="sp-resizeHint">
                  {resizeHint.w}×{resizeHint.h} 格 · 約 {Math.round(resizeHint.pxH)}px 高
                </div>
              ) : null}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {SizePopover}

      {rglOverlay.on && rglOverlay.key ? (
        <div
          className="sp-rglOverlay"
          style={{ left: rglOverlay.x, top: rglOverlay.y, width: rglOverlay.w, height: rglOverlay.h }}
        >
          <div className="sp-rglOverlay__inner">{renderWidgetByKey(rglOverlay.key, { overlay: true })}</div>
        </div>
      ) : null}
    </div>
  );
}
