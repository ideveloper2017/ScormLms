import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, ClipboardPlus, Plus, Send, Square, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { hasAuthority } from "@/lib/rbac-api";
import { closeSurvey, createSurvey, getSurveyResults, listAdminSurveys, publishSurvey, type SurveyAudience, type SurveyQuestionType } from "@/services/api/survey-api";

interface QuestionDraft { prompt: string; type: SurveyQuestionType; options: string }
const localDateTime = (offsetHours: number) => { const date = new Date(Date.now() + offsetHours * 3_600_000); date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); return date.toISOString().slice(0, 16); };

export function AdminSurveys() {
  const { user } = useAuth();
  const canWrite = hasAuthority(user, "ACADEMIC_WRITE");
  const { toast } = useToast();
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState<SurveyAudience>("BOTH");
  const [startsAt, setStartsAt] = useState(() => localDateTime(0));
  const [endsAt, setEndsAt] = useState(() => localDateTime(168));
  const [minAggregateSize, setMinAggregateSize] = useState(5);
  const [questions, setQuestions] = useState<QuestionDraft[]>([{ prompt: "", type: "RATING", options: "" }]);
  const [resultId, setResultId] = useState<number | null>(null);
  const surveys = useQuery({ queryKey: ["surveys", "admin"], queryFn: listAdminSurveys });
  const results = useQuery({ queryKey: ["surveys", "results", resultId], queryFn: () => getSurveyResults(resultId!), enabled: resultId != null });
  const refresh = () => client.invalidateQueries({ queryKey: ["surveys", "admin"] });
  const fail = (error: Error) => toast({ variant: "destructive", title: "Amal bajarilmadi", description: error.message });
  const create = useMutation({
    mutationFn: () => createSurvey({
      title: title.trim(), description: description.trim(), audience,
      startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), minAggregateSize,
      questions: questions.map((item) => ({ prompt: item.prompt.trim(), questionType: item.type, required: true, options: item.type === "SINGLE_CHOICE" ? item.options.split(/[,\n]/).map((value) => value.trim()).filter(Boolean) : [] })),
    }),
    onSuccess: async () => { setTitle(""); setDescription(""); setQuestions([{ prompt: "", type: "RATING", options: "" }]); await refresh(); toast({ title: "So'rov qoralamasi yaratildi" }); },
    onError: fail,
  });
  const action = useMutation({
    mutationFn: ({ id, kind }: { id: number; kind: "publish" | "close" }) => kind === "publish" ? publishSurvey(id) : closeSurvey(id),
    onSuccess: async () => { await refresh(); toast({ title: "So'rov holati yangilandi" }); }, onError: fail,
  });
  const updateQuestion = (index: number, patch: Partial<QuestionDraft>) => setQuestions((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));

  return <div className="space-y-6 p-3 sm:p-6">
    <div><h1 className="text-2xl font-bold">Anonim so'rovlar boshqaruvi</h1><p className="text-sm text-muted-foreground">Talaba va pedagog fikrlarini shaxssiz yig'ish, e'lon qilish va agregat tahlil.</p></div>
    {canWrite && <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardPlus className="h-5 w-5" />Yangi so'rov</CardTitle><CardDescription>Erkin matn savollari anonimlik xavfi sabab qo'llanmaydi.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Nomi</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} /></div><div className="space-y-2"><Label>Auditoriya</Label><Select value={audience} onValueChange={(value) => setAudience(value as SurveyAudience)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STUDENT">Talabalar</SelectItem><SelectItem value="TEACHER">Pedagoglar</SelectItem><SelectItem value="BOTH">Ikkalasi</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Boshlanish</Label><Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></div><div className="space-y-2"><Label>Tugash</Label><Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Tavsif</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} /></div><div className="space-y-2"><Label>Minimal agregat guruh</Label><Input type="number" min={5} max={100} value={minAggregateSize} onChange={(event) => setMinAggregateSize(Number(event.target.value))} /></div></div>
      <div className="space-y-3"><div className="flex items-center justify-between"><Label>Savollar</Label><Button size="sm" variant="outline" onClick={() => setQuestions((items) => [...items, { prompt: "", type: "RATING", options: "" }])}><Plus className="mr-1 h-3 w-3" />Savol</Button></div>{questions.map((question, index) => <div key={index} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_180px_auto]"><Input value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} placeholder={`${index + 1}-savol`} /><Select value={question.type} onValueChange={(value) => updateQuestion(index, { type: value as SurveyQuestionType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="RATING">1-5 reyting</SelectItem><SelectItem value="SINGLE_CHOICE">Bitta tanlov</SelectItem></SelectContent></Select><Button size="icon" variant="ghost" disabled={questions.length === 1} onClick={() => setQuestions((items) => items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>{question.type === "SINGLE_CHOICE" && <Input className="md:col-span-3" value={question.options} onChange={(event) => updateQuestion(index, { options: event.target.value })} placeholder="Variantlar vergul bilan: Juda yaxshi, Yaxshi, Qoniqarli" />}</div>)}</div>
      <Button disabled={!title.trim() || questions.some((item) => !item.prompt.trim()) || create.isPending} onClick={() => create.mutate()}><Plus className="mr-2 h-4 w-4" />Qoralama yaratish</Button>
    </CardContent></Card>}

    <div className="grid gap-4 lg:grid-cols-2">{(surveys.data ?? []).map((survey) => <Card key={survey.id}><CardHeader><div className="flex items-start justify-between"><div><CardTitle>{survey.title}</CardTitle><CardDescription>{survey.audience} · {survey.responseCount ?? 0} javob</CardDescription></div><Badge>{survey.status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm">{survey.description}</p><p className="text-xs text-muted-foreground">{new Date(survey.startsAt).toLocaleString("uz-Latn")} — {new Date(survey.endsAt).toLocaleString("uz-Latn")} · agregat minimum: {survey.minAggregateSize}</p><div className="flex flex-wrap gap-2">{canWrite && survey.status === "DRAFT" && <Button size="sm" onClick={() => action.mutate({ id: survey.id, kind: "publish" })}><Send className="mr-1 h-3 w-3" />E'lon qilish</Button>}{canWrite && survey.status === "PUBLISHED" && <Button size="sm" variant="outline" onClick={() => action.mutate({ id: survey.id, kind: "close" })}><Square className="mr-1 h-3 w-3" />Yopish</Button>}{survey.status === "CLOSED" && <Button size="sm" variant="outline" onClick={() => setResultId(survey.id)}><BarChart3 className="mr-1 h-3 w-3" />Natija</Button>}</div></CardContent></Card>)}</div>

    {resultId && <Card><CardHeader><CardTitle>{results.data?.title ?? "Agregat natija"}</CardTitle><CardDescription>{results.data ? `${results.data.responseCount} respondent · minimum ${results.data.minAggregateSize}` : "Yuklanmoqda..."}</CardDescription></CardHeader><CardContent className="space-y-4">{results.data?.suppressed ? <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">Respondentlar soni minimal guruhdan kam. Shaxsni bilvosita aniqlash xavfi sabab taqsimot ko'rsatilmaydi.</p> : results.data?.questions.map((question) => <div key={question.questionId} className="space-y-2 rounded-lg border p-4"><p className="font-medium">{question.prompt}</p>{question.questionType === "RATING" ? <><p className="text-2xl font-bold">{question.averageRating?.toFixed(2)} / 5</p>{Object.entries(question.ratingDistribution).map(([rating, count]) => <div key={rating} className="grid grid-cols-[35px_1fr_40px] items-center gap-2 text-xs"><span>{rating}</span><Progress value={question.answerCount ? count / question.answerCount * 100 : 0} /><span>{count}</span></div>)}</> : question.options.map((option) => <div key={option.option} className="space-y-1"><div className="flex justify-between text-xs"><span>{option.option}</span><span>{option.count} · {option.percentage.toFixed(1)}%</span></div><Progress value={option.percentage} /></div>)}</div>)}</CardContent></Card>}
  </div>;
}
