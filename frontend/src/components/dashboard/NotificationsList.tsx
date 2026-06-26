import { Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'course' | 'assignment' | 'test' | 'grade' | 'attendance' | 'system';
  isRead: boolean;
  createdAt: Date;
}

interface NotificationsListProps {
  notifications: Notification[];
  onViewAll?: () => void;
}

export function NotificationsList({ notifications, onViewAll }: NotificationsListProps) {
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'course':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'assignment':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/20';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Bildirishnomalar
        </CardTitle>
        <CardDescription>So'nggi xabarlar va yangilanishlar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Bildirishnomalar yo'q</p>
          ) : (
            <>
              {notifications.slice(0, 3).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg border-l-4 ${getNotificationStyle(notification.type)} ${!notification.isRead ? 'font-medium' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString('uz') : ''}
                    </span>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                className="w-full gap-2 mt-4"
                onClick={onViewAll}
              >
                <Bell className="h-4 w-4" />
                Barcha Bildirishnomalar
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
