import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  ArrowRight,
  Play,
  CheckCircle,
  Users,
  Building2,
  Shield,
  MoreHorizontal,
  Plus,
  Paperclip,
  CheckSquare,
  Bug,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AnimatedSection from '../components/AnimatedSection';

/**
 * Hero content configuration
 */
const heroContent = {
  headline: "Streamline Your Organization's Workflow",
  subheadline:
    'Project management, grievance handling, and team collaboration — all in one powerful platform designed for modern organizations.',
  primaryCTA: { label: 'Start Free Trial', href: '/register' },
  secondaryCTA: { label: 'Watch Demo', href: '#demo' },
  trustIndicator: 'Trusted by 500+ organizations worldwide',
};

/**
 * Trust badges to display below CTAs
 */
const trustBadges = [
  { icon: Users, label: '10,000+ Users' },
  { icon: Building2, label: '500+ Organizations' },
  { icon: Shield, label: 'Enterprise Security' },
];

/**
 * Initial Kanban board data - managed locally with state, resets on page reload
 */
const initialBoardData = {
  columns: {
    'todo': {
      id: 'todo',
      title: 'To Do',
      taskIds: ['task-1', 'task-2'],
    },
    'in-progress': {
      id: 'in-progress',
      title: 'In Progress',
      taskIds: ['task-3', 'task-4'],
    },
    'done': {
      id: 'done',
      title: 'Done',
      taskIds: ['task-5'],
    },
  },
  tasks: {
    'task-1': { id: 'task-1', issueKey: 'PROJ-1', title: 'Design system update', type: 'task', priority: 'high', attachments: 2 },
    'task-2': { id: 'task-2', issueKey: 'PROJ-2', title: 'User research', type: 'story', priority: 'medium', attachments: 1 },
    'task-3': { id: 'task-3', issueKey: 'PROJ-3', title: 'Dashboard redesign', type: 'task', priority: 'high', attachments: 4 },
    'task-4': { id: 'task-4', issueKey: 'PROJ-4', title: 'API integration', type: 'bug', priority: 'low', attachments: 0 },
    'task-5': { id: 'task-5', issueKey: 'PROJ-5', title: 'Authentication flow', type: 'story', priority: 'highest', attachments: 3 },
  },
  columnOrder: ['todo', 'in-progress', 'done'],
};

/**
 * Task type configuration - matches actual app
 */
const TASK_TYPE_CONFIG = {
  task: { icon: CheckSquare, color: 'text-blue-500' },
  bug: { icon: Bug, color: 'text-red-500' },
  story: { icon: BookOpen, color: 'text-green-500' },
};

/**
 * Priority configuration - matches actual app
 */
const PRIORITY_CONFIG = {
  lowest: {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400',
    label: 'Lowest',
  },
  low: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    label: 'Low',
  },
  medium: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    label: 'Medium',
  },
  high: {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    label: 'High',
  },
  highest: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    label: 'Highest',
  },
};

/**
 * Status configuration for column styling - matches actual app
 */
const STATUS_CONFIG = {
  'todo': {
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700/50',
  },
  'in-progress': {
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-500/15',
  },
  'done': {
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/15',
  },
};

/**
 * HeroSection - Primary conversion section with interactive drag-and-drop Kanban demo
 */
const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center overflow-hidden pt-16 sm:pt-20"
      aria-labelledby="hero-heading"
    >
      {/* Background gradient decoration */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left">
            <AnimatedSection animation="fade-up" delay={0}>
              <h1 
                id="hero-heading"
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6"
              >
                Streamline Your{' '}
                <span className="text-primary">Organization&apos;s</span>{' '}
                Workflow
              </h1>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={100}>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                {heroContent.subheadline}
              </p>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={200}>
              <div 
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-6 sm:mb-8"
                role="group"
                aria-label="Call to action buttons"
              >
                <Link to={heroContent.primaryCTA.href}>
                  <Button 
                    size="lg" 
                    className="gap-2 px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base w-full sm:w-auto"
                  >
                    {heroContent.primaryCTA.label}
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </Link>
                <a
                  href={heroContent.secondaryCTA.href}
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
                >
                  <span 
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary"
                    aria-hidden="true"
                  >
                    <Play className="h-4 w-4 ml-0.5" />
                  </span>
                  <span className="font-medium">{heroContent.secondaryCTA.label}</span>
                </a>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                  <span>{heroContent.trustIndicator}</span>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-up" delay={400}>
              <div 
                className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-8 pt-8 border-t border-border/50"
                role="list"
                aria-label="Platform statistics"
              >
                {trustBadges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    role="listitem"
                  >
                    <badge.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Right Column - Interactive Drag & Drop Kanban Demo */}
          <AnimatedSection animation="fade-left" delay={200} className="hidden lg:block">
            <InteractiveKanbanDemo />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};


/**
 * InteractiveKanbanDemo - Fully interactive drag-and-drop Kanban board
 * Matches the actual app's TaskBoardView behavior
 */
const InteractiveKanbanDemo = () => {
  const [boardData, setBoardData] = useState(initialBoardData);

  const onDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumn = boardData.columns[source.droppableId];
    const destColumn = boardData.columns[destination.droppableId];

    // Moving within the same column
    if (sourceColumn.id === destColumn.id) {
      const newTaskIds = Array.from(sourceColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      setBoardData(prev => ({
        ...prev,
        columns: {
          ...prev.columns,
          [sourceColumn.id]: {
            ...sourceColumn,
            taskIds: newTaskIds,
          },
        },
      }));
      return;
    }

    // Moving to a different column
    const sourceTaskIds = Array.from(sourceColumn.taskIds);
    sourceTaskIds.splice(source.index, 1);

    const destTaskIds = Array.from(destColumn.taskIds);
    destTaskIds.splice(destination.index, 0, draggableId);

    setBoardData(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [sourceColumn.id]: {
          ...sourceColumn,
          taskIds: sourceTaskIds,
        },
        [destColumn.id]: {
          ...destColumn,
          taskIds: destTaskIds,
        },
      },
    }));
  }, [boardData]);

  return (
    <div className="relative">
      {/* Glow effect behind the mockup */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl transform scale-105" />

      {/* Main dashboard container */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Dashboard header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Project Board
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium animate-pulse">
              ✨ Try dragging cards!
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" tabIndex={-1}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" tabIndex={-1}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Interactive Kanban board with drag-and-drop */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="p-3 flex gap-3">
            {boardData.columnOrder.map((columnId, columnIndex) => {
              const column = boardData.columns[columnId];
              const tasks = column.taskIds.map(taskId => boardData.tasks[taskId]);

              return (
                <AnimatedSection
                  key={column.id}
                  animation="fade-up"
                  delay={300 + columnIndex * 150}
                  className="flex-1 min-w-[180px]"
                >
                  <KanbanColumn column={column} tasks={tasks} />
                </AnimatedSection>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

/**
 * KanbanColumn - A droppable column matching the actual TaskList component
 */
const KanbanColumn = ({ column, tasks }) => {
  const statusConfig = STATUS_CONFIG[column.id] || STATUS_CONFIG['todo'];

  return (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <div
          className={cn(
            'flex-shrink-0 rounded-lg flex flex-col overflow-hidden',
            'bg-secondary border border-border',
            snapshot.isDraggingOver && 'ring-2 ring-primary/30',
            'transition-all duration-200'
          )}
        >
          {/* Column Header */}
          <div className="p-2.5 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className={cn('font-medium text-xs', statusConfig.textColor)}>
                {column.title}
              </h3>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  statusConfig.bgColor,
                  statusConfig.textColor
                )}
              >
                {tasks.length}
              </span>
            </div>
          </div>

          {/* Cards Container */}
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-2 pt-1 min-h-[120px]',
              snapshot.draggingFromThisWith && 'opacity-60'
            )}
          >
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <DemoTaskCard
                      task={task}
                      provided={provided}
                      snapshot={snapshot}
                    />
                  )}
                </Draggable>
              ))}
            </div>
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
};

/**
 * DemoTaskCard - Task card matching the actual TaskCard component styling
 * Card follows cursor while dragging with rotation effect
 * Uses portal when dragging to prevent clipping by overflow:hidden containers
 */
const DemoTaskCard = ({ task, provided, snapshot }) => {
  const typeConfig = TASK_TYPE_CONFIG[task.type] || TASK_TYPE_CONFIG.task;
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = typeConfig.icon;

  const cardContent = (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="group"
      style={{
        ...provided.draggableProps.style,
      }}
    >
      <Card
        className={cn(
          'relative overflow-hidden rounded-lg cursor-grab active:cursor-grabbing',
          'border border-border bg-card',
          'hover:border-primary/30 hover:shadow-lg',
          'transition-shadow duration-200',
          // Dragging state - matches actual app behavior
          snapshot.isDragging && 'rotate-[2deg] shadow-2xl scale-[1.02] ring-2 ring-primary/40 z-[9999]'
        )}
      >
        {/* Header with issue key and priority */}
        <CardHeader className="p-2.5 pb-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {/* Task Type Icon */}
              <TypeIcon className={cn('h-3.5 w-3.5', typeConfig.color)} />
              {/* Issue Key */}
              <span className="text-[10px] font-medium text-muted-foreground">
                {task.issueKey}
              </span>
            </div>
            {/* Priority Badge */}
            <Badge
              className={cn(
                'text-[8px] font-semibold px-1 py-0 uppercase tracking-wide',
                priorityConfig.badge
              )}
            >
              {priorityConfig.label}
            </Badge>
          </div>
        </CardHeader>

        {/* Title */}
        <CardContent className="px-2.5 pb-2.5 pt-0 space-y-2">
          <h4 className="font-medium text-xs text-card-foreground leading-tight line-clamp-2">
            {task.title}
          </h4>

          {/* Footer with metadata */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              {/* Attachment count */}
              {task.attachments > 0 && (
                <div className="flex items-center gap-0.5 bg-muted/50 px-1 py-0.5 rounded">
                  <Paperclip className="h-2.5 w-2.5" />
                  <span className="text-[10px] font-medium">{task.attachments}</span>
                </div>
              )}
            </div>

            {/* Avatar placeholder */}
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-card">
              <span className="text-[8px] font-semibold text-primary">JD</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Use portal when dragging to escape overflow:hidden containers
  if (snapshot.isDragging) {
    return createPortal(cardContent, document.body);
  }

  return cardContent;
};

export default HeroSection;
