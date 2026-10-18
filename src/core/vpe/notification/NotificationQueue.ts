import { NotificationRecord, NotificationChannel, NotificationDeliveryLog } from './NotificationTypes';

export class NotificationQueue {
  private queue: NotificationRecord[] = [];
  private history: NotificationRecord[] = [];

  public enqueue(notification: NotificationRecord): void {
    // Insert into priority queue
    this.queue.push(notification);
    this.sortQueue();
  }

  private sortQueue(): void {
    const priorityWeight: Record<string, number> = {
      EMERGENCY: 5,
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1
    };

    this.queue.sort((a, b) => {
      const pDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  public processQueue(): { processed: number; delivered: number; failed: number } {
    const now = new Date();
    const readyItems: NotificationRecord[] = [];
    const remainingItems: NotificationRecord[] = [];

    for (const item of this.queue) {
      if (item.scheduledAt && new Date(item.scheduledAt) > now) {
        remainingItems.push(item);
        continue;
      }

      if (item.expiresAt && new Date(item.expiresAt) < now) {
        item.status = 'failed';
        item.deliveryLogs.push({
          id: `LOG-EXP-${Date.now()}`,
          channel: 'in_app',
          status: 'failed',
          timestamp: now.toISOString(),
          errorMessage: 'Notification expired before dispatch window.',
          retryCount: 0
        });
        this.history.unshift(item);
        continue;
      }

      readyItems.push(item);
    }

    this.queue = remainingItems;
    let delivered = 0;
    let failed = 0;

    for (const item of readyItems) {
      item.status = 'processing';
      const logs: NotificationDeliveryLog[] = [];
      let isAnyDelivered = false;

      for (const channel of item.channels) {
        const result = this.dispatchToChannel(channel, item);
        logs.push(result);
        if (result.status === 'sent') {
          isAnyDelivered = true;
        }
      }

      item.deliveryLogs.push(...logs);
      if (isAnyDelivered) {
        item.status = 'delivered';
        item.deliveredAt = new Date().toISOString();
        delivered++;
      } else {
        item.status = 'failed';
        failed++;
      }

      this.history.unshift(item);
    }

    return { processed: readyItems.length, delivered, failed };
  }

  private dispatchToChannel(channel: NotificationChannel, item: NotificationRecord): NotificationDeliveryLog {
    const timestamp = new Date().toISOString();
    // Simulate high success rate with mock transport adapters
    const mockSuccess = true;

    if (mockSuccess) {
      return {
        id: `LOG-${channel.toUpperCase()}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        channel,
        status: 'sent',
        timestamp,
        retryCount: 0
      };
    } else {
      return {
        id: `LOG-${channel.toUpperCase()}-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        channel,
        status: 'failed',
        timestamp,
        errorMessage: `Transport adapter timeout for channel ${channel}`,
        retryCount: 1
      };
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getPendingQueue(): NotificationRecord[] {
    return [...this.queue];
  }

  public getHistory(): NotificationRecord[] {
    return [...this.history];
  }

  public seedInitialHistory(records: NotificationRecord[]): void {
    this.history = [...records, ...this.history];
  }
}

export const notificationQueue = new NotificationQueue();
