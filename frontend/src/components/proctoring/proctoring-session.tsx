import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Monitor, 
  Camera, 
  Mic, 
  Shield, 
  AlertTriangle, 
  Eye,
  Volume2,
  Wifi,
  Battery,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ProctoringSession() {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(5400); // 90 minutes
  const [violations, setViolations] = useState<string[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    camera: true,
    microphone: true,
    screen: true,
    network: true,
    battery: 85,
  });

  const examData = {
    title: 'JavaScript Yakuniy Imtihon',
    duration: 90,
    questions: 50,
    currentQuestion: 1,
  };

  useEffect(() => {
    // Initialize camera and microphone
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsRecording(true);
      } catch (error) {
        console.error('Media access denied:', error);
        setViolations(prev => [...prev, 'Kamera yoki mikrofon ruxsati berilmadi']);
      }
    };

    initializeMedia();

    // Timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate AI monitoring
    const monitoringInterval = setInterval(() => {
      // Simulate random violations for demo
      const randomViolations = [
        'Yuzdan uzoqlashish aniqlandi',
        'Ikkinchi shaxs aniqlandi',
        'Noto\'g\'ri harakat aniqlandi',
        'Ovoz o\'zgarishi aniqlandi',
      ];
      
      if (Math.random() < 0.1) { // 10% chance
        const violation = randomViolations[Math.floor(Math.random() * randomViolations.length)];
        setViolations(prev => [...prev.slice(-4), violation]); // Keep last 5 violations
      }
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(monitoringInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Proctoring Session
          </h1>
          <p className="text-muted-foreground">{examData.title}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(timeRemaining)}
          </Badge>
          <Badge variant={isRecording ? "default" : "destructive"} className="gap-1">
            <Monitor className="h-3 w-3" />
            {isRecording ? 'Yozilmoqda' : 'To\'xtatilgan'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Exam Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Exam Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Imtihon jarayoni</span>
                <span className="text-sm font-normal">
                  Savol {examData.currentQuestion} / {examData.questions}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={(examData.currentQuestion / examData.questions) * 100} 
                className="h-2" 
              />
            </CardContent>
          </Card>

          {/* Question Area */}
          <Card>
            <CardHeader>
              <CardTitle>Savol {examData.currentQuestion}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-muted/50 rounded-lg">
                <h3 className="font-medium mb-4">
                  JavaScript-da qaysi operator mantiqiy "VA" amalini bajaradi?
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="question1" value="a" />
                    <span>A) ||</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="question1" value="b" />
                    <span>B) &&</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="question1" value="c" />
                    <span>C) !</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="question1" value="d" />
                    <span>D) ==</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline">Oldingi savol</Button>
                <Button>Keyingi savol</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proctoring Panel */}
        <div className="space-y-4">
          {/* Camera Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Kamera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-32 bg-black rounded-lg object-cover"
                />
                {isRecording && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tizim holati</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className={`h-4 w-4 ${getStatusColor(systemStatus.camera)}`} />
                  <span className="text-sm">Kamera</span>
                </div>
                <Badge variant={systemStatus.camera ? "secondary" : "destructive"}>
                  {systemStatus.camera ? 'Faol' : 'Xato'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className={`h-4 w-4 ${getStatusColor(systemStatus.microphone)}`} />
                  <span className="text-sm">Mikrofon</span>
                </div>
                <Badge variant={systemStatus.microphone ? "secondary" : "destructive"}>
                  {systemStatus.microphone ? 'Faol' : 'Xato'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className={`h-4 w-4 ${getStatusColor(systemStatus.screen)}`} />
                  <span className="text-sm">Ekran</span>
                </div>
                <Badge variant={systemStatus.screen ? "secondary" : "destructive"}>
                  {systemStatus.screen ? 'Yozilmoqda' : 'Xato'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className={`h-4 w-4 ${getStatusColor(systemStatus.network)}`} />
                  <span className="text-sm">Internet</span>
                </div>
                <Badge variant={systemStatus.network ? "secondary" : "destructive"}>
                  {systemStatus.network ? 'Barqaror' : 'Xato'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Batareya</span>
                </div>
                <span className="text-sm font-medium">{systemStatus.battery}%</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-4 w-4" />
                AI Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Yuz tanish: Faol</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Ko'z kuzatuvi: Faol</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Tovush tahlili: Faol</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Harakat aniqlash: Faol</span>
              </div>
            </CardContent>
          </Card>

          {/* Violations */}
          {violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" />
                  Ogohlantirishlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {violations.slice(-3).map((violation, index) => (
                  <Alert key={index} className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {violation}
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}