import { NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'vertex_notifications_v1';

class NotificationEngineService {
  private notifications: NotificationItem[] = [];
  private listeners: ((items: NotificationItem[]) => void)[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        this.notifications = JSON.parse(saved);
      } else {
        this.notifications = [...INITIAL_NOTIFICATIONS];
        this.save();
      }
    } catch {
      this.notifications = [...INITIAL_NOTIFICATIONS];
    }
  }

  private save() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save notification:', e);
    }
  }

  public subscribe(listener: (items: NotificationItem[]) => void) {
    this.listeners.push(listener);
    listener(this.getNotifications());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const list = this.getNotifications();
    this.listeners.forEach(l => l(list));
  }

  public getNotifications(): NotificationItem[] {
    return [...this.notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    sourceEngine: string = 'System Engine'
  ): NotificationItem {
    const newItem: NotificationItem = {
      id: `NOTIF-${Date.now().toString().slice(-6)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false,
      sourceEngine
    };

    this.notifications.unshift(newItem);
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    this.save();
    return newItem;
  }

  public markAsRead(id: string) {
    const item = this.notifications.find(n => n.id === id);
    if (item) {
      item.read = true;
      this.save();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach(n => (n.read = true));
    this.save();
  }

  public clearAll() {
    this.notifications = [];
    this.save();
  }
}

export const notificationEngine = new NotificationEngineService();
