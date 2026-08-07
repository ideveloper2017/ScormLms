import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Check, CheckCheck, EyeOff, Loader2, MessageCircle, Plus, Reply, Search, Send, Settings, UserRound, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { chatApi, type ChatContact, type ChatConversation, type ChatMessage } from '@/services/api/chat-api';

export function Communication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatType, setNewChatType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [directUserId, setDirectUserId] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<Set<number>>(new Set());
  const [manageOpen, setManageOpen] = useState(false);
  const [addMemberId, setAddMemberId] = useState('');
  const [hidingMessage, setHidingMessage] = useState<ChatMessage | null>(null);
  const [hideReason, setHideReason] = useState('');
  const readThroughRef = useRef<number | null>(null);

  const conversationsKey = ['chat', 'conversations'];
  const messagesKey = ['chat', 'messages', selectedId];
  const conversationsQuery = useQuery({
    queryKey: conversationsKey,
    queryFn: chatApi.conversations,
    refetchInterval: 5000,
  });
  const contactsQuery = useQuery({ queryKey: ['chat', 'contacts'], queryFn: () => chatApi.contacts() });
  const messagesQuery = useQuery({
    queryKey: messagesKey,
    queryFn: () => chatApi.messages(selectedId!),
    enabled: selectedId !== null,
    refetchInterval: selectedId === null ? false : 5000,
  });
  const selected = conversationsQuery.data?.find(item => item.id === selectedId) ?? messagesQuery.data?.conversation;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: conversationsKey });
    if (selectedId !== null) await queryClient.invalidateQueries({ queryKey: messagesKey });
  };
  const fail = (title: string) => (cause: Error) => toast({ variant: 'destructive', title, description: cause.message });
  const createDirectMutation = useMutation({
    mutationFn: () => chatApi.createDirect(Number(directUserId)),
    onSuccess: async chat => { resetNewChat(); setSelectedId(chat.id); await refresh(); toast({ title: 'Shaxsiy chat ochildi' }); },
    onError: fail("Shaxsiy chat ochilmadi"),
  });
  const createGroupMutation = useMutation({
    mutationFn: () => chatApi.createGroup(groupTitle.trim(), [...groupMemberIds]),
    onSuccess: async chat => { resetNewChat(); setSelectedId(chat.id); await refresh(); toast({ title: 'Guruh chat yaratildi' }); },
    onError: fail("Guruh chat yaratilmadi"),
  });
  const sendMutation = useMutation({
    mutationFn: () => chatApi.send(selectedId!, composer.trim(), replyTo?.id),
    onSuccess: async () => { setComposer(''); setReplyTo(null); await refresh(); },
    onError: fail("Xabar yuborilmadi"),
  });
  const readMutation = useMutation({
    mutationFn: (messageId: number) => chatApi.markRead(selectedId!, messageId),
    onSuccess: refresh,
    onError: fail("O'qilganlik holati saqlanmadi"),
  });
  const hideMutation = useMutation({
    mutationFn: () => chatApi.hide(selectedId!, hidingMessage!.id, hideReason.trim()),
    onSuccess: async () => { setHidingMessage(null); setHideReason(''); await refresh(); toast({ title: 'Xabar yashirildi' }); },
    onError: fail("Xabar yashirilmadi"),
  });
  const updateMembersMutation = useMutation({
    mutationFn: ({ add, remove }: { add: number[]; remove: number[] }) => chatApi.updateMembers(selectedId!, add, remove),
    onSuccess: async () => { setAddMemberId(''); await refresh(); toast({ title: "Guruh a'zolari yangilandi" }); },
    onError: fail("Guruh a'zolari yangilanmadi"),
  });
  const archiveMutation = useMutation({
    mutationFn: () => chatApi.archive(selectedId!),
    onSuccess: async () => { setManageOpen(false); await refresh(); toast({ title: 'Chat arxivlandi' }); },
    onError: fail("Chat arxivlanmadi"),
  });

  useEffect(() => {
    const messages = messagesQuery.data?.messages;
    const last = messages?.[messages.length - 1];
    if (!selectedId || !last || !selected?.unreadCount || readMutation.isPending || readThroughRef.current === last.id) return;
    readThroughRef.current = last.id;
    readMutation.mutate(last.id);
  }, [messagesQuery.data?.messages, readMutation.isPending, selected?.unreadCount, selectedId]);

  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (conversationsQuery.data ?? []).filter(item => !q || item.title.toLowerCase().includes(q));
  }, [conversationsQuery.data, search]);
  const contacts = contactsQuery.data ?? [];
  const availableMembers = contacts.filter(contact => !selected?.members.some(member => member.userId === contact.userId));

  function resetNewChat() {
    setNewChatOpen(false); setDirectUserId(''); setGroupTitle(''); setGroupMemberIds(new Set()); setNewChatType('DIRECT');
  }

  function toggleGroupMember(userId: number) {
    setGroupMemberIds(current => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  }

  function send() {
    if (composer.trim()) sendMutation.mutate();
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6" />Xabarlar</h1><p className="text-sm text-muted-foreground">Kurs aloqalariga asoslangan shaxsiy va guruh chatlari</p></div>
        <Button className="gap-2" onClick={() => setNewChatOpen(true)}><Plus className="h-4 w-4" />Yangi chat</Button>
      </div>

      <div className="grid min-h-[650px] gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3"><CardTitle className="text-base">Suhbatlar</CardTitle><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Chatni qidiring" /></div></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[565px]">
              {conversationsQuery.isLoading && <Loading text="Chatlar yuklanmoqda..." />}
              {conversationsQuery.error && <ErrorText text={conversationsQuery.error.message} />}
              {!conversationsQuery.isLoading && visibleConversations.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Hozircha chat yo'q.</div>}
              <div className="divide-y">{visibleConversations.map(chat => <button key={chat.id} type="button" className={`w-full p-4 text-left hover:bg-muted/50 ${selectedId === chat.id ? 'bg-muted' : ''}`} onClick={() => { readThroughRef.current = null; setSelectedId(chat.id); }}><div className="flex items-start gap-3"><div className="rounded-full bg-primary/10 p-2">{chat.type === 'GROUP' ? <Users className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{chat.title}</strong>{chat.unreadCount > 0 && <Badge>{chat.unreadCount}</Badge>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{chat.lastMessage ?? "Xabar yo'q"}</p><p className="mt-1 text-xs text-muted-foreground">{dateTime(chat.lastMessageAt)} · {chat.members.length} a'zo</p></div></div></button>)}</div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          {!selectedId ? <div className="flex h-[650px] items-center justify-center text-center text-muted-foreground"><div><MessageCircle className="mx-auto mb-3 h-12 w-12" /><p>Chatni tanlang yoki yangi chat oching.</p></div></div> : messagesQuery.isLoading ? <Loading text="Xabarlar yuklanmoqda..." /> : messagesQuery.error ? <ErrorText text={messagesQuery.error.message} /> : <>
            <CardHeader className="border-b pb-4"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">{messagesQuery.data!.conversation.title}</CardTitle><CardDescription>{messagesQuery.data!.conversation.type === 'GROUP' ? `${messagesQuery.data!.conversation.members.length} a'zoli guruh` : 'Shaxsiy chat'} · {messagesQuery.data!.conversation.status === 'ACTIVE' ? 'faol' : 'arxivlangan'}</CardDescription></div>{messagesQuery.data!.conversation.canManage && <Button variant="outline" size="sm" className="gap-2" onClick={() => setManageOpen(true)}><Settings className="h-4 w-4" />Boshqarish</Button>}</div></CardHeader>
            <CardContent className="flex h-[565px] flex-col p-0">
              <ScrollArea className="flex-1 px-4 py-3">
                {messagesQuery.data!.messages.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">Birinchi xabarni yuboring.</div>}
                <div className="space-y-3">{messagesQuery.data!.messages.map(message => <div key={message.id} className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-lg border px-3 py-2 sm:max-w-[70%] ${message.mine ? 'bg-primary text-primary-foreground' : 'bg-muted/40'}`}><div className="flex items-center justify-between gap-3"><strong className="text-xs">{message.mine ? 'Men' : message.senderName}</strong><span className="text-[11px] opacity-70">{dateTime(message.sentAt)}</span></div>{message.replyToId && <p className="mt-1 border-l-2 pl-2 text-xs opacity-70">{message.replyToSenderName ?? `#${message.replyToId}`} ga javob</p>}{message.hidden ? <p className="mt-2 text-sm italic opacity-70"><EyeOff className="mr-1 inline h-3 w-3" />Xabar yashirilgan: {message.hiddenReason}</p> : <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>}<div className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">{message.mine && (message.readCount === message.recipientCount && message.recipientCount > 0 ? <><CheckCheck className="h-3 w-3" />{message.readCount}/{message.recipientCount} o'qildi</> : <><Check className="h-3 w-3" />{message.deliveredCount}/{message.recipientCount} yetkazildi</>)}{!message.hidden && <button className="ml-2 underline" onClick={() => setReplyTo(message)}><Reply className="inline h-3 w-3" /> javob</button>}{message.canHide && <button className="ml-2 underline" onClick={() => setHidingMessage(message)}>yashirish</button>}</div>{hidingMessage?.id === message.id && <div className="mt-2 space-y-2 rounded border bg-background p-2 text-foreground"><Input value={hideReason} onChange={event => setHideReason(event.target.value)} placeholder="Yashirish sababi" /><div className="flex gap-2"><Button size="sm" variant="destructive" disabled={hideReason.trim().length < 5 || hideMutation.isPending} onClick={() => hideMutation.mutate()}>Tasdiqlash</Button><Button size="sm" variant="ghost" onClick={() => setHidingMessage(null)}>Bekor qilish</Button></div></div>}</div></div>)}</div>
              </ScrollArea>
              <div className="border-t p-3">{messagesQuery.data!.canSend ? <div className="space-y-2">{replyTo && <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs"><span>{replyTo.senderName} ga javob</span><button className="underline" onClick={() => setReplyTo(null)}>bekor qilish</button></div>}<div className="flex gap-2"><Textarea value={composer} onChange={event => setComposer(event.target.value)} rows={2} placeholder="Xabar yozing..." onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} /><Button size="icon" className="h-auto" disabled={!composer.trim() || sendMutation.isPending} onClick={send}><Send className="h-4 w-4" /></Button></div></div> : <p className="py-3 text-center text-sm text-muted-foreground">Arxivlangan chatga yangi xabar yuborilmaydi.</p>}</div>
            </CardContent>
          </>}
        </Card>
      </div>

      <Dialog open={newChatOpen} onOpenChange={open => { if (!open) resetNewChat(); else setNewChatOpen(true); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Yangi chat</DialogTitle><DialogDescription>Faqat umumiy kurs aloqasi mavjud faol foydalanuvchilar tanlanadi.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-1"><Label>Chat turi</Label><Select value={newChatType} onValueChange={value => setNewChatType(value as 'DIRECT' | 'GROUP')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DIRECT">Shaxsiy chat</SelectItem><SelectItem value="GROUP">Guruh chat</SelectItem></SelectContent></Select></div>{contactsQuery.isLoading ? <Loading text="Kontaktlar yuklanmoqda..." /> : contacts.length === 0 ? <p className="rounded border p-4 text-sm text-muted-foreground">Chat uchun kurs aloqasidagi kontakt topilmadi.</p> : newChatType === 'DIRECT' ? <div className="space-y-1"><Label>Kontakt</Label><Select value={directUserId} onValueChange={setDirectUserId}><SelectTrigger><SelectValue placeholder="Kontaktni tanlang" /></SelectTrigger><SelectContent>{contacts.map(contact => <SelectItem key={contact.userId} value={String(contact.userId)}>{contact.fullName} · {contact.roleName ?? contact.username}</SelectItem>)}</SelectContent></Select></div> : <><div className="space-y-1"><Label>Guruh nomi</Label><Input value={groupTitle} onChange={event => setGroupTitle(event.target.value)} maxLength={200} /></div><div className="space-y-2"><Label>A'zolar — kamida 2 ta</Label><ScrollArea className="h-52 rounded border"><div className="divide-y">{contacts.map(contact => <label key={contact.userId} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/40"><input type="checkbox" checked={groupMemberIds.has(contact.userId)} onChange={() => toggleGroupMember(contact.userId)} /><span className="text-sm"><strong>{contact.fullName}</strong><br /><span className="text-muted-foreground">{contact.roleName ?? contact.username}</span></span></label>)}</div></ScrollArea></div></>}<Button className="w-full" disabled={newChatType === 'DIRECT' ? !directUserId || createDirectMutation.isPending : groupTitle.trim().length < 3 || groupMemberIds.size < 2 || createGroupMutation.isPending} onClick={() => newChatType === 'DIRECT' ? createDirectMutation.mutate() : createGroupMutation.mutate()}>{newChatType === 'DIRECT' ? 'Chatni ochish' : 'Guruh yaratish'}</Button></div></DialogContent></Dialog>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}><DialogContent><DialogHeader><DialogTitle>Guruhni boshqarish</DialogTitle><DialogDescription>A'zolar o'zgarishi auditda saqlanadi; chiqarilgan a'zo keyingi xabarlarga kira olmaydi.</DialogDescription></DialogHeader>{selected && <div className="space-y-4"><div className="space-y-2"><Label>Joriy a'zolar</Label>{selected.members.map(member => <div key={member.userId} className="flex items-center justify-between rounded border p-2"><span className="text-sm">{member.fullName} <Badge variant="outline">{member.role}</Badge></span>{member.role !== 'OWNER' && <Button size="sm" variant="ghost" className="text-destructive" disabled={updateMembersMutation.isPending} onClick={() => updateMembersMutation.mutate({ add: [], remove: [member.userId] })}>Chiqarish</Button>}</div>)}</div>{availableMembers.length > 0 && <div className="flex gap-2"><Select value={addMemberId} onValueChange={setAddMemberId}><SelectTrigger><SelectValue placeholder="Yangi a'zo" /></SelectTrigger><SelectContent>{availableMembers.map(contact => <SelectItem key={contact.userId} value={String(contact.userId)}>{contact.fullName}</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={!addMemberId || updateMembersMutation.isPending} onClick={() => updateMembersMutation.mutate({ add: [Number(addMemberId)], remove: [] })}>Qo'shish</Button></div>}<Button variant="destructive" className="w-full gap-2" disabled={selected.status === 'ARCHIVED' || archiveMutation.isPending} onClick={() => archiveMutation.mutate()}><Archive className="h-4 w-4" />Chatni arxivlash</Button></div>}</DialogContent></Dialog>
    </div>
  );
}

function Loading({ text }: { text: string }) {
  return <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{text}</div>;
}

function ErrorText({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-destructive">{text}</div>;
}

function dateTime(value?: string | null): string {
  return value ? new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
}
