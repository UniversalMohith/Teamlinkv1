import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Plus, MoreVertical, Calendar, User, ArrowLeft, MessageSquare,
  Users, Trash2, Layout, Sun, Moon, Monitor,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ConnectionsPopup } from './ConnectionsPopup';
import { useTheme } from './ThemeContext';
import { taskAPI, handleApiError } from '../../utils/api';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  joinDate: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee?: string;
  labels?: string[];
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  user: User;
  projectId: string | null;
  onBack: () => void;
  onOpenChat: (teamId: string) => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onNavigateToNotifications: () => void;
  onLogout: () => void;
}

const ItemTypes = { TASK: 'task' };

interface DraggableTaskProps {
  task: Task;
  onTaskClick: (task: Task) => void;
}

function DraggableTask({ task, onTaskClick }: DraggableTaskProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  return (
    <div
      ref={drag}
      onClick={() => onTaskClick(task)}
      className={`bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all duration-200 group ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      }`}
    >
      <h4 className="font-medium text-gray-900 dark:text-white mb-1.5 text-sm">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{task.dueDate}</span>
          </div>
        )}
        {task.assignee && (
          <div className="w-6 h-6 bg-accent-gradient rounded-full flex items-center justify-center text-white text-[10px] font-medium">
            {task.assignee}
          </div>
        )}
      </div>
      {task.labels && task.labels.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {task.labels.map((label, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium rounded-full">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface DroppableColumnProps {
  column: Column;
  onDrop: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}

function DroppableColumn({ column, onDrop, onTaskClick, onAddTask }: DroppableColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TASK,
    drop: (item: { id: string; status: string }) => {
      if (item.status !== column.id) onDrop(item.id, column.id);
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));

  const statusColors: Record<string, string> = {
    'todo': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'in-progress': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    'done': 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  };

  const dotColors: Record<string, string> = {
    'todo': 'bg-gray-400',
    'in-progress': 'bg-blue-500',
    'done': 'bg-green-500',
  };

  return (
    <div
      ref={drop}
      className={`flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 transition-all duration-200 ${
        isOver ? 'ring-2 ring-[rgb(var(--color-accent-primary))] dark:ring-[rgb(var(--color-accent-primary-dark))] bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColors[column.id] || 'bg-gray-400'}`} />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{column.title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[column.id] || 'bg-gray-100 dark:bg-gray-700'}`}>
            {column.tasks.length}
          </span>
        </div>
        <button className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg p-1 transition-colors">
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-2.5 mb-3 min-h-[40px]">
        {column.tasks.map((task) => (
          <DraggableTask key={task.id} task={task} onTaskClick={onTaskClick} />
        ))}
      </div>

      <button
        onClick={() => onAddTask(column.id)}
        className="w-full p-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-[rgb(var(--color-accent-primary))] dark:hover:border-[rgb(var(--color-accent-primary-dark))] hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[rgb(var(--color-accent-primary))] dark:hover:text-[rgb(var(--color-accent-primary-dark))] text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Task
      </button>
    </div>
  );
}

function ColumnSkeleton() {
  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-700/50 rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-700/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ user, projectId, onBack, onOpenChat, onNavigateToProfile, onNavigateToSettings, onNavigateToNotifications, onLogout }: KanbanBoardProps) {
  const { theme, setTheme } = useTheme();
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', tasks: [] },
    { id: 'in-progress', title: 'In Progress', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] },
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isConnectionsPopupOpen, setIsConnectionsPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [detailTitle, setDetailTitle] = useState('');
  const [detailDescription, setDetailDescription] = useState('');
  const [detailStatus, setDetailStatus] = useState<Task['status']>('todo');
  const [detailDueDate, setDetailDueDate] = useState('');

  useEffect(() => {
    const loadTasks = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const tasks = await taskAPI.getByProject(projectId);
        setColumns([
          { id: 'todo', title: 'To Do', tasks: tasks.filter((t: any) => t.status === 'todo') },
          { id: 'in-progress', title: 'In Progress', tasks: tasks.filter((t: any) => t.status === 'in-progress') },
          { id: 'done', title: 'Done', tasks: tasks.filter((t: any) => t.status === 'done') },
        ]);
      } catch (error) {
        handleApiError(error, 'Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, [projectId]);

  useEffect(() => {
    if (selectedTask) {
      setDetailTitle(selectedTask.title || '');
      setDetailDescription(selectedTask.description || '');
      setDetailStatus(selectedTask.status || 'todo');
      setDetailDueDate(selectedTask.dueDate || '');
    }
  }, [selectedTask]);

  const handleDrop = async (taskId: string, newStatus: string) => {
    setColumns((prevColumns) => {
      const newColumns = prevColumns.map(col => ({ ...col, tasks: [...col.tasks] }));
      let movedTask: Task | null = null;
      newColumns.forEach((column) => {
        const taskIndex = column.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          movedTask = { ...column.tasks[taskIndex], status: newStatus as Task['status'] };
          column.tasks.splice(taskIndex, 1);
        }
      });
      if (movedTask) {
        const targetColumn = newColumns.find((column) => column.id === newStatus);
        if (targetColumn) targetColumn.tasks.push(movedTask);
      }
      return newColumns;
    });

    if (selectedTask?.id === taskId) {
      setDetailStatus(newStatus as Task['status']);
      setSelectedTask(prev => prev ? { ...prev, status: newStatus as Task['status'] } : prev);
    }

    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast.success('Task moved');
    } catch (error) {
      handleApiError(error, 'Failed to update task');
      if (projectId) {
        const tasks = await taskAPI.getByProject(projectId);
        setColumns([
          { id: 'todo', title: 'To Do', tasks: tasks.filter((t: any) => t.status === 'todo') },
          { id: 'in-progress', title: 'In Progress', tasks: tasks.filter((t: any) => t.status === 'in-progress') },
          { id: 'done', title: 'Done', tasks: tasks.filter((t: any) => t.status === 'done') },
        ]);
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleAddTask = async (columnId: string) => {
    if (!projectId) { toast.error('No project selected'); return; }
    try {
      const newTask = await taskAPI.create({
        title: 'New Task',
        project_id: projectId,
        status: columnId,
        description: 'Click to edit task details',
      });
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId ? { ...column, tasks: [...column.tasks, newTask] } : column
        )
      );
      toast.success('Task created');
    } catch (error) {
      handleApiError(error, 'Failed to create task');
    }
  };

  const handleNewCardClick = async () => {
    if (!projectId) { toast.error('No project selected'); return; }
    try {
      const newTask = await taskAPI.create({
        title: 'New Task',
        project_id: projectId,
        status: 'todo',
        description: 'Click to edit task details',
      });
      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === 'todo' ? { ...column, tasks: [...column.tasks, newTask] } : column
        )
      );
      setSelectedTask(newTask);
      setShowTaskDetail(true);
      toast.success('Task created');
    } catch (error) {
      handleApiError(error, 'Failed to create task');
    }
  };

  const handleSaveTask = async () => {
    if (!selectedTask) return;
    setIsSaving(true);
    try {
      await taskAPI.update(selectedTask.id, {
        title: detailTitle,
        description: detailDescription,
        status: detailStatus,
        due_date: detailDueDate || null,
      });
      setColumns((prevColumns) =>
        prevColumns
          .map((column) => ({
            ...column,
            tasks: column.tasks
              .filter((t) => !(t.id === selectedTask.id && column.id !== detailStatus))
              .map((t) =>
                t.id === selectedTask.id
                  ? { ...t, title: detailTitle, description: detailDescription, status: detailStatus, dueDate: detailDueDate }
                  : t
              ),
          }))
          .map((column) => {
            if (column.id === detailStatus && !column.tasks.find(t => t.id === selectedTask.id)) {
              return {
                ...column,
                tasks: [...column.tasks, { ...selectedTask, title: detailTitle, description: detailDescription, status: detailStatus, dueDate: detailDueDate }],
              };
            }
            return column;
          })
      );
      setSelectedTask(prev => prev ? { ...prev, title: detailTitle, description: detailDescription, status: detailStatus, dueDate: detailDueDate } : prev);
      toast.success('Task saved');
    } catch (error) {
      handleApiError(error, 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setIsDeleting(true);
    try {
      await taskAPI.delete(selectedTask.id);
      setColumns((prevColumns) =>
        prevColumns.map((column) => ({ ...column, tasks: column.tasks.filter((t) => t.id !== selectedTask.id) }))
      );
      setShowTaskDetail(false);
      setSelectedTask(null);
      toast.success('Task deleted');
    } catch (error) {
      handleApiError(error, 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('auto');
    else setTheme('light');
  };
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Kanban Board</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{totalTasks} tasks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cycleTheme}
                className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                title={`Theme: ${theme}`}
              >
                <ThemeIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
              </button>
              <Button variant="outline" size="sm" onClick={() => projectId && onOpenChat(projectId)} className="rounded-lg" disabled={!projectId}>
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Chat
              </Button>
              <button
                onClick={() => setIsConnectionsPopupOpen(true)}
                className="relative p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 group"
              >
                <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              </button>
              <Button size="sm" className="btn-accent rounded-lg" onClick={handleNewCardClick} disabled={!projectId}>
                <Plus className="w-4 h-4 mr-1.5" />
                New Card
              </Button>
            </div>
          </header>

          {/* Board area */}
          <div className="flex-1 overflow-x-auto p-6">
            {isLoading ? (
              <div className="flex gap-4 h-full">
                <ColumnSkeleton />
                <ColumnSkeleton />
                <ColumnSkeleton />
              </div>
            ) : !projectId ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Layout className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No project selected</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                  Go back to the dashboard and open a project to view its Kanban board.
                </p>
                <Button variant="outline" onClick={onBack} className="rounded-lg">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 h-full">
                {columns.map((column) => (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    onDrop={handleDrop}
                    onTaskClick={handleTaskClick}
                    onAddTask={handleAddTask}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task Detail Sidebar */}
        {showTaskDetail && selectedTask && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h2>
              <button onClick={() => setShowTaskDetail(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400">
                ✕
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Title</label>
                <Input value={detailTitle} onChange={(e) => setDetailTitle(e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Description</label>
                <textarea
                  className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm"
                  rows={4}
                  value={detailDescription}
                  onChange={(e) => setDetailDescription(e.target.value)}
                  placeholder="Add description..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Status</label>
                <select
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                  value={detailStatus}
                  onChange={(e) => setDetailStatus(e.target.value as Task['status'])}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Due Date</label>
                <Input type="date" value={detailDueDate} onChange={(e) => setDetailDueDate(e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg" />
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2.5">
                <Button className="w-full btn-accent rounded-lg" onClick={handleSaveTask} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 rounded-lg"
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete Task'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConnectionsPopup
        user={user}
        isOpen={isConnectionsPopupOpen}
        onClose={() => setIsConnectionsPopupOpen(false)}
      />
    </DndProvider>
  );
}
