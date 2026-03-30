import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Star, GripVertical, ChevronRight, Plus, ChevronLeft } from 'lucide-react';

const STAGE_CONFIG = {
  invited: {
    label: 'Prospecting',
    color: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    headerBg: 'bg-slate-50',
    border: 'border-slate-200',
    badgeBg: 'bg-slate-100 text-slate-600',
    emptyBorder: 'border-slate-300',
  },
  met: {
    label: 'Met',
    color: 'bg-blue-50 text-blue-600',
    dot: 'bg-blue-400',
    headerBg: 'bg-blue-50',
    border: 'border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-700',
    emptyBorder: 'border-blue-300',
  },
  liked: {
    label: 'Liked',
    color: 'bg-purple-50 text-purple-600',
    dot: 'bg-purple-400',
    headerBg: 'bg-purple-50',
    border: 'border-purple-200',
    badgeBg: 'bg-purple-100 text-purple-700',
    emptyBorder: 'border-purple-300',
  },
  rush: {
    label: 'Rush',
    color: 'bg-orange-50 text-orange-600',
    dot: 'bg-orange-400',
    headerBg: 'bg-orange-50',
    border: 'border-orange-200',
    badgeBg: 'bg-orange-100 text-orange-700',
    emptyBorder: 'border-orange-300',
  },
  bid: {
    label: 'Bid',
    color: 'bg-gold/10 text-gold-dark',
    dot: 'bg-gold',
    headerBg: 'bg-gold/5',
    border: 'border-gold/30',
    badgeBg: 'bg-gold/15 text-gold-dark',
    emptyBorder: 'border-gold/40',
  },
  pledged: {
    label: 'Pledged',
    color: 'bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-400',
    headerBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    emptyBorder: 'border-emerald-300',
  },
  dropped: {
    label: 'Dropped',
    color: 'bg-red-50 text-red-500',
    dot: 'bg-red-400',
    headerBg: 'bg-red-50',
    border: 'border-red-200',
    badgeBg: 'bg-red-100 text-red-700',
    emptyBorder: 'border-red-300',
  },
};

const StarRating = ({ score }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={10}
        className={i <= score ? 'text-gold fill-gold' : 'text-gray-200 fill-gray-200'}
      />
    ))}
  </div>
);

const avatarColors = [
  'bg-blue-500', 'bg-purple-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500',
];

const PNMCard = ({ pnm, onClick, isDragging }) => {
  const initials = `${pnm.firstName?.[0] || ''}${pnm.lastName?.[0] || ''}`.toUpperCase();
  const colorIndex = ((pnm.firstName?.charCodeAt(0) || 0) + (pnm.lastName?.charCodeAt(0) || 0)) % avatarColors.length;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border p-3.5 cursor-pointer group transition-all duration-200 relative
        ${isDragging
          ? 'shadow-xl border-navy/20 rotate-1 opacity-95 scale-105'
          : 'border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-gray-200'
        }`}
    >
      {/* Drag handle indicator (visual only stripe) */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gray-100 group-hover:bg-gray-300 transition-colors" />

      <div className="flex items-start gap-3 pl-2">
        {/* Avatar */}
        <div className={`w-9 h-9 ${avatarColors[colorIndex]} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {pnm.firstName} {pnm.lastName}
          </p>
          {pnm.major && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {pnm.major}{pnm.year ? ` · ${pnm.year}` : ''}
            </p>
          )}
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5 flex-shrink-0" />
      </div>

      {pnm.avgScore > 0 && (
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-gray-50 pl-2">
          <StarRating score={Math.round(pnm.avgScore)} />
          <span className="text-xs text-gray-500 font-medium">{pnm.avgScore.toFixed(1)}</span>
          <span className="text-xs text-gray-300 ml-auto">{pnm.votes?.length || 0}v</span>
        </div>
      )}
    </div>
  );
};

const STAGES_LIST = Object.keys(STAGE_CONFIG);

const SortablePNMCard = ({ pnm, onClick, onStageChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pnm.id });
  const [showMove, setShowMove] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const currentIdx = STAGES_LIST.indexOf(pnm.stage);
  const canMoveLeft = currentIdx > 0;
  const canMoveRight = currentIdx < STAGES_LIST.length - 1;

  const moveStage = (e, direction) => {
    e.stopPropagation();
    const newStage = STAGES_LIST[currentIdx + direction];
    if (newStage) onStageChange?.(pnm.id, newStage);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative group/card">
        <button
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1 hidden md:flex opacity-0 group-hover/card:opacity-60 hover:!opacity-100 text-gray-400 cursor-grab active:cursor-grabbing z-10 transition-opacity rounded"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={12} />
        </button>
        <PNMCard pnm={pnm} onClick={() => onClick(pnm)} isDragging={isDragging} />
        {/* Mobile move buttons — show on tap */}
        <div className="md:hidden absolute bottom-2 right-2 flex gap-1">
          {canMoveLeft && (
            <button onClick={e => moveStage(e, -1)}
              className="w-6 h-6 bg-gray-100 hover:bg-navy hover:text-white rounded-lg flex items-center justify-center text-gray-500 transition-all active:scale-95">
              <ChevronLeft size={12} />
            </button>
          )}
          {canMoveRight && (
            <button onClick={e => moveStage(e, 1)}
              className="w-6 h-6 bg-navy text-white rounded-lg flex items-center justify-center transition-all active:scale-95">
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ stage, pnms, onPNMClick, onAddPNM, onStageChange }) => {
  const config = STAGE_CONFIG[stage];
  const { setNodeRef } = useSortable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-64 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50/70 border border-gray-200"
    >
      {/* Column header */}
      <div className={`${config.headerBg} px-4 py-3 flex items-center justify-between border-b border-gray-200`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 ${config.dot} rounded-full`} />
          <span className="text-sm font-semibold text-gray-800">{config.label}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badgeBg}`}>
          {pnms.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-2.5 min-h-[200px]">
        <SortableContext items={pnms.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {pnms.length === 0 ? (
            <button
              onClick={() => onAddPNM && onAddPNM(stage)}
              className={`w-full h-24 rounded-xl border-2 border-dashed ${config.emptyBorder} flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-all group/empty`}
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 group-hover/empty:bg-gray-200 flex items-center justify-center transition-colors">
                <Plus size={14} className="text-gray-500" />
              </div>
              <p className="text-xs font-medium">Add PNM</p>
            </button>
          ) : (
            <>
              {pnms.map(pnm => (
                <SortablePNMCard key={pnm.id} pnm={pnm} onClick={onPNMClick} onStageChange={onStageChange} />
              ))}
              {onAddPNM && (
                <button
                  onClick={() => onAddPNM(stage)}
                  className="w-full py-2 rounded-xl border border-dashed border-gray-200 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-all"
                >
                  <Plus size={11} /> Add
                </button>
              )}
            </>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

const KanbanBoard = ({ pnms, onPNMClick, onStageChange, onAddPNM }) => {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const stages = Object.keys(STAGE_CONFIG);
  const pnmsByStage = stages.reduce((acc, stage) => {
    acc[stage] = pnms.filter(p => p.stage === stage);
    return acc;
  }, {});

  const activePNM = activeId ? pnms.find(p => p.id === activeId) : null;

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;

    const pnm = pnms.find(p => p.id === active.id);
    if (!pnm) return;

    const targetStage = stages.includes(over.id)
      ? over.id
      : pnms.find(p => p.id === over.id)?.stage;

    if (targetStage && targetStage !== pnm.stage) {
      onStageChange(pnm.id, targetStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
        {stages.map(stage => (
          <KanbanColumn
            key={stage}
            stage={stage}
            pnms={pnmsByStage[stage]}
            onPNMClick={onPNMClick}
            onAddPNM={onAddPNM}
            onStageChange={onStageChange}
          />
        ))}
      </div>

      <DragOverlay>
        {activePNM && <PNMCard pnm={activePNM} onClick={() => {}} isDragging />}
      </DragOverlay>
    </DndContext>
  );
};

export { STAGE_CONFIG, StarRating };
export default KanbanBoard;
