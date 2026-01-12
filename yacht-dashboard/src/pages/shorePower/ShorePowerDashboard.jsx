// 岸電儀錶板
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/shorePower/ShorePowerDashboard.css";

// 資料來源 mock，之後接 API 時改成 state + fetch
import { BERTHS, EVENTS } from "../../data/shorePower/shorePowerMock";

// 這些都是「純 UI 元件」：只負責顯示，不負責抓資料
import SectionCard from "../../components/shorePower/SectionCard";
import StatsCard from "../../components/shorePower/StatsCard";
import BerthCard from "../../components/shorePower/BerthCard";
import EventList from "../../components/shorePower/EventList";
import MiniTrend from "../../components/shorePower/MiniTrend";

// icon
import { FaBolt, FaWater, FaRegClock } from "react-icons/fa";
import { MdOutlineErrorOutline } from "react-icons/md";
import { LuPower } from "react-icons/lu";
import { TbCircuitAmmeter } from "react-icons/tb";
import { FiMove, FiSettings, FiX } from "react-icons/fi";

// 儀表板版面：可拖曳/可縮放（widget 層級）
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// 船位卡片排序：只用在「船位總覽」內部（BerthCard 列表）
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

// 版面設定會存到 localStorage，讓使用者下次開啟能沿用
const LS_KEY = "shorePower.dashboard.v3";

//  layout 用 12 欄為基準（lg / md）
const GRID_COLS = 12;
const ROW_HEIGHT = 48;

/**
 * DEFAULT_CFG 是整頁「儀表板拼裝」的核心：
 * - visible：哪些區塊要顯示（勾選/取消）
 * - layout：每個區塊的位置(x,y) 與大小(w,h)
 * - berthOrder：船位卡片的排序（dnd-kit 拖曳後會更新）
 *
 * i 是 widget key（必須對應到 renderWidgetByKey 裡的 key）
 */
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

// 快速套用三種版面：標準 / 大屏 / 值班
// 這裡只提供「版面與顯示」，船位排序會在 applyQuickPreset 裡保留使用者順序
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

/**
 * 早期版本可能用 4 欄 layout，後來改成 12 欄
 * 這個 migrate 會把舊資料放大到新系統（避免使用者 localStorage 壞掉）
 */
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

// 調整指定 widget 的寬高（w/h），並確保不超出 min/max 與 cols
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

// 依 cfg.berthOrder 對 BERTHS 做排序；沒有出現在 order 的會追加在最後
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

/**
 * react-grid-layout 的 onLayoutChange 只會回傳「可見」的那些 item
 * 但需要保留「不可見 item 的 layout」以便之後勾回來還有位置
 * 所以這裡用 merge 的方式保留全部
 */
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

// 保證 layout 一定存在某個 key（如果 localStorage 少了一塊，就補回 default）
function ensureLayoutItem(layout, key) {
  const arr = Array.isArray(layout) ? [...layout] : [];
  if (arr.some((x) => x.i === key)) return arr;

  const def = getItem(DEFAULT_CFG.layout, key);
  if (def) arr.push({ ...def });
  return arr;
}

/*
  SortableBerthItem 是船位卡片排序的外殼：
  - 真正的卡片是 children（BerthCard）
  - 右上角的 FiMove 是「拖曳把手」
 */
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

      {/* 拖曳中可以套不同樣式（例如陰影/透明），避免跟原卡片混在一起 */}
      <div className={isDragging ? "sp-berthSortItem__dragging" : ""}>
        {children}
      </div>
    </div>
  );
}

export default function ShorePowerDashboard() {
  // 船位搜尋與狀態篩選（只作用在「船位總覽」那塊）
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("ALL");

  /*
    cfg = 儀表板的「使用者版面設定」
    會從 localStorage 讀回來，並做 migrate / 補齊缺塊
   */
  const [cfg, setCfg] = useState(() => {
    const saved = safeParse(localStorage.getItem(LS_KEY), null);
    if (!saved) return DEFAULT_CFG;

    const merged = { ...DEFAULT_CFG, ...saved };
    if (saved?.layout) merged.layout = migrateLayoutTo12(saved.layout);

    // 避免舊設定少了某個 widget，造成 visible 勾回來卻沒有 layout 可用
    ["shipStatus", "todayUsage", "stats", "trend", "events", "shortcuts", "berth"].forEach((k) => {
      merged.layout = ensureLayoutItem(merged.layout, k);
    });

    merged.visible = { ...DEFAULT_CFG.visible, ...(saved.visible || {}) };
    return merged;
  });

  // 版面設定抽屜是否打開
  const [openPanel, setOpenPanel] = useState(false);

  // 卡片大小 popover 的定位狀態（點右上齒輪出現）
  const [sizePopover, setSizePopover] = useState({ open: false, key: null, top: 0, left: 0 });
  const popoverRef = useRef(null);

  // 拖曳縮放時顯示的尺寸提示（例如 6×4 格）
  const [resizeHint, setResizeHint] = useState({
    show: false,
    key: null,
    w: 0,
    h: 0,
    pxW: 0,
    pxH: 0,
  });

  // 拖曳 widget 時，用來高亮「正在拖的」與「被碰到的目標」
  const [dragState, setDragState] = useState({ draggingKey: null, targetKey: null });

  /**
   * rglOverlay：拖曳 widget 時的跟隨預覽層
   * 目的：拖起來更像「把卡片抓起來移動」，而不是只看到 placeholder
   */
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

  // 船位卡片排序拖曳時：目前被拖的 berthId
  const [activeBerthId, setActiveBerthId] = useState(null);

  // 用於 DragOverlay：讓拖起來的卡片尺寸跟原卡片一致，避免看起來縮放怪怪的
  const [berthOverlaySize, setBerthOverlaySize] = useState({ w: 0, h: 0 });

  // dnd-kit：避免輕微滑動就觸發拖曳，distance=6 比較像「真的拖」
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  // cfg 變動就保存（版面/顯示/船位排序都在 cfg 裡）
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
  }, [cfg]);

  // 點 popover 外面就關閉（這種 UX 用 document 監聽最穩）
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

  // widget 預覽 overlay 跟著滑鼠跑
  useEffect(() => {
    if (!rglOverlay.on) return;
    const onMove = (e) => {
      setRglOverlay((p) => (p.on ? { ...p, x: e.clientX - p.dx, y: e.clientY - p.dy } : p));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [rglOverlay.on]);

  // 目前要渲染哪些 widget（由 cfg.visible 決定）
  const visibleKeys = useMemo(() => {
    const v = cfg.visible || {};
    return Object.keys(v).filter((k) => v[k]);
  }, [cfg.visible]);

  // 勾選顯示/隱藏某個 widget
  // 勾回來時順便確保 layout 有該 key（避免舊設定缺 layout）
  const setVisible = (key, val) => {
    setCfg((p) => {
      const next = { ...p, visible: { ...(p.visible || {}), [key]: val } };
      if (val) next.layout = ensureLayoutItem(next.layout, key);
      return next;
    });
  };

  // 還原整頁預設（也包含船位排序）
  const resetLayout = () => {
    setCfg({
      visible: DEFAULT_CFG.visible,
      layout: DEFAULT_CFG.layout,
      berthOrder: DEFAULT_CFG.berthOrder,
    });
  };

  // react-grid-layout 的 layout 變更回傳的是 partial，這裡 merge 回 cfg.layout（保留不可見卡片）
  const onLayoutChange = (nextPartialLayout) => {
    setCfg((p) => ({
      ...p,
      layout: mergeLayoutsKeepAll(p.layout || DEFAULT_CFG.layout, nextPartialLayout),
    }));
  };

  /*
    指標統計（上方 StatsCard 會用）
    目前 BERTHS 是常數 mock，所以 dependency 用 []
    之後改成 API 取得（berths state），這裡改成 [berths]
   */
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

  // 船位列表：先套使用者排序，再做搜尋/狀態篩選
  const orderedBerths = useMemo(() => {
    const ordered = applyBerthOrder(BERTHS, cfg.berthOrder);
    const kw = keyword.trim();
    return ordered.filter((x) => {
      const okStatus = status === "ALL" ? true : x.status === status;
      const okKw = !kw ? true : x.berthName.includes(kw);
      return okStatus && okKw;
    });
  }, [cfg.berthOrder, keyword, status]);

  // 點船位卡片的行為：目前先 alert，之後可導到席位詳情或開 modal
  const onOpenBerth = (item) => {
    alert(`開啟：${item.berthName}（之後導到席位詳細頁）`);
  };

  // 船位卡片拖曳開始（dnd-kit）
  const onBerthDragStart = (event) => {
    setActiveBerthId(event.active?.id ?? null);

    // 取 active item 的實際尺寸，DragOverlay 用這個尺寸渲染會更像原卡片
    const r = event?.active?.rect?.current?.initial;
    if (r?.width && r?.height) setBerthOverlaySize({ w: r.width, h: r.height });
    else setBerthOverlaySize({ w: 0, h: 0 });
  };

  // 船位卡片拖曳結束：把 berthOrder 更新回 cfg（存 localStorage）
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

  // 目前被拖的那張船位卡片（DragOverlay 會用它）
  const activeBerthItem = useMemo(() => {
    if (!activeBerthId) return null;
    return BERTHS.find((b) => b.berthId === activeBerthId) || null;
  }, [activeBerthId]);

  // react-grid-layout widget 拖曳把手（只有抓這個才會拖整個 widget）
  const DragHandle = (
    <span className="sp-dragHandle" title="拖曳更換位置">
      <FiMove />
    </span>
  );

  // 開啟「卡片大小」popover（靠按鈕座標定位）
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

  // 套用大小到 cfg.layout（w/h），並決定要不要關閉 popover
  const applySize = (key, w, h, opts = { close: true }) => {
    setCfg((p) => ({
      ...p,
      layout: updateLayoutItemWH(p.layout, key, w, h, GRID_COLS),
    }));
    if (opts?.close) setSizePopover({ open: false, key: null, top: 0, left: 0 });
  };

  // 快速尺寸預設（格數）
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

  // 尺寸 popover（點卡片右上齒輪出現）
  // 這段寫成 IIFE 是因為要依 key 抓當下尺寸並渲染內容
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

  // 船位總覽的上方工具列：搜尋 + 狀態 tabs + 數量 + 調整大小 + 拖曳把手
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

      {/* 這個齒輪是調整「整塊船位總覽 widget」的大小（不是單一卡片） */}
      <button type="button" className="sp-iconBtn" title="調整卡片大小" onClick={(e) => openSizePopover("berth", e)}>
        <FiSettings />
      </button>

      {DragHandle}
    </div>
  );

  // 套用快速版面，保留使用者的 berthOrder（避免船位順序突然重置）
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

  // 右側抽屜：版面設定（顯示/隱藏 + 快速套用 + 還原）
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

  // 拖曳 widget 時：用「矩形重疊」找出目前撞到哪一個 widget（用來做 is-target 高亮）
  const computeTargetKey = (layout, movingItem) => {
    if (!movingItem) return null;
    const a = { x: movingItem.x, y: movingItem.y, w: movingItem.w, h: movingItem.h };
    const overlap = (p) => a.x < p.x + p.w && a.x + a.w > p.x && a.y < p.y + p.h && a.y + a.h > p.y;
    const hit = (layout || []).find((p) => p.i !== movingItem.i && overlap(p));
    return hit?.i ?? null;
  };

  /*
    這個函式就是「儀表板拼裝表」：
    key = widget 的名稱（layout 的 i）
    回傳對應的 SectionCard + 內容元件
   */
  const renderWidgetByKey = (key, { overlay = false } = {}) => {
    // 每張 widget 的右上角都放：調整大小 + 拖曳把手
    const rightWrap = (k) => (
      <div className="sp-cardRight">
        <button type="button" className="sp-iconBtn" title="調整卡片大小" onClick={(e) => openSizePopover(k, e)}>
          <FiSettings />
        </button>
        {DragHandle}
      </div>
    );

    // overlay 模式是給 rglOverlay 預覽用的：避免點擊/互動穿透造成奇怪行為
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
      // DragOverlay 若放在 RGL 的 transform 容器內，拖曳時容易產生位移/縮放錯亂
      // 這裡用 createPortal 掛到 body，讓 overlay 脫離 transform 影響
      const overlayNode =
        typeof document !== "undefined"
          ? createPortal(
            <DragOverlay dropAnimation={null} adjustScale={false} className="sp-dndOverlay">
              {activeBerthItem ? (
                <div
                  className="sp-berthOverlay"
                  style={berthOverlaySize.w ? { width: berthOverlaySize.w, height: berthOverlaySize.h } : undefined}
                >
                  <BerthCard item={activeBerthItem} onClick={() => { }} />
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
            <button className="sp-btn" type="button">進入：即時監控</button>
            <button className="sp-btn" type="button">進入：告警中心</button>
            <button className="sp-btn" type="button">進入：船舶基本檔</button>
            <button className="sp-btn" type="button">進入：歷史報表</button>
            <button className="sp-btn" type="button">進入：遠端控管</button>
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
          // 內容區不要誤觸拖曳：輸入框/按鈕/船位列表/size popover 都排除
          draggableCancel=".sp-card__bd, input, button, .sp-berthList, .sp-sizePopover"
          // 只把「可見」的 widget layout 丟給 RGL（不可見的 layout 我們自己在 cfg 裡保留）
          layouts={{
            lg: (cfg.layout || DEFAULT_CFG.layout).filter((l) => visibleKeys.includes(l.i)),
          }}
          onLayoutChange={onLayoutChange}
          onDragStart={(layout, oldItem, newItem, placeholder, e, element) => {
            const key = newItem?.i;
            setDragState({ draggingKey: key, targetKey: null });

            // 把被拖曳的 widget 位置/尺寸記下來，畫 rglOverlay 預覽
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

            // overlay 跟著滑鼠移動
            if (e && rglOverlay.on) {
              setRglOverlay((p) => (p.on ? { ...p, x: e.clientX - p.dx, y: e.clientY - p.dy } : p));
            }
          }}
          onDragStop={() => {
            setDragState({ draggingKey: null, targetKey: null });
            setRglOverlay({ on: false, key: null, x: 0, y: 0, w: 0, h: 0, dx: 0, dy: 0 });
          }}
          onResize={(_, item) => {
            // 這個提示主要是讓使用者知道「現在卡片幾格高」
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

      {/* rglOverlay：拖曳 widget 的「跟隨預覽」 */}
      {rglOverlay.on && rglOverlay.key ? (
        <div
          className="sp-rglOverlay"
          style={{ left: rglOverlay.x, top: rglOverlay.y, width: rglOverlay.w, height: rglOverlay.h }}
        >
          <div className="sp-rglOverlay__inner">
            {renderWidgetByKey(rglOverlay.key, { overlay: true })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
