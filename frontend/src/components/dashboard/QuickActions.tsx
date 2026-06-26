import { Play, Upload, MessageCircle, User, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const quickActions = [
  { id: 1, title: 'Yangi Darsni Boshlash', icon: Play, color: 'bg-green-100 text-green-800', action: 'start-lesson' },
  { id: 2, title: 'Topshiriq Yuborish', icon: Upload, color: 'bg-blue-100 text-blue-800', action: 'submit-assignment' },
  { id: 3, title: 'O\'qituvchi bilan Bog\'lanish', icon: MessageCircle, color: 'bg-purple-100 text-purple-800', action: 'contact-teacher' },
  { id: 4, title: 'Shaxsiy Kabinet', icon: User, color: 'bg-orange-100 text-orange-800', action: 'personal-cabinet' },
];

interface QuickActionsProps {
  onActionClick?: (action: string) => void;
}

export function QuickActions({ onActionClick }: QuickActionsProps) {
  const handleActionClick = (action: string) => {
    if (onActionClick) {
      onActionClick(action);
    }
    // TODO: Implement action handlers
    console.log('Action clicked:', action);
  };

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-600" />
          Tezkor Amallar
        </CardTitle>
        <CardDescription>
          Eng ko'p ishlatiladigan funksiyalar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-20 flex-col gap-2 hover:scale-105 transition-all duration-200"
                onClick={() => handleActionClick(action.action)}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs text-center">{action.title}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
