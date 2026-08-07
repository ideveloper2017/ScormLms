import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ChevronLeft, EyeOff, History, Loader2, Lock, MessageSquare, Pencil, Pin, Reply, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { courseForumApi, type ForumPost, type ForumTopicStatus } from '@/services/api/course-forum-api';

export function CourseForum({ courseId }: { courseId: number | string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicBody, setTopicBody] = useState('');
  const [postBody, setPostBody] = useState('');
  const [replyTo, setReplyTo] = useState<ForumPost | null>(null);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editBody, setEditBody] = useState('');
  const [hidingPost, setHidingPost] = useState<ForumPost | null>(null);
  const [hideReason, setHideReason] = useState('');
  const [historyPost, setHistoryPost] = useState<ForumPost | null>(null);

  const topicsKey = ['course-forum', String(courseId), 'topics'];
  const postsKey = ['course-forum', String(courseId), 'posts', selectedTopicId];
  const topicsQuery = useQuery({ queryKey: topicsKey, queryFn: () => courseForumApi.getTopics(courseId) });
  const postsQuery = useQuery({
    queryKey: postsKey,
    queryFn: () => courseForumApi.getPosts(courseId, selectedTopicId!),
    enabled: selectedTopicId !== null,
  });
  const historyQuery = useQuery({
    queryKey: ['course-forum', String(courseId), 'history', historyPost?.id],
    queryFn: () => courseForumApi.getRevisions(courseId, historyPost!.topicId, historyPost!.id),
    enabled: historyPost !== null,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: topicsKey });
    if (selectedTopicId !== null) await queryClient.invalidateQueries({ queryKey: postsKey });
  };
  const fail = (title: string) => (cause: Error) => toast({ variant: 'destructive', title, description: cause.message });
  const createTopicMutation = useMutation({
    mutationFn: () => courseForumApi.createTopic(courseId, topicTitle.trim(), topicBody.trim()),
    onSuccess: async topic => {
      setTopicTitle(''); setTopicBody(''); setSelectedTopicId(topic.id); await refresh();
      toast({ title: 'Forum mavzusi yaratildi' });
    },
    onError: fail("Forum mavzusi yaratilmadi"),
  });
  const createPostMutation = useMutation({
    mutationFn: () => courseForumApi.createPost(courseId, selectedTopicId!, postBody.trim(), replyTo?.id),
    onSuccess: async () => {
      setPostBody(''); setReplyTo(null); await refresh(); toast({ title: 'Javob yuborildi' });
    },
    onError: fail("Javob yuborilmadi"),
  });
  const editPostMutation = useMutation({
    mutationFn: () => courseForumApi.editPost(courseId, editingPost!.topicId, editingPost!.id, editBody.trim()),
    onSuccess: async () => {
      setEditingPost(null); setEditBody(''); await refresh(); toast({ title: 'Post yangilandi' });
    },
    onError: fail("Post yangilanmadi"),
  });
  const hidePostMutation = useMutation({
    mutationFn: () => courseForumApi.hidePost(courseId, hidingPost!.topicId, hidingPost!.id, hideReason.trim()),
    onSuccess: async () => {
      setHidingPost(null); setHideReason(''); await refresh(); toast({ title: 'Post yashirildi' });
    },
    onError: fail("Post yashirilmadi"),
  });
  const moderateMutation = useMutation({
    mutationFn: (payload: { status?: ForumTopicStatus; pinned?: boolean }) =>
      courseForumApi.moderateTopic(courseId, selectedTopicId!, payload),
    onSuccess: async topic => {
      await refresh();
      if (topic.status === 'ARCHIVED') setSelectedTopicId(null);
      toast({ title: 'Forum moderatsiyasi saqlandi' });
    },
    onError: fail("Forum moderatsiyasi saqlanmadi"),
  });

  if (topicsQuery.isLoading) return <ForumLoading text="Forum yuklanmoqda..." />;
  if (topicsQuery.error) return <ForumError message={topicsQuery.error.message} retry={() => topicsQuery.refetch()} />;
  const topicPage = topicsQuery.data!;

  if (selectedTopicId !== null) {
    if (postsQuery.isLoading) return <ForumLoading text="Muhokama yuklanmoqda..." />;
    if (postsQuery.error) return <ForumError message={postsQuery.error.message} retry={() => postsQuery.refetch()} />;
    const page = postsQuery.data!;
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2" onClick={() => { setSelectedTopicId(null); setReplyTo(null); }}><ChevronLeft className="h-4 w-4" />Mavzularga qaytish</Button>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1"><CardTitle className="flex items-center gap-2">{page.topic.pinned && <Pin className="h-4 w-4" />}{page.topic.title}</CardTitle><CardDescription>{page.topic.authorName} · {dateTime(page.topic.createdAt)} · {page.topic.replyCount} javob</CardDescription></div>
              <Badge variant={page.topic.status === 'OPEN' ? 'default' : 'secondary'}>{statusLabel(page.topic.status)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4"><p className="whitespace-pre-wrap text-sm">{page.topic.body}</p>{page.topic.canModerate && <div className="flex flex-wrap gap-2 border-t pt-4"><Button size="sm" variant="outline" className="gap-2" onClick={() => moderateMutation.mutate({ pinned: !page.topic.pinned })}><Pin className="h-4 w-4" />{page.topic.pinned ? 'Ajratish' : 'Mahkamlash'}</Button>{page.topic.status === 'OPEN' ? <Button size="sm" variant="outline" className="gap-2" onClick={() => moderateMutation.mutate({ status: 'LOCKED' })}><Lock className="h-4 w-4" />Yopish</Button> : page.topic.status === 'LOCKED' && <Button size="sm" variant="outline" onClick={() => moderateMutation.mutate({ status: 'OPEN' })}>Qayta ochish</Button>}<Button size="sm" variant="outline" className="gap-2" onClick={() => moderateMutation.mutate({ status: 'ARCHIVED' })}><Archive className="h-4 w-4" />Arxivlash</Button></div>}</CardContent>
        </Card>

        <div className="space-y-3">
          {page.posts.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Hali javob yo'q. Birinchi bo'lib fikr bildiring.</CardContent></Card>}
          {page.posts.map(post => <Card key={post.id} className={post.hidden ? 'border-dashed bg-muted/30' : ''}><CardContent className="pt-5 space-y-3"><div className="flex flex-wrap justify-between gap-2"><div><strong className="text-sm">{post.authorName}</strong><p className="text-xs text-muted-foreground">{dateTime(post.createdAt)}{post.editedAt ? ` · tahrirlangan (${post.revisionNumber})` : ''}</p></div>{post.replyToId && <Badge variant="outline">{post.replyToAuthorName ?? `#${post.replyToId}`} ga javob</Badge>}</div>{post.hidden ? <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground"><EyeOff className="mr-2 inline h-4 w-4" />Post yashirilgan: {post.hiddenReason}</div> : editingPost?.id === post.id ? <div className="space-y-2"><Textarea value={editBody} onChange={event => setEditBody(event.target.value)} /><div className="flex gap-2"><Button size="sm" onClick={() => editPostMutation.mutate()} disabled={editBody.trim().length < 2 || editPostMutation.isPending}>Saqlash</Button><Button size="sm" variant="ghost" onClick={() => setEditingPost(null)}>Bekor qilish</Button></div></div> : <p className="whitespace-pre-wrap text-sm">{post.body}</p>}
            {!post.hidden && <div className="flex flex-wrap gap-1 border-t pt-2"><Button size="sm" variant="ghost" className="gap-1" onClick={() => setReplyTo(post)} disabled={!page.canReply}><Reply className="h-4 w-4" />Javob</Button>{post.canEdit && <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setEditingPost(post); setEditBody(post.body ?? ''); }}><Pencil className="h-4 w-4" />Tahrirlash</Button>}{post.canHide && <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => setHidingPost(post)}><EyeOff className="h-4 w-4" />Yashirish</Button>}{post.revisionNumber > 1 && <Button size="sm" variant="ghost" className="gap-1" onClick={() => setHistoryPost(post)}><History className="h-4 w-4" />Tarix</Button>}</div>}
            {hidingPost?.id === post.id && <div className="rounded-md border p-3 space-y-2"><Label>Yashirish sababi</Label><Input value={hideReason} onChange={event => setHideReason(event.target.value)} placeholder="Kamida 5 belgi" /><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={hideReason.trim().length < 5 || hidePostMutation.isPending} onClick={() => hidePostMutation.mutate()}>Tasdiqlash</Button><Button size="sm" variant="ghost" onClick={() => setHidingPost(null)}>Bekor qilish</Button></div></div>}
            {historyPost?.id === post.id && <div className="rounded-md border bg-muted/30 p-3 space-y-2"><div className="flex justify-between"><strong className="text-sm">Tahrir tarixi</strong><Button size="sm" variant="ghost" onClick={() => setHistoryPost(null)}>Yopish</Button></div>{historyQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : historyQuery.error ? <p className="text-sm text-destructive">{historyQuery.error.message}</p> : historyQuery.data?.map(item => <div key={item.revisionNumber} className="border-t pt-2 text-sm"><p className="text-xs text-muted-foreground">v{item.revisionNumber} · {item.changedByName} · {dateTime(item.changedAt)}</p><p className="whitespace-pre-wrap">{item.body}</p></div>)}</div>}
          </CardContent></Card>)}
        </div>

        {page.canReply ? <Card><CardHeader><CardTitle className="text-base">Javob yozish</CardTitle>{replyTo && <CardDescription>{replyTo.authorName} postiga javob · <button className="underline" onClick={() => setReplyTo(null)}>bekor qilish</button></CardDescription>}</CardHeader><CardContent className="space-y-3"><Textarea value={postBody} onChange={event => setPostBody(event.target.value)} placeholder="Fikringizni yozing..." rows={4} /><Button className="gap-2" disabled={postBody.trim().length < 2 || createPostMutation.isPending} onClick={() => createPostMutation.mutate()}><Send className="h-4 w-4" />Yuborish</Button></CardContent></Card> : <Card><CardContent className="py-5 text-sm text-muted-foreground">Bu mavzuga yangi javob yozish yopilgan.</CardContent></Card>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div><h2 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" />Kurs forumi</h2><p className="text-sm text-muted-foreground">Kurs ishtirokchilari bilan mavzuli muhokama olib boring.</p></div>
      {topicPage.canCreateTopic && <Card><CardHeader><CardTitle className="text-base">Yangi mavzu</CardTitle></CardHeader><CardContent className="space-y-3"><div className="space-y-1"><Label htmlFor={`forum-title-${courseId}`}>Mavzu nomi</Label><Input id={`forum-title-${courseId}`} value={topicTitle} onChange={event => setTopicTitle(event.target.value)} maxLength={200} /></div><div className="space-y-1"><Label htmlFor={`forum-body-${courseId}`}>Muhokama matni</Label><Textarea id={`forum-body-${courseId}`} value={topicBody} onChange={event => setTopicBody(event.target.value)} rows={4} /></div><Button className="gap-2" disabled={topicTitle.trim().length < 5 || topicBody.trim().length < 10 || createTopicMutation.isPending} onClick={() => createTopicMutation.mutate()}><MessageSquare className="h-4 w-4" />Mavzu yaratish</Button></CardContent></Card>}
      <div className="space-y-2">{topicPage.items.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">Hozircha forum mavzulari yo'q.</CardContent></Card>}{topicPage.items.map(topic => <button key={topic.id} type="button" className="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/40" onClick={() => setSelectedTopicId(topic.id)}><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-medium flex items-center gap-2">{topic.pinned && <Pin className="h-4 w-4 text-primary" />}{topic.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{topic.body}</p><p className="mt-2 text-xs text-muted-foreground">{topic.authorName} · {dateTime(topic.lastActivityAt)} · {topic.replyCount} javob</p></div><Badge variant={topic.status === 'OPEN' ? 'default' : 'secondary'}>{statusLabel(topic.status)}</Badge></div></button>)}</div>
    </div>
  );
}

function ForumLoading({ text }: { text: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />{text}</div>;
}

function ForumError({ message, retry }: { message: string; retry: () => void }) {
  return <Card><CardContent className="py-8 text-center space-y-3"><p className="text-destructive">{message}</p><Button variant="outline" onClick={retry}>Qayta urinish</Button></CardContent></Card>;
}

function statusLabel(status: ForumTopicStatus): string {
  return status === 'OPEN' ? 'Ochiq' : status === 'LOCKED' ? 'Yopiq' : 'Arxiv';
}

function dateTime(value?: string | null): string {
  return value ? new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
}
