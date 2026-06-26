import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen, Plus, Search, Download, Eye, FileText,
  Library, Microscope, ExternalLink, Tag, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { qk } from '@/lib/query-keys';
import { resourcesApi } from '@/services/api/resources-api';

const TYPE_ICON: Record<string, JSX.Element> = {
  pdf:      <FileText className="h-4 w-4" />,
  video:    <BookOpen className="h-4 w-4" />,
  document: <Library className="h-4 w-4" />,
  archive:  <Microscope className="h-4 w-4" />,
  link:     <ExternalLink className="h-4 w-4" />,
  image:    <BookOpen className="h-4 w-4" />,
};

const TYPE_BADGE: Record<string, string> = {
  pdf:      'bg-blue-100 text-blue-800',
  video:    'bg-purple-100 text-purple-800',
  document: 'bg-green-100 text-green-800',
  archive:  'bg-orange-100 text-orange-800',
  link:     'bg-cyan-100 text-cyan-800',
  image:    'bg-pink-100 text-pink-800',
};

const TYPE_LABEL: Record<string, string> = {
  pdf:      'PDF',
  video:    'Video',
  document: 'Hujjat',
  archive:  'Arxiv',
  link:     'Havola',
  image:    'Rasm',
};

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function Resources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  const { data: resources = [], isLoading, error, refetch } = useQuery({
    queryKey: qk.resources.list(),
    queryFn: () => resourcesApi.getResources(),
    staleTime: 120_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: qk.resources.categories(),
    queryFn: resourcesApi.getCategories,
    staleTime: 300_000,
  });

  const filtered = resources.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || r.type === selectedType;
    return matchSearch && matchType;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-10 w-16" /></CardContent></Card>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Card key={i}><CardContent className="pt-6 space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Axborot Resurslari</h1>
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
            <p className="text-destructive font-medium">Ma'lumotlarni yuklab bo'lmadi</p>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />Qayta urinish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeGroups = ['pdf', 'video', 'document', 'archive', 'link', 'image'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Axborot Resurslari</h1>
          <p className="text-muted-foreground">O'quv materiallari va resurslar</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Yangi Resurs</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yangi Resurs Qo'shish</DialogTitle>
              <DialogDescription>Yangi o'quv resursi yoki materialini qo'shing</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Sarlavha</Label>
                <Input placeholder="Resurs sarlavhasini kiriting" />
              </div>
              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Textarea placeholder="Resurs haqida qisqacha ma'lumot" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turi</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Tur" /></SelectTrigger>
                    <SelectContent>
                      {typeGroups.map(t => (
                        <SelectItem key={t} value={t}>{TYPE_LABEL[t] ?? t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Havola (URL)</Label>
                  <Input placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Qo'shish</Button>
                <Button variant="outline">Bekor qilish</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats from categories */}
      {categories.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 4).map(cat => (
            <Card key={cat.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {}}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{cat.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cat.count}</div>
                <div className="text-xs text-muted-foreground">resurs</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {categories.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Jami Resurslar', value: resources.length, icon: BookOpen,   cls: 'text-slate-600'  },
            { label: 'PDF',            value: resources.filter(r => r.type === 'pdf').length,   icon: FileText, cls: 'text-blue-600'   },
            { label: 'Video',          value: resources.filter(r => r.type === 'video').length, icon: BookOpen, cls: 'text-purple-600' },
            { label: 'Hujjat',         value: resources.filter(r => r.type === 'document').length, icon: Library, cls: 'text-green-600' },
          ].map(({ label, value, icon: Icon, cls }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${cls}`} />{label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${cls}`}>{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Resurslarni qidiring..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Tur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barchasi</SelectItem>
            {typeGroups.map(t => <SelectItem key={t} value={t}>{TYPE_LABEL[t] ?? t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-2">Resurslar topilmadi</h3>
          <p className="text-muted-foreground mb-4">Qidiruv shartlaringizga mos resurslar mavjud emas</p>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedType('all'); }}>
            Filterni tozalash
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(resource => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2 flex-1">{resource.title}</CardTitle>
                  <Badge className={TYPE_BADGE[resource.type] ?? 'bg-gray-100 text-gray-800'}>
                    <div className="flex items-center gap-1">
                      {TYPE_ICON[resource.type]}
                      {TYPE_LABEL[resource.type] ?? resource.type}
                    </div>
                  </Badge>
                </div>
                {resource.description && (
                  <CardDescription className="text-sm line-clamp-2">{resource.description}</CardDescription>
                )}
                {resource.course && (
                  <div className="text-xs text-muted-foreground">{resource.course}</div>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{resource.uploadedAt}</span>
                  {resource.size && <span>{formatSize(resource.size)}</span>}
                  {resource.downloadCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />{resource.downloadCount}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 gap-1" size="sm" asChild>
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      <Eye className="h-4 w-4" />Ko'rish
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={resource.url} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
