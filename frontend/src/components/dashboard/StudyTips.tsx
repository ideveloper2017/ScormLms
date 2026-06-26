import { Calendar, Lightbulb, Coffee } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const studyTips = [
  {
    id: 1,
    title: 'Kunlik o\'quv rejasi tuzing',
    description: 'Har kuni ma\'lum vaqtni o\'qishga ajrating',
    icon: Calendar,
    category: 'Vaqt boshqaruvi',
  },
  {
    id: 2,
    title: 'Amaliy loyihalar yarating',
    description: 'Nazariy bilimlarni amaliyotda qo\'llang',
    icon: Lightbulb,
    category: 'Amaliyot',
  },
  {
    id: 3,
    title: 'Tanaffus qiling',
    description: 'Har 45 daqiqada 10-15 daqiqa tanaffus',
    icon: Coffee,
    category: 'Salomatlik',
  },
];

export function StudyTips() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          O'quv Maslahatlari
        </CardTitle>
        <CardDescription>Samarali o'qish uchun tavsiyalar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {studyTips.map((tip) => {
            const Icon = tip.icon;
            return (
              <div key={tip.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-sm">{tip.title}</h4>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                    <Badge variant="outline" className="text-xs mt-1">{tip.category}</Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
