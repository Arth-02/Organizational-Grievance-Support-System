import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
  ArrowRight,
  Play,
  CheckCircle,
  Users,
  Building2,
  Shield,
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
 * Initial Kanban board data
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
 * Task type configuration
 */
const TASK_TYPE_CONFIG = {
  task: { icon: CheckSquare, color: 'text-blue-500' },
  bug: { icon: Bug, color: 'text-red-500' },
  story: { icon: BookOpen, color: 'text-green-500' },
};

/**
 * Priority configuration
 */
const PRIORITY_CONFIG = {
  lowest: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400', label: 'Lowest' },
  low: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', label: 'Low' },
  medium: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', label: 'Medium' },
  high: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', label: 'High' },
  highest: { badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', label: 'Highest' },
};

/**
 * Status configuration
 */
const STATUS_CONFIG = {
  'todo': { textColor: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-700/50' },
  'in-progress': { textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-500/15' },
  'done': { textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/15' },
};

/**
 * HeroSection - Primary conversion section with 3D interactive Kanban demo
 */
const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-20"
      aria-labelledby="hero-heading"
    >
      {/* Animated Background Gradients via CSS/Motion */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" 
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center lg:text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 
                id="hero-heading"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6"
              >
                Streamline Your{' '}
                <span className="text-transparent bg-clip-text bg-[linear-gradient(to_right,#3258cd,#3581d0,#3bb0b3,#4fc097,#7fcf78)] animate-gradient-x">
                  Organization&apos;s
                </span>{' '}
                Workflow
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              {heroContent.subheadline}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link to={heroContent.primaryCTA.href} className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto gap-2 text-base px-8 h-12 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
                >
                  {heroContent.primaryCTA.label}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              
              <a
                href={heroContent.secondaryCTA.href}
                className="group flex items-center gap-3 px-6 py-3 rounded-full hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <Play className="h-4 w-4 ml-0.5 fill-current" />
                </div>
                <span className="font-medium">{heroContent.secondaryCTA.label}</span>
              </a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6"
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>{heroContent.trustIndicator}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 opacity-80">
                {trustBadges.map((badge, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <badge.icon className="h-4 w-4" />
                    <span>{badge.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - 3D Perspective Kanban Demo */}
          <div className="hidden lg:block relative perspective-1000">
             <TiltedDashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * TiltedDashboardPreview - Wrapper for interactive demo with mouse-aware 3D tilt
 */
const TiltedDashboardPreview = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-5deg", "5deg"]);

  function onMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width - 0.5);
    y.set((clientY - top) / height - 0.5);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative z-10"
    >
      <InteractiveKanbanDemo />
    </motion.div>
  );
};

/**
 * InteractiveKanbanDemo - Fully interactive drag-and-drop Kanban board
 */
const InteractiveKanbanDemo = () => {
  const [boardData, setBoardData] = useState(initialBoardData);

  const onDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColumn = boardData.columns[source.droppableId];
    const destColumn = boardData.columns[destination.droppableId];

    if (sourceColumn.id === destColumn.id) {
      const newTaskIds = Array.from(sourceColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      setBoardData(prev => ({
        ...prev,
        columns: { ...prev.columns, [sourceColumn.id]: { ...sourceColumn, taskIds: newTaskIds } },
      }));
      return;
    }

    const sourceTaskIds = Array.from(sourceColumn.taskIds);
    sourceTaskIds.splice(source.index, 1);
    const destTaskIds = Array.from(destColumn.taskIds);
    destTaskIds.splice(destination.index, 0, draggableId);

    setBoardData(prev => ({
      ...prev,
      columns: {
        ...prev.columns,
        [sourceColumn.id]: { ...sourceColumn, taskIds: sourceTaskIds },
        [destColumn.id]: { ...destColumn, taskIds: destTaskIds },
      },
    }));
  }, [boardData]);

  return (
    <div className="relative group">
      {/* Glow effect behind the mockup */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-3xl transform scale-105 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Main dashboard container */}
      <div className="relative bg-card/80 border border-border/50 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300">
        {/* Dashboard header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm" />
            </div>
            <span className="text-sm font-medium text-muted-foreground/80">Project Board</span>
          </div>
           {/* Add a subtle pulse for interaction cue */}
          <div className="flex items-center gap-2">
             <span className="text-xs text-primary font-medium px-2 py-0.5 bg-primary/10 rounded-full animate-pulse">Try dragging!</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" tabIndex={-1}><Plus className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Interactive Kanban board */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="p-4 flex gap-4 min-w-[500px]">
            {boardData.columnOrder.map((columnId) => {
              const column = boardData.columns[columnId];
              const tasks = column.taskIds.map(taskId => boardData.tasks[taskId]);
              return <KanbanColumn key={column.id} column={column} tasks={tasks} />;
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

const KanbanColumn = ({ column, tasks }) => {
  const statusConfig = STATUS_CONFIG[column.id] || STATUS_CONFIG['todo'];
  return (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <div
          className={cn(
            'flex-1 rounded-xl flex flex-col overflow-hidden transition-colors duration-200',
            'bg-secondary/50 border border-border/50',
            snapshot.isDraggingOver && 'ring-2 ring-primary/20 bg-secondary/80'
          )}
        >
          <div className="p-3 border-b border-border/50 flex justify-between items-center bg-muted/20">
            <h3 className={cn('font-medium text-xs', statusConfig.textColor)}>{column.title}</h3>
            <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', statusConfig.bgColor, statusConfig.textColor)}>
              {tasks.length}
            </span>
          </div>
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn('flex-1 p-2 space-y-2 min-h-[150px] transition-opacity', snapshot.draggingFromThisWith && 'opacity-70')}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <DemoTaskCard task={task} provided={provided} snapshot={snapshot} />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
};

const DemoTaskCard = ({ task, provided, snapshot }) => {
  const typeConfig = TASK_TYPE_CONFIG[task.type] || TASK_TYPE_CONFIG.task;
  const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const TypeIcon = typeConfig.icon;

  const cardContent = (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{ ...provided.draggableProps.style }}
      className="group"
    >
      <Card
        className={cn(
          'relative overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm',
          'hover:shadow-md hover:border-primary/20 transition-all duration-200',
          snapshot.isDragging && 'rotate-2 scale-105 shadow-xl ring-2 ring-primary/40 z-50 cursor-grabbing'
        )}
      >
        <CardHeader className="p-2.5 pb-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <TypeIcon className={cn('h-3.5 w-3.5', typeConfig.color)} />
              <span className="text-[10px] font-medium text-muted-foreground">{task.issueKey}</span>
            </div>
            <Badge className={cn('text-[8px] px-1 py-0 uppercase', priorityConfig.badge)}>
              {priorityConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-2.5 pb-2.5 pt-0 space-y-2">
          <p className="font-medium text-xs leading-tight line-clamp-2">{task.title}</p>
          <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              {task.attachments > 0 && (
                <div className="flex items-center gap-0.5 bg-muted/50 px-1 py-0.5 rounded text-muted-foreground">
                  <Paperclip className="h-2.5 w-2.5" />
                  <span className="text-[10px]">{task.attachments}</span>
                </div>
              )}
            </div>
            <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-[9px] font-bold text-primary ring-1 ring-background">JD</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (snapshot.isDragging) return createPortal(cardContent, document.body);
  return cardContent;
};

export default HeroSection;
