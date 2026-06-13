import { CheckCircle2, AlertCircle, Settings2, Plug, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface Integration {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "error";
  category: string;
  version?: string;
  lastSync?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "scorm-2004",
    name: "SCORM 2004",
    description: "SCORM 2004 4th Edition standartini qo'llab-quvvatlash. Kurs paketlarini import va export qilish.",
    status: "active",
    category: "Ta'lim standarti",
    version: "4th Edition",
    lastSync: "Doim faol",
  },
  {
    id: "scorm-12",
    name: "SCORM 1.2",
    description: "Eski SCORM 1.2 formatidagi paketlar bilan ishlash imkoniyati.",
    status: "active",
    category: "Ta'lim standarti",
    version: "1.2",
    lastSync: "Doim faol",
  },
  {
    id: "ldap",
    name: "LDAP / Active Directory",
    description: "Korporativ foydalanuvchilarni LDAP/AD orqali autentifikatsiya qilish.",
    status: "inactive",
    category: "Autentifikatsiya",
    version: "v3",
    lastSync: "Ulanmagan",
  },
  {
    id: "sso-saml",
    name: "SSO / SAML 2.0",
    description: "Yagona kirish tizimi (Single Sign-On) SAML 2.0 protokoli orqali.",
    status: "inactive",
    category: "Autentifikatsiya",
    lastSync: "Ulanmagan",
  },
  {
    id: "smtp",
    name: "SMTP Email",
    description: "Tizim bildirishnomalari va parol tiklash uchun email xizmati.",
    status: "active",
    category: "Xabarnoma",
    lastSync: "5 daqiqa oldin",
  },
  {
    id: "sms",
    name: "SMS Gateway",
    description: "SMS orqali bildirishnomalar yuborish (Eskiz, Playmobile).",
    status: "error",
    category: "Xabarnoma",
    lastSync: "Xato: API kalit yaroqsiz",
  },
  {
    id: "lti",
    name: "LTI 1.3",
    description: "Learning Tools Interoperability — tashqi o'quv qurollarini ulash.",
    status: "inactive",
    category: "Ta'lim standarti",
    version: "1.3",
    lastSync: "Ulanmagan",
  },
  {
    id: "zoom",
    name: "Zoom Meetings",
    description: "Video darslar va onlayn imtihonlar uchun Zoom integratsiyasi.",
    status: "active",
    category: "Video konferensiya",
    lastSync: "1 soat oldin",
  },
];

const STATUS_META: Record<string, { label: string; icon: React.ElementType; cls: string; badgeCls: string }> = {
  active:   { label: "Faol",    icon: CheckCircle2, cls: "text-green-600", badgeCls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  inactive: { label: "Nofaol",  icon: Plug,         cls: "text-slate-400", badgeCls: "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400"  },
  error:    { label: "Xato",    icon: AlertCircle,  cls: "text-red-600",   badgeCls: "bg-red-100   text-red-800   dark:bg-red-900/30   dark:text-red-300"   },
};

const CATEGORIES = [...new Set(INTEGRATIONS.map((i) => i.category))];

export function AdminIntegrations() {
  const active = INTEGRATIONS.filter((i) => i.status === "active").length;
  const errors = INTEGRATIONS.filter((i) => i.status === "error").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integratsiyalar</h1>
          <p className="text-muted-foreground">Tashqi tizimlar va standartlar bilan ulanishlar</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />Hammani yangilash
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-600">{active}</div>
              <div className="text-xs text-muted-foreground">Faol</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-red-600">{errors}</div>
              <div className="text-xs text-muted-foreground">Xato</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Plug className="h-8 w-8 text-slate-400" />
            <div>
              <div className="text-2xl font-bold">{INTEGRATIONS.length - active - errors}</div>
              <div className="text-xs text-muted-foreground">Nofaol</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration groups */}
      {CATEGORIES.map((category) => {
        const items = INTEGRATIONS.filter((i) => i.category === category);
        return (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((item) => {
                const meta = STATUS_META[item.status];
                const Icon = meta.icon;
                return (
                  <Card key={item.id} className={item.status === "error" ? "border-red-200 dark:border-red-900/50" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 shrink-0 ${meta.cls}`} />
                          <div>
                            <CardTitle className="text-base">
                              {item.name}
                              {item.version && <span className="text-xs font-normal text-muted-foreground ml-1">v{item.version}</span>}
                            </CardTitle>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={meta.badgeCls}>{meta.label}</Badge>
                          <Switch
                            checked={item.status === "active"}
                            disabled={item.status === "error"}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <CardDescription className="text-xs">{item.description}</CardDescription>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{item.lastSync}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}