import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timestamp: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  showNotification: (type: NotificationType, title: string, message?: string) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: Notification = {
        id,
        type,
        title,
        message,
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, newNotification]);

      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    },
    [removeNotification]
  );

  const success = useCallback((title: string, message?: string) => {
    showNotification('success', title, message);
  }, [showNotification]);

  const error = useCallback((title: string, message?: string) => {
    showNotification('error', title, message);
  }, [showNotification]);

  const warning = useCallback((title: string, message?: string) => {
    showNotification('warning', title, message);
  }, [showNotification]);

  const info = useCallback((title: string, message?: string) => {
    showNotification('info', title, message);
  }, [showNotification]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        showNotification, 
        removeNotification,
        success,
        error,
        warning,
        info 
      }}
    >
      {children}
      {/* Toast Render Area */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => {
          const typeConfig = {
            success: {
              border: 'border-[#15803D]',
              shadow: 'shadow-[4px_4px_0px_0px_#15803D]',
              icon: <CheckCircle2 className="w-5 h-5 text-[#15803D]" strokeWidth={1.5} />,
              titleColor: 'text-[#15803D]',
            },
            error: {
              border: 'border-[#F97316]',
              shadow: 'shadow-[4px_4px_0px_0px_#F97316]',
              icon: <AlertCircle className="w-5 h-5 text-[#F97316]" strokeWidth={1.5} />,
              titleColor: 'text-[#F97316]',
            },
            warning: {
              border: 'border-[#FACC15]',
              shadow: 'shadow-[4px_4px_0px_0px_#FACC15]',
              icon: <AlertTriangle className="w-5 h-5 text-[#FACC15]" strokeWidth={1.5} />,
              titleColor: 'text-[#FACC15]',
            },
            info: {
              border: 'border-[#7C3AED]',
              shadow: 'shadow-[4px_4px_0px_0px_#7C3AED]',
              icon: <Info className="w-5 h-5 text-[#7C3AED]" strokeWidth={1.5} />,
              titleColor: 'text-[#7C3AED]',
            },
          }[n.type];

          return (
            <div
              key={n.id}
              className={`pointer-events-auto bg-[#0E0E0E] border-2 ${typeConfig.border} ${typeConfig.shadow} p-4 flex items-start gap-3 transition-all animate-in slide-in-from-right-4`}
            >
              <div className="shrink-0 mt-0.5">{typeConfig.icon}</div>
              <div className="flex-1 text-left">
                <h5 className={`font-mono font-bold text-xs uppercase ${typeConfig.titleColor}`}>
                  {n.title}
                </h5>
                {n.message && (
                  <p className="text-xs text-[#CCCCCC] font-sans mt-0.5 leading-snug">
                    {n.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="text-[#666666] hover:text-[#E5E5E5] p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
