import { 
  Settings as SettingsIcon, 
  Shield, 
  Monitor, 
  Bell, 
  Users, 
  Database,
  Mail,
  Globe,
  Lock,
  Palette
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';

export function Settings() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sozlamalar</h1>
        <p className="text-muted-foreground">
          LMS platformasi va SCORM tizimi sozlamalari
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Umumiy</TabsTrigger>
          <TabsTrigger value="scorm">SCORM</TabsTrigger>
          <TabsTrigger value="proctoring">Proctoring</TabsTrigger>
          <TabsTrigger value="notifications">Bildirishnomalar</TabsTrigger>
          <TabsTrigger value="users">Foydalanuvchilar</TabsTrigger>
          <TabsTrigger value="security">Xavfsizlik</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Platforma Sozlamalari
              </CardTitle>
              <CardDescription>
                Asosiy platforma sozlamalari va konfiguratsiya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platforma nomi</Label>
                  <Input id="platform-name" defaultValue="EduLMS" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-url">Platforma URL</Label>
                  <Input id="platform-url" defaultValue="https://edulms.uz" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Administrator email</Label>
                  <Input id="admin-email" defaultValue="admin@edulms.uz" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Qo'llab-quvvatlash email</Label>
                  <Input id="support-email" defaultValue="support@edulms.uz" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Ro'yxatdan o'tishga ruxsat</Label>
                    <p className="text-sm text-muted-foreground">
                      Yangi foydalanuvchilar o'z-o'zidan ro'yxatdan o'ta olsinmi
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Email tasdiqlash</Label>
                    <p className="text-sm text-muted-foreground">
                      Ro'yxatdan o'tishda email tasdiqlash talab qilinsinmi
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button>Saqlash</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCORM Settings */}
        <TabsContent value="scorm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SCORM Konfiguratsiya
              </CardTitle>
              <CardDescription>
                SCORM standartlari va uyg'unlik sozlamalari
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>SCORM versiyasi</Label>
                  <Select defaultValue="2004">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1.2">SCORM 1.2</SelectItem>
                      <SelectItem value="2004">SCORM 2004 4th Edition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Maksimal fayl hajmi (MB)</Label>
                  <Input type="number" defaultValue="100" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Avtomatik import</Label>
                    <p className="text-sm text-muted-foreground">
                      SCORM paketlarini avtomatik import qilish
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Manifest tekshirish</Label>
                    <p className="text-sm text-muted-foreground">
                      imsmanifest.xml faylini qat'iy tekshirish
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Debug rejimi</Label>
                    <p className="text-sm text-muted-foreground">
                      SCORM API debug ma'lumotlarini yozish
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800 dark:text-green-400">
                    SCORM Engine Holati
                  </span>
                </div>
                <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                  <p>✓ SCORM 2004 4th Edition qo'llab-quvvatlanadi</p>
                  <p>✓ API 1.3.0 faol</p>
                  <p>✓ Sequencing va Navigation qo'llab-quvvatlanadi</p>
                </div>
              </div>

              <Button>Saqlash</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proctoring Settings */}
        <TabsContent value="proctoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Avtoproktoring Sozlamalari
              </CardTitle>
              <CardDescription>
                AI asosida imtihon nazorati sozlamalari
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Yuz tanish</Label>
                    <p className="text-sm text-muted-foreground">
                      Talabaning yuzini tanish va tekshirish
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Ko'z harakati kuzatuvi</Label>
                    <p className="text-sm text-muted-foreground">
                      Ko'z harakati orqali diqqat kuzatuvi
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Ekran yozib olish</Label>
                    <p className="text-sm text-muted-foreground">
                      Imtihon davomida ekranni yozib olish
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Tovush tahlili</Label>
                    <p className="text-sm text-muted-foreground">
                      Noto'g'ri tovushlarni aniqlash
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Ikkinchi qurilma aniqlash</Label>
                    <p className="text-sm text-muted-foreground">
                      Qo'shimcha qurilmalarni aniqlash
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Ogohlantirishlar soni</Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 marta</SelectItem>
                      <SelectItem value="2">2 marta</SelectItem>
                      <SelectItem value="3">3 marta</SelectItem>
                      <SelectItem value="5">5 marta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sezgirlik darajasi</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Past</SelectItem>
                      <SelectItem value="medium">O'rta</SelectItem>
                      <SelectItem value="high">Yuqori</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 dark:text-blue-400">
                    AI Proctoring Holati
                  </span>
                </div>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>✓ Yuz tanish modeli yuklangan</p>
                  <p>✓ Ko'z kuzatuvi algoritmi faol</p>
                  <p>✓ Tovush tahlil modeli tayyor</p>
                </div>
              </div>

              <Button>Saqlash</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Bildirishnoma Sozlamalari
              </CardTitle>
              <CardDescription>
                Email va tizim bildirishnomalarini sozlash
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Yangi talaba ro'yxatdan o'tganda</Label>
                    <p className="text-sm text-muted-foreground">
                      Administratorga email yuborish
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Kurs yakunlanganda</Label>
                    <p className="text-sm text-muted-foreground">
                      Talabaga tabriklash emaili yuborish
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Imtihon natijalari</Label>
                    <p className="text-sm text-muted-foreground">
                      Imtihon natijalarini email orqali yuborish
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Proctoring ogohlantirishlari</Label>
                    <p className="text-sm text-muted-foreground">
                      Shubhali harakatlar haqida darhol xabar berish
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>SMTP Server</Label>
                  <Input defaultValue="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Port</Label>
                  <Input defaultValue="587" />
                </div>
              </div>

              <Button>Saqlash</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Foydalanuvchi Sozlamalari
              </CardTitle>
              <CardDescription>
                Foydalanuvchi rollari va ruxsatlari
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { role: 'Administrator', users: 2, permissions: 'Barcha ruxsatlar' },
                  { role: 'O\'qituvchi', users: 15, permissions: 'Kurs va imtihon boshqaruvi' },
                  { role: 'Talaba', users: 2847, permissions: 'Kurs ko\'rish va imtihon topshirish' },
                ].map((role, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{role.role}</div>
                      <div className="text-sm text-muted-foreground">{role.permissions}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{role.users} foydalanuvchi</Badge>
                      <Button variant="outline" size="sm">Tahrirlash</Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button>Yangi Rol Qo'shish</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Xavfsizlik Sozlamalari
              </CardTitle>
              <CardDescription>
                Tizim xavfsizligi va autentifikatsiya sozlamalari
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Ikki faktorli autentifikatsiya</Label>
                    <p className="text-sm text-muted-foreground">
                      Barcha administratorlar uchun majburiy 2FA
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Session timeout</Label>
                    <p className="text-sm text-muted-foreground">
                      Avtomatik chiqish (30 daqiqa)
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">IP whitelist</Label>
                    <p className="text-sm text-muted-foreground">
                      Faqat ruxsat etilgan IP manzillardan kirish
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Parol murakkabligi</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Oddiy (6+ belgi)</SelectItem>
                      <SelectItem value="medium">O'rta (8+ belgi, raqam)</SelectItem>
                      <SelectItem value="high">Yuqori (12+ belgi, maxsus)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Login urinishlari</Label>
                  <Select defaultValue="5">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 marta</SelectItem>
                      <SelectItem value="5">5 marta</SelectItem>
                      <SelectItem value="10">10 marta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button>Saqlash</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}