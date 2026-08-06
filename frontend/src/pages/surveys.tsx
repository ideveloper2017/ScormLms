import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { listAvailableSurveys, submitSurvey, type Survey } from "@/services/api/survey-api";

export function Surveys() {
  const { toast } = useToast();
  const client = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const surveys = useQuery({ queryKey: ["surveys", "available"], queryFn: listAvailableSurveys });
  const submit = useMutation({
    mutationFn: (survey: Survey) => {
      const missing = survey.questions.some((question) => question.required && !answers[`${survey.id}:${question.id}`]);
      if (missing) throw new Error("Barcha majburiy savollarga javob bering");
      return submitSurvey(survey.id, survey.questions.flatMap((question) => {
        const value = answers[`${survey.id}:${question.id}`];
        if (!value) return [];
        return [{ questionId: question.id, ...(question.questionType === "RATING" ? { ratingValue: Number(value) } : { optionValue: value }) }];
      }));
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["surveys", "available"] });
      toast({ title: "Anonim javob qabul qilindi" });
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Javob yuborilmadi", description: error.message }),
  });

  return <div className="space-y-6 p-3 sm:p-6">
    <div><div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"><ClipboardCheck className="h-4 w-4" />Sifat monitoringi</div><h1 className="text-2xl font-bold">Anonim so'rovlar</h1><p className="text-sm text-muted-foreground">Javobda ism, foydalanuvchi IDsi, IP yoki qurilma ma'lumoti saqlanmaydi.</p></div>
    <Card className="border-green-200"><CardContent className="flex gap-3 p-4 text-sm"><LockKeyhole className="h-5 w-5 shrink-0 text-green-600" /><p>Takroriy javobni cheklash uchun qaytarib ochib bo'lmaydigan maxfiy hash ishlatiladi. Natija kamida 5 respondent yig'ilib, so'rov yopilgandan keyingina agregat ko'rinishda ochiladi.</p></CardContent></Card>
    {surveys.isLoading ? <div className="flex justify-center p-10"><Spinner className="h-8 w-8" /></div> : surveys.error ? <p className="text-destructive">{(surveys.error as Error).message}</p> : (surveys.data ?? []).length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">Hozir faol so'rov yo'q.</CardContent></Card> : (surveys.data ?? []).map((survey) => <Card key={survey.id}>
      <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{survey.title}</CardTitle><CardDescription>{survey.description}</CardDescription></div>{survey.submitted && <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 h-3 w-3" />Yuborilgan</Badge>}</div><p className="text-xs text-muted-foreground">Muddat: {new Date(survey.endsAt).toLocaleString("uz-Latn")}</p></CardHeader>
      <CardContent className="space-y-5">{survey.questions.map((question) => <div key={question.id} className="space-y-2 rounded-lg border p-4"><Label>{question.position}. {question.prompt}{question.required && " *"}</Label><RadioGroup disabled={Boolean(survey.submitted)} value={answers[`${survey.id}:${question.id}`] ?? ""} onValueChange={(value) => setAnswers((old) => ({ ...old, [`${survey.id}:${question.id}`]: value }))} className="flex flex-wrap gap-3">{(question.questionType === "RATING" ? ["1", "2", "3", "4", "5"] : question.options).map((value) => <Label key={value} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 font-normal"><RadioGroupItem value={value} />{value}</Label>)}</RadioGroup></div>)}
        {!survey.submitted && <Button disabled={submit.isPending} onClick={() => submit.mutate(survey)}>{submit.isPending ? "Yuborilmoqda..." : "Anonim yuborish"}</Button>}
      </CardContent>
    </Card>)}
  </div>;
}
