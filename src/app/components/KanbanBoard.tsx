import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, MoreVertical, Calendar, User, ArrowLeft, MessageSquare, Check, Clock, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { ProfileDropdown } from './ProfileDropdown';
import { ConnectionsPopup } from './ConnectionsPopup';
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

const ItemTypes = {
  TASK: 'task',
};

interface DraggableTaskProps {
  task: Task;
  onTaskClick: (task: Task) => void;
}

function DraggableTask({ task, onTaskClick }: DraggableTaskProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TASK,
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      onClick={() => onTaskClick(task)}
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        {task.dueDate && (
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{task.dueDate}</span>
          </div>
        )}
        {task.assignee && (
          <div className="w-6 h-6 bg-accent-gradient rounded-full flex items-center justify-center text-white text-xs">
            {task.assignee}
          </div>
        )}
      </div>
      {task.labels && task.labels.length > 0 && (
        <div className="flex gap-1 mt-2">
          {task.labels.map((label, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-accent-light dark:bg-accent-light text-accent dark:text-accent text-xs rounded"
            >
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
      if (item.status !== column.id) {
        onDrop(item.id, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const statusColors = {
    'todo': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'done': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div
      ref={drop}
      className={`flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 ${
        isOver ? 'ring-2 ring-[rgb(var(--color-accent-primary))] dark:ring-[rgb(var(--color-accent-primary-dark))]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[column.id as keyof typeof statusColors] || 'bg-gray-100 dark:bg-gray-700'}`}>
            {column.tasks.length}
          </span>
        </div>
        <button className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1">
          <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="space-y-3 mb-3">
        {column.tasks.map((task) => (
          <DraggableTask key={task.id} task={task} onTaskClick={onTaskClick} />
        ))}
      </div>

      <button
        onClick={() => onAddTask(column.id)}
        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-[rgb(var(--color-accent-primary))] dark:hover:border-[rgb(var(--color-accent-primary-dark))] hover:bg-accent-light dark:hover:bg-accent-light-dark transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-accent dark:hover:text-accent"
      >
        <Plus className="w-4 h-4" />
        Add Task
      </button>
    </div>
  );
}

export function KanbanBoard({ user, projectId, onBack, onOpenChat, onNavigateToProfile, onNavigateToSettings, onNavigateToNotifications, onLogout }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([
    { id: 'todo', title: 'To Do', tasks: [] },
    { id: 'in-progress', title: 'In Progress', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] },
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [isConnectionsPopupOpen, setIsConnectionsPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks from backend
  useEffect(() => {
    const loadTasks = async () => {
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const tasks = await taskAPI.getByProject(projectId);

        // Organize tasks by status
        const newColumns = [
          { id: 'todo', title: 'To Do', tasks: tasks.filter((t: any) => t.status === 'todo') },
          { id: 'in-progress', title: 'In Progress', tasks: tasks.filter((t: any) => t.status === 'in-progress') },
          { id: 'done', title: 'Done', tasks: tasks.filter((t: any) => t.status === 'done') },
        ];

        setColumns(newColumns);
      } catch (error) {
        handleApiError(error, 'Failed to load tasks');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [projectId]);

  const handleDrop = async (taskId: string, newStatus: string) => {
    // Optimistically update UI
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];
      let movedTask: Task | null = null;

      // Find and remove task from old column
      newColumns.forEach((column) => {
        const taskIndex = column.tasks.findIndex((task) => task.id === taskId);
        if (taskIndex !== -1) {
          movedTask = { ...column.tasks[taskIndex], status: newStatus as Task['status'] };
          column.tasks.splice(taskIndex, 1);
        }
      });

      // Add task to new column
      if (movedTask) {
        const targetColumn = newColumns.find((column) => column.id === newStatus);
        if (targetColumn) {
          targetColumn.tasks.push(movedTask);
        }
      }

      return newColumns;
    });

    // Update backend
    try {
      await taskAPI.update(taskId, { status: newStatus });
      toast.success('Task moved successfully');
    } catch (error) {
      handleApiError(error, 'Failed to update task');
      // Revert on error - reload tasks
      if (projectId) {
        const tasks = await taskAPI.getByProject(projectId);
        const newColumns = [
          { id: 'todo', title: 'To Do', tasks: tasks.filter((t: any) => t.status === 'todo') },
          { id: 'in-progress', title: 'In Progress', tasks: tasks.filter((t: any) => t.status === 'in-progress') },
          { id: 'done', title: 'Done', tasks: tasks.filter((t: any) => t.status === 'done') },
        ];
        setColumns(newColumns);
      }
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleAddTask = async (columnId: string) => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    try {
      const newTask = await taskAPI.create({
        title: 'New Task',
        project_id: projectId,
        status: columnId,
        description: 'Click to edit task details',
      });

      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === columnId
            ? { ...column, tasks: [...column.tasks, newTask] }
            : column
        )
      );

      toast.success('Task created successfully');
    } catch (error) {
      handleApiError(error, 'Failed to create task');
    }
  };

  const handleNewCardClick = async () => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    try {
      const newTask = await taskAPI.create({
        title: 'New Task',
        project_id: projectId,
        status: 'todo',
        description: 'Click to edit task details',
      });

      setColumns((prevColumns) =>
        prevColumns.map((column) =>
          column.id === 'todo'
            ? { ...column, tasks: [...column.tasks, newTask] }
            : column
        )
      );

      // Open the task detail panel for the new task
      setSelectedTask(newTask);
      setShowTaskDetail(true);

      toast.success('Task created successfully');
    } catch (error) {
      handleApiError(error, 'Failed to create task');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-64 bg-accent-gradient text-white flex flex-col">
          <div className="p-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 3L21 12L3 21V3Z" fill="rgb(var(--color-accent-primary))"/>
              </svg>
            </div>
            <span className="font-semibold text-lg">TeamLink</span>
          </div>

          <div className="px-4 py-6">
            <h2 className="text-sm font-semibold mb-4">Kanban Board</h2>
            <div className="space-y-2">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <h3 className="font-medium">Website Redesign</h3>
                <p className="text-xs opacity-80 mt-1">Due in 2 days</p>
              </div>
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Team Member</p>
                <p className="text-xs opacity-70">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Kanban Board</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChat('team-1')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Team Chat
              </Button>
              <button 
                onClick={() => setIsConnectionsPopupOpen(true)}
                className="relative p-2 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-900/30 dark:hover:to-violet-900/30 transition-all duration-200 group"
              >
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
                  5
                </span>
              </button>
              <Button size="sm" className="btn-accent" onClick={handleNewCardClick}>
                <Plus className="w-4 h-4 mr-2" />
                New Card
              </Button>
              <div className="flex -space-x-2 mr-3">
                {['JL', 'SC', 'AR', 'MK'].map((initial, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-accent-gradient flex items-center justify-center text-white text-xs font-medium"
                  >
                    {initial}
                  </div>
                ))}
              </div>
            </div>
          </header>

          {/* Kanban Board */}
          <div className="flex-1 overflow-x-auto p-6">
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
          </div>
        </div>

        {/* Task Detail Sidebar */}
        {showTaskDetail && selectedTask && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Details</h2>
              <button
                onClick={() => setShowTaskDetail(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Title
                </label>
                <Input 
                  defaultValue={selectedTask.title || ''} 
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Description
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  rows={4}
                  defaultValue={selectedTask.description || ''}
                  placeholder="Add description..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Status
                </label>
                <select 
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  defaultValue={selectedTask.status || 'todo'}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                  Due Date
                </label>
                <Input 
                  type="date" 
                  defaultValue={selectedTask.dueDate || ''} 
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">
                  Checklist
                </label>
                <div className="space-y-2">
                  {['Task item 1', 'Task item 2', 'Task item 3'].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Checkbox id={`check-${idx}`} />
                      <label htmlFor={`check-${idx}`} className="text-sm text-gray-700 dark:text-gray-300">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button className="w-full btn-accent">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connections Popup */}
      <ConnectionsPopup 
        user={user}
        isOpen={isConnectionsPopupOpen}
        onClose={() => setIsConnectionsPopupOpen(false)} 
      />
    </DndProvider>
  );
}