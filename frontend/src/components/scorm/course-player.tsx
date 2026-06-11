import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Maximize,
  BookOpen,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

export function CoursePlayer() {
  const { id } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(25);
  const [volume, setVolume] = useState([80]);
  const [currentLesson, setCurrentLesson] = useState(1);

  const courseData = {
    id: 1,
    title: 'JavaScript Asoslari',
    totalLessons: 12,
    completedLessons: 3,
    duration: '8 soat',
    scormVersion: '2004 4th Edition',
    lessons: [
      { id: 1, title: 'JavaScript ga kirish', duration: '15:30', completed: true },
      { id: 2, title: 'O\'zgaruvchilar va ma\'lumot turlari', duration: '22:15', completed: true },
      { id: 3, title: 'Operatorlar', duration: '18:45', completed: true },
      { id: 4, title: 'Shartli operatorlar', duration: '25:20', completed: false },
      { id: 5, title: 'Sikllar', duration: '30:10', completed: false },
    ]
  };

  useEffect(() => {
    // SCORM API initialization simulation
    console.log('SCORM API initialized for course:', id);
    
    // Simulate SCORM tracking
    const interval = setInterval(() => {
      if (isPlaying) {
        setProgress(prev => Math.min(prev + 1, 100));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [id, isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // SCORM tracking: lesson_status = "incomplete" | "completed" | "passed" | "failed"
    console.log('SCORM: Lesson status updated');
  };

  const handleLessonComplete = () => {
    // SCORM completion tracking
    console.log('SCORM: Lesson completed, updating LMS');
    setProgress(100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Course Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{courseData.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              Dars {currentLesson} / {courseData.totalLessons}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {courseData.duration}
            </div>
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              SCORM {courseData.scormVersion}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent className="p-0">
              {/* Video Container */}
              <div className="relative bg-black rounded-t-lg aspect-video flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8 ml-1" />
                    )}
                  </div>
                  <p className="text-lg font-medium">JavaScript Asoslari - Dars {currentLesson}</p>
                  <p className="text-sm text-white/70">SCORM uyumli kontent</p>
                </div>
              </div>

              {/* Video Controls */}
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Dars jarayoni</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button onClick={handlePlayPause} size="icon">
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                    <Button variant="ghost" size="icon">
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SCORM Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SCORM Ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Holat</p>
                  <p className="font-medium">O'qilmoqda</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ball</p>
                  <p className="font-medium">85/100</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vaqt</p>
                  <p className="font-medium">45:30</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Urinishlar</p>
                  <p className="font-medium">1/3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lesson List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Darslar ro'yxati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {courseData.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentLesson === lesson.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentLesson(lesson.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {lesson.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-muted-foreground rounded-full" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kurs jarayoni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Umumiy jarayon</span>
                    <span>{Math.round((courseData.completedLessons / courseData.totalLessons) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(courseData.completedLessons / courseData.totalLessons) * 100} 
                    className="h-2" 
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>{courseData.completedLessons} / {courseData.totalLessons} dars yakunlandi</p>
                </div>

                {progress === 100 && (
                  <Button onClick={handleLessonComplete} className="w-full">
                    Darsni yakunlash
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}