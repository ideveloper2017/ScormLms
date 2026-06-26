import { BookOpen, CheckCircle, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardsProps {
  activeCourses: number;
  completedCourses: number;
  totalCredits: number;
  gpa: number;
}

export function StatsCards({ activeCourses, completedCourses, totalCredits, gpa }: StatsCardsProps) {
  const stats = [
    {
      id: 1,
      title: 'Faol Kurslar',
      value: activeCourses,
      subtitle: 'Davom etmoqda',
      icon: BookOpen,
      gradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconBg: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
    },
    {
      id: 2,
      title: 'Yakunlangan',
      value: completedCourses,
      subtitle: 'Kurslar',
      icon: CheckCircle,
      gradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
    },
    {
      id: 3,
      title: 'Jami Kreditlar',
      value: totalCredits,
      subtitle: 'Kredit',
      icon: Award,
      gradient: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      border: 'border-purple-200 dark:border-purple-800',
      iconBg: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
    },
    {
      id: 4,
      title: 'GPA',
      value: gpa,
      subtitle: '5.0 dan',
      icon: TrendingUp,
      gradient: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
      border: 'border-amber-200 dark:border-amber-800',
      iconBg: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={stat.id} 
            className={`bg-gradient-to-br ${stat.gradient} ${stat.border} border-2 hover:shadow-xl transition-all duration-300 hover:scale-105`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {stat.title}
                </span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.iconBg} shadow-md`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
