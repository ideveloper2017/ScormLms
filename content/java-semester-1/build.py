"""Build an original, reproducible course package. No network or LMS writes."""
from pathlib import Path
from html import escape as e
import json
import zipfile
from lessons import WEEKS

ROOT = Path(__file__).resolve().parent
TITLE = 'Java dasturlash asoslari — 1-semestr'
SOURCES = json.loads((ROOT / 'video-sources.json').read_text(encoding='utf-8'))
AUTHOR = 'Codex yordamida tayyorlangan o‘quv material'
REQUIREMENTS = 'Kompyuterdan foydalanish, fayl/papka bilan ishlash va maktab arifmetikasi. Oldindan dasturlash tajribasi shart emas. JDK 21 va matn muharriri yoki Java IDE.'
OUTCOMES = ['Konsoldan kirish olib, shartlar va sikllar bilan masala yechish.',
    'Metodlar, massivlar va String bilan ma’lumotni qayta ishlash.',
    'Klass, inkapsulyatsiya, meros va interfeys bilan sodda model tuzish.',
    'List, Set, Map, istisnolar va UTF-8 fayllardan foydalanish.',
    'Chegara sinovlari yozish, xatoni topish va konsol loyihasini hujjatlashtirish.']

def p(text): return '<p>' + e(text) + '</p>'
def paragraphs(text): return ''.join(p(s) for s in text.split('\n\n'))
def ul(items): return '<ul>' + ''.join('<li>'+e(x)+'</li>' for x in items) + '</ul>'
def h(text, level=2): return f'<h{level}>'+e(text)+f'</h{level}>'
def pre(text): return '<pre><code>'+e(text)+'</code></pre>'
def text_item(title, body, minutes=20):
    return dict(title=title, contentType='TEXT', contentBody=body, durationMinutes=minutes,
        languageCode='uz', authorName=AUTHOR, contentVersion='1.0.0',
        sourceName='Java 1-semestr: original konspekt, kod va mashqlar', validFrom='2026-09-14')

RUBRIC = [('Talablar va asosiy algoritm',40), ('Chegara holatlari va validatsiya',20),
          ('Metodlar, nomlash va o‘qiladigan kod',15), ('Takrorlanadigan testlar',15), ('README va tushuntirish',10)]
PROJECT_RUBRIC = [('Asosiy foydalanish ssenariylari',30), ('Model va mas’uliyatlar ajratilishi',20),
                  ('Saqlash/yuklash va yaxlitlik',15), ('Validatsiya va xato xabarlari',10),
                  ('12 ta test va dalillar',15), ('README, chizma va himoya',10)]

EXAM = [
 ('int x=5; System.out.println(x/2 + x%2); natijasi?', ['3','2.5','2','4'], '3','5/2 = 2 va 5%2 = 1; yig‘indi 3.'),
 ('int sum=0; for(int i=2;i<=6;i+=2) sum+=i; sum nechaga teng?', ['12','6','8','14'], '12','2+4+6 = 12.'),
 ('static void f(int x){x=9;} int a=3; f(a); a nechaga teng?', ['3','9','0','Kompilyatsiya xatosi'], '3','Primitive argument qiymati nusxalanadi.'),
 ('int[] a={1,2}; int[] b=a; b[0]=7; a[0] nechaga teng?', ['7','1','2','0'], '7','Ikkala havola bitta massivga qaragan.'),
 ('"  Java  ".trim().length() natijasi?', ['4','8','6','0'], '4','Chetdagi bo‘shliqlarsiz Java to‘rt kod birlikdan iborat.'),
 ('Minimum uchun int min=0 qaysi kirishda xato natija beradi?', ['[4,8]','[-2,3]','[0,8]','[-9,0]'], '[4,8]','Musbat massivda 0 haqiqiy minimum emas.'),
 ('Klassdagi shaxsiy balance maydoni nega private bo‘lishi kerak?', ['O‘zgarishni qoidali metod orqali boshqarish','Kompilyator sonni oshirsin','Obyekt yaratilmasin','Har bir obyekt bitta qiymatga ega bo‘lsin'], 'O‘zgarishni qoidali metod orqali boshqarish','Holat invariantini himoyalash uchun.'),
 ('Base x=new Child(); x.label(); da Child labelni override qilgan. Qaysi instance metod ishlaydi?', ['Child.label','Base.label har doim','Konstruktor qayta ishlaydi','Hech biri'], 'Child.label','Dinamik dispatch obyektning amaldagi turiga qaraydi.'),
 ('ReportFormatterga yangi JsonFormatter qo‘shishda qaysi yechim mos?', ['Interfeysni amalga oshirish','Eski barcha klassni Stringga almashtirish','Har metodni static qilish','Barcha testni o‘chirish'], 'Interfeysni amalga oshirish','Hisobot kodi shartnomaga bog‘langan bo‘lsa yangi variant ulanadi.'),
 ('Mapda put("S1",70); put("S1",80); dan keyin size va get("S1")?', ['1 va 80','2 va 70','2 va 80','1 va 70'], '1 va 80','Takror kalit qiymati yangilanadi.'),
 ('List<Integer> a=new ArrayList<>(List.of(10,20,30)); a.remove(1); natija?', ['[10,30]','[20,30]','[10,20]','[10,20,30]'], '[10,30]','int argument indeks1ni bildiradi.'),
 ('Konsol EOF bo‘lganda qayta so‘rash sikli nima qilishi kerak?', ['Tushunarli tugashi','Cheksiz qayta so‘rashi','Barcha faylni o‘chirishi','Tasodifiy ball olishi'], 'Tushunarli tugashi','hasNextLine bilan kirish oqimi tugaganini aniqlash mumkin.'),
 ('Faylning 3-qatori buzilgan bo‘lsa yaxlit yuklash uchun nima kerak?', ['Avval vaqtinchalik ro‘yxatda to‘liq tekshirish','1-2 qatorni darhol asosiy holatga qo‘shish','Xatoni yutib yuborish','Qolganini taxmin qilish'], 'Avval vaqtinchalik ro‘yxatda to‘liq tekshirish','Muvaffaqiyatdan keyingina asosiy holat almashtiriladi.'),
 ('Kitobni ikkinchi marta berish rad etilganda yana nimani tekshirish kerak?', ['Avvalgi band holat saqlanganini','Fayl rangini','Internet tezligini','Barcha kitob o‘chganini'], 'Avvalgi band holat saqlanganini','Rad etilgan amal holatni buzmasligi kerak.'),
 ('Loyihani boshqa kompyuterda takrorlash uchun READMEda eng zarur ma’lumot?', ['JDK talabi va kompilyatsiya/ishga tushirish buyruqlari','Faqat muallif ismi','Faqat ekran rasmi','Faqat klasslar soni'], 'JDK talabi va kompilyatsiya/ishga tushirish buyruqlari','Takrorlanuvchan ishga tushirish tekshirish uchun zarur.'),
]

def build():
    (ROOT/'student'/'weeks').mkdir(parents=True,exist_ok=True)
    (ROOT/'student'/'examples').mkdir(parents=True,exist_ok=True)
    (ROOT/'instructor').mkdir(exist_ok=True)
    modules=[]; assignments=[]; questions=[]; quizzes=[]
    rows=''.join('<tr><td>'+str(w['week'])+'</td><td>'+e(w['title'])+'</td><td>2</td><td>2</td><td>8</td></tr>' for w in WEEKS)
    syllabus=h(TITLE,1)+p('Dasturiy injinering • Dasturlash Asoslari • 15 hafta • o‘zbek tili • JDK 21')
    syllabus+=p('Bu 1-semestr uchun tayyorlangan namunaviy fan dasturi. 6 kredit va 180 akademik soat taklif qilinadi: 30 soat nazariya, 30 soat laboratoriya, 120 soat mustaqil ish. Rasmiy tasdiqlangan o‘quv reja o‘rnini bosmaydi. Akademik soat davomiyligi muassasa qoidasi bo‘yicha olinadi; video davomiyligi bilan tenglashtirilmaydi.')
    syllabus+=h('Boshlang‘ich talablar')+p(REQUIREMENTS)+h('O‘quv natijalari')+ul(OUTCOMES)
    syllabus+=h('Haftalik o‘quv reja')+'<table><thead><tr><th>Hafta</th><th>Mavzu</th><th>Nazariya</th><th>Laboratoriya</th><th>Mustaqil</th></tr></thead><tbody>'+rows+'</tbody></table>'
    syllabus+=h('Har hafta qanday o‘qiyman?')+ul(['Nazariy konspektni o‘qing va kodni avval o‘zingiz taxmin qiling.', 'Videoni ko‘ring, to‘xtatib kichik tajribani takrorlang. Inglizcha videolar qo‘shimcha; mavzuning o‘zbekcha izohi konspektda berilgan.', 'Laboratoriya qadamlarini bajaring, keyin mustaqil topshiriqqa o‘ting.', 'O‘zini tekshirish testini ishlang. Natija past bo‘lsa xato mavzuni qayta o‘qing.', 'Kod, README va test dalillarini topshiriq orqali yuboring.'])
    syllabus+=h('Mustaqil ishning haftalik 8 soati')+ul(['2 soat: konspekt, video va qaydlar.', '3 soat: mustaqil topshiriqni yozish.', '2 soat: kodni sinash, xatolarni tuzatish va loyiha bosqichi.', '1 soat: test, refleksiya va README.'])
    syllabus+=h('Taklif etilgan baholash')+ul(['13 ta odatiy haftalik topshiriqning o‘rtachasi — 40%.', '8-hafta oraliq amaliy ish — 15%; oraliq test — 5%.', '15-hafta yakuniy loyiha — 30%; yakuniy test — 10%.', 'Haftalik 3 savolli testlar o‘zini tekshirish uchun; yakuniy bahoga alohida qo‘shilmaydi.', 'Misol: 80, 70, 90, 85, 80 natijalari bilan yakuniy ball = 80*0.40 + 70*0.15 + 90*0.05 + 85*0.30 + 80*0.10 = 80.5.'])
    syllabus+=h('Semestr va muddatlar')+p('Boshlanish sanasi namunada 2026-09-14. 15-hafta 2026-12-21 dan 2026-12-27 gacha. Haftalik topshiriqlar yakshanba 23:59 (Toshkent) uchun qoralama muddat bilan tayyorlanadi. Bayramlar, kech topshirish va qayta topshirish tartibi o‘qituvchi tomonidan dars boshlanishida aniqlashtiriladi.')
    syllabus+=h('Akademik halollik va yordam')+p('Birga muhokama qilish mumkin, lekin topshirilgan kodni o‘zingiz tushuntira olishingiz kerak. Ishlatilgan kod, video, AI yordam va maslahat manbalarini READMEda ko‘rsating. Qiyin joyda kichik takrorlanadigan misol va xato matni bilan savol bering. Namuna ism va ma’lumotlar yetarli.')
    syllabus+=h('Yakuniy loyiha bosqichlari')+ul(['9-hafta: Book modeli va invariantlar.', '10–11-hafta: mas’uliyatlar va interfeyslar.', '12-hafta: xotiradagi registr va menyu.', '14-hafta: saqlash va yuklash.', '15-hafta: test, hujjat, namoyish va himoya.'])
    syllabus+=h('Manbalar')+p('Asosiy konspektlar, kodlar va topshiriqlar ushbu kurs uchun original yozilgan. Qo‘shimcha rasmiy ma’lumot:')+''.join(p(url) for url in ['https://dev.java/learn/','https://dev.java/learn/language-basics/','https://dev.java/learn/classes-objects/','https://dev.java/learn/exceptions/','https://dev.java/learn/java-io/'])
    modules.append(dict(title='00. Kursni boshlash va o‘quv reja',description='O‘qish tartibi, syllabus, baholash, atamalar va yuklab olinadigan paket.',contents=[text_item('O‘quv reja va syllabus',syllabus,30)]))
    orientation=modules[0]['contents']
    orientation.append(text_item('Boshlash: JDK, papkalar va topshirish',h('Birinchi 30 daqiqa')+ul(['java -version va javac -version bilan JDK 21 ni tekshiring.', 'java-semester-1 papkasini oching. Har haftani alohida papkada saqlang.', 'Week01.java ni kompilyatsiya qilib ishga tushiring.', 'README.md ichiga ishga tushirish buyrug‘i, kirish formati va test natijalarini yozing.', 'Topshiriqni ZIP ko‘rinishida yuborish mumkin: .java, README.md, tests.md. .class, IDE kesh va maxfiy fayllarni yubormang.'])+pre('javac -encoding UTF-8 Week01.java\njava Week01')+h('Yordam so‘rash namunasi')+p('Mavzu: 6-hafta minimum. Kirish: [4,8]. Kutilgan: 4. Amaldagi: 0. Kod: eng kichik qayta ishlaydigan namuna. Men sinab ko‘rgan yechim: min boshlanishini tekshirdim.')))
    orientation.append(text_item('Baholash mezonlari va test hisoboti',h('Har bir odatiy ish — 100 ball')+ul([f'{name}: {score} ball' for name,score in RUBRIC])+p('Har mezonda to‘liq bajarilgan bo‘lsa to‘liq ball, asosiy qismi ishlasa yarim ball, bajarilmasa 0 ball. O‘qituvchi dalilga asoslangan oraliq ball va izoh berishi mumkin.')+h('Yakuniy loyiha — 100 ball')+ul([f'{name}: {score} ball' for name,score in PROJECT_RUBRIC])+h('Test hisoboti qolipi')+pre('ID | Kirish/harakat | Kutilgan natija | Amaldagi natija | O‘tdi/yiqildi\nT01 | ... | ... | ... | ...')+p('Skrinshotning o‘zi kod va ishga tushirish ko‘rsatmasi o‘rnini bosmaydi. Tekshiriladigan dalil va qisqa tushuntirish bo‘lsin.')))
    glossary=['JDK — Java dasturini yaratish va ishga tushirish vositalari to‘plami.', 'JVM — Java baytkodini bajaradigan virtual mashina.', 'Kompilyatsiya — manba kodni bajariladigan oraliq shaklga o‘girish.', 'Algoritm — masalani yechish qadamlari.', 'O‘zgaruvchi — nomlangan qiymat saqlash joyi.', 'Tur — qiymat va ruxsat etilgan amallar toifasi.', 'Shart — true yoki false bo‘ladigan tekshiruv.', 'Sikl — takror bajariladigan qadamlar.', 'Metod — nomlangan vazifa va uning kod bloki.', 'Parametr — metod qabul qiladigan qiymat.', 'Massiv — uzunligi belgilangan bir turdagi elementlar.', 'Indeks — elementning noldan boshlanadigan o‘rni.', 'String — o‘zgarmas matn obyekti.', 'Klass — obyekt tuzilishi va xulqi ta’rifi.', 'Obyekt — klass asosida yaratilgan aniq nusxa.', 'Konstruktor — obyekt boshlang‘ich holatini belgilovchi kod.', 'Inkapsulyatsiya — holatga kirish va o‘zgarishni qoidalar bilan boshqarish.', 'Invariant — har doim saqlanishi kerak bo‘lgan qoida.', 'Meros — ota klass xulqini kengaytirish.', 'Kompozitsiya — obyekt ichida boshqa obyekt saqlash.', 'Interfeys — xulq shartnomasi.', 'Polimorfizm — bir shartnoma orqali turli mos xulqlarni chaqirish.', 'List — tartibli, takrorlarga ruxsat beradigan ro‘yxat.', 'Set — takrorsiz to‘plam.', 'Map — kalit va qiymat bog‘lanishi.', 'Exception — xato yoki alohida holat signali.', 'UTF-8 — matn belgilarini baytlarga kodlash usuli.', 'Test case — kirish, kutilgan natija va tekshiruv.', 'Regression — avval ishlagan holatning o‘zgarishdan keyin buzilishi.', 'README — loyihani tushunish va ishga tushirish ko‘rsatmasi.']
    orientation.append(text_item('Java atamalari: qisqa lug‘at',h('30 ta asosiy atama')+ul(glossary),20))
    source_body=h('Videolar va qo‘shimcha o‘qish')+p('Videolar mualliflarning YouTube sahifalariga tashqi havolalar sifatida berilgan; video fayllari qayta joylanmagan. 2026-09-14 kuni sahifa metadata mavjudligi tekshirildi; ijro, subtitr va hududiy kirish to‘liq tekshirilmagan. Eski IDE ko‘rinishi videoda farq qilishi mumkin; kurs kodi JDK 21ga mos. Inglizcha videolar o‘zbekcha konspektga qo‘shimcha.')
    for s in SOURCES.values():
        assert 'error' not in s,s
        source_body+=p(f"{s['author']} — {s['title']} ({s['language']})")+'<p><a href="'+e(s['url'],quote=True)+'">Videoni ochish</a></p>'
    orientation.append(text_item('Video manbalari va foydalanish izohi',source_body,10))

    for w in WEEKS:
        n=w['week']; tag=f'{n:02d}'
        lecture=h(w['title'],1)+h('Dars oxirida')+ul(w['goals'])+h('Tushuntirish')+paragraphs(w['theory'])+h('Ishlaydigan namuna')+pre(w['code'])+h('Ishga tushirish')+pre(f'javac -encoding UTF-8 Week{tag}.java\njava Week{tag}')+h('Kutilgan chiqish')+pre(w['output'])+h('Ko‘p uchraydigan xatolar')+ul(w['mistakes'])
        lab=h('Laboratoriya: '+w['title'])+p('Natija: ishlaydigan .java fayllari va qisqa test hisoboti. Ajratilgan vaqt: 2 akademik soat.')+ul(w['lab'])+h('Bajarish tartibi')+ul(['10 daqiqa: masalani o‘qing, kirish va chiqishni yozing.', '20 daqiqa: namunani ishga tushiring va bir o‘zgarish kiriting.', '35 daqiqa: mashqlarni mustaqil bajaring.', '15 daqiqa: chegara testlarini tekshiring.', '10 daqiqa: natijani izohlang va fayllarni tayyorlang.'])+p('Ushbu 90 daqiqalik laboratoriya tartibi 45 daqiqalik akademik soat uchun namuna; muassasa jadvaliga moslashtiriladi.')+h('Video bilan ishlash')+p('Videodagi kodni to‘liq ko‘chirishdan oldin natijani taxmin qiling. Har 5–10 daqiqada pauza qiling, bir qiymatni o‘zgartirib natijani solishtiring. Quyidagi dars maqsadlariga mos uchta qayd yozing:')+ul(w['goals']+[w['mistakes'][0]])
        rubric=PROJECT_RUBRIC if n==15 else RUBRIC
        task=h('Mustaqil topshiriq')+p(w['task'])+h('Qabul mezonlari')+ul(w['cases'])+h('Topshirish')+p('Manba kod (.java), README.md va tests.md ni ZIPga joylang yoki LMS topshirig‘iga matn shaklida kiriting. READMEda ishga tushirish, kirish cheklovlari va foydalangan manbalarni yozing. Talabni o‘zgartirsangiz asosini tushuntiring.')+h('Baholash: 100 ball')+ul([f'{name}: {score} ball' for name,score in rubric])+h('O‘zini tekshirish')+p(f'LMSdagi “{tag}-hafta: o‘zini tekshirish” testini ishlang. Uch savolga javob berishdan oldin kodni ishga tushirmasdan fikrlab ko‘ring.')
        contents=[text_item(f'{tag}.1 Nazariya — '+w['title'],lecture,40)]
        links=[]
        for k,ref in enumerate(w['videos'],1):
            vid,_,timestamp=ref.partition('@');s=SOURCES[vid];url=s['url']+('&t='+timestamp+'s' if timestamp else '')
            subtitle=(' — inglizcha qo‘shimcha' if s['language']=='en' else ' — o‘zbekcha')
            desc='Mavzu: '+w['title']+'. '+('Videoning '+timestamp+'-sekundidan tegishli bo‘limni ko‘ring. ' if timestamp else '')+'Ko‘rgach nazariy darsdagi kod bilan taqqoslang.'
            if n==15:desc+=' Bu video OOP amaliyotini takrorlash uchun; mini kutubxonaning tayyor yechimi emas.'
            if n==14:desc+=' Videoda FileWriter; matnli darsda Files API ishlatiladi. Ikkalasining vazifasini taqqoslang.'
            contents.append(dict(title=f'{tag}.2.{k} Video{subtitle}: '+s['title'],description=desc,contentType='VIDEO',contentUrl=url,languageCode=s['language'],authorName=s['author'],contentVersion='source-2026-09-14',sourceName=s['title'],sourceUrl=s['url'],validFrom='2026-09-14'))
            links.append(f"- [{s['title']}]({url}) — {s['author']}, {s['language']}")
        contents.extend([text_item(f'{tag}.3 Laboratoriya',lab,90),text_item(f'{tag}.4 Topshiriq va qabul mezonlari',task,20)])
        for i,c in enumerate(contents):c['position']=i
        modules.append(dict(title=f'{tag}-hafta. '+w['title'],description=' • '.join(w['goals']),contents=contents))
        assignments.append(dict(week=n,title=f'{tag}-hafta: '+('Oraliq amaliy ish' if n==8 else 'Mini kutubxona — yakuniy loyiha' if n==15 else w['title']),description=w['task'],instructions=task,maxScore=100,priority='HIGH' if n in (8,15) else 'MEDIUM',submissionType='BOTH',status='DRAFT'))
        qkeys=[]
        for i,(q,options,answer,explain) in enumerate(w['questions'],1):
            key=f'W{tag}Q{i}';qkeys.append(key)
            questions.append(dict(key=key,text=f'[{key}] '+q,type='SINGLE_CHOICE',difficulty='EASY' if n<9 else 'MEDIUM',points=1,options=options,correctAnswer=answer,explanation=explain))
        quizzes.append(dict(title=f'{tag}-hafta: o‘zini tekshirish',week=n,questionKeys=qkeys,durationMinutes=10,allowedAttempts=3,passingPercentage=67,instructions='Mustaqil ishlang. Bu mashq testi; noto‘g‘ri javobdan keyin tegishli konspektni qayta o‘qing.',status='DRAFT',showResult=True,shuffleQuestions=True,proctoring=False,proctorIds=[]))
        md=f"# {tag}-hafta. {w['title']}\n\n## Maqsadlar\n"+'\n'.join('- '+x for x in w['goals'])+'\n\n'+w['theory']+'\n\n## Kod\n```java\n'+w['code']+'\n```\n\nKutilgan chiqish:\n```text\n'+w['output']+'\n```\n\n## Videolar\n'+'\n'.join(links)+'\n\n## Laboratoriya\n'+'\n'.join(f'{i}. {x}' for i,x in enumerate(w['lab'],1))+'\n\n## Topshiriq\n'+w['task']+'\n\n### Qabul mezonlari\n'+'\n'.join('- '+x for x in w['cases'])+'\n\n### Baholash\n'+'\n'.join(f'- {name}: {score} ball' for name,score in rubric)+'\n\n## O‘zini tekshirish\n'+'\n'.join(f'{i}. {q}\n   '+' / '.join(opts) for i,(q,opts,_,__) in enumerate(w['questions'],1))+'\n'
        (ROOT/'student'/'weeks'/f'{tag}.md').write_text(md,encoding='utf-8')
        (ROOT/'student'/'examples'/f'Week{tag}.java').write_text(w['code']+'\n',encoding='utf-8')

    examkeys=[]
    for i,(q,options,answer,explain) in enumerate(EXAM,1):
        key=f'F{i:02d}';examkeys.append(key)
        questions.append(dict(key=key,text=f'[{key}] '+q,type='SINGLE_CHOICE',difficulty='MEDIUM',points=1,options=options,correctAnswer=answer,explanation=explain))
    for name,week,keys,duration in [('Oraliq nazorat — 1–8-haftalar',8,[q['key'] for q in questions if q['key'].startswith('W')][:24],35),('Yakuniy nazorat — Java 1-semestr',15,examkeys,30)]:
        quizzes.append(dict(title=name,week=week,questionKeys=keys,durationMinutes=duration,allowedAttempts=1,passingPercentage=60,instructions='Bitta javobni belgilang. Kodli savollarda natijani o‘zingiz hisoblang. Barcha savollar teng ball. Oraliq test 24, yakuniy test 15 savol.',status='DRAFT',showResult=True,shuffleQuestions=True,proctoring=False,proctorIds=[]))
    package=dict(schemaVersion=1,title=TITLE,programName='Dasturiy injinering',subjectName='Dasturlash Asoslari',startDate='2026-09-14',weeks=15,requirements=REQUIREMENTS,outcomes=OUTCOMES,syllabusHtml=syllabus,modules=modules,assignments=assignments,questions=questions,quizzes=quizzes)
    (ROOT/'course.json').write_text(json.dumps(package,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'student'/'syllabus.html').write_text('<!doctype html><html lang="uz"><meta charset="utf-8"><title>'+e(TITLE)+'</title><body>'+syllabus+'</body></html>',encoding='utf-8')
    (ROOT/'student'/'README.md').write_text('# Java — 1-semestr talaba paketi\n\n15 haftalik o‘zbekcha konspekt, laboratoriya, topshiriq va Java 21 misollari.\n\n1. syllabus.html ni oching.\n2. weeks/01.md dan ketma-ket o‘qing.\n3. examples papkasida `javac -encoding UTF-8 Week01.java` va `java Week01` bajaring.\n4. Topshiriqlarning o‘z yechimingizni alohida papkada yozing.\n\nVideolar tashqi havolalar; internet talab qiladi. Inglizcha qo‘shimchalar belgilangan. Video fayllari paketga kiritilmagan.\n\nBarcha material qoralama fan dasturi uchun tayyorlangan.\n',encoding='utf-8')
    (ROOT/'instructor'/'answer-key.md').write_text('# O‘qituvchi uchun javoblar kaliti\n\nTalaba paketiga qo‘shilmaydi.\n\n'+'\n\n'.join(f"## {q['key']}\n{q['text']}\n\nJavob: {q['correctAnswer']}\n\nIzoh: {q['explanation']}" for q in questions),encoding='utf-8')
    with zipfile.ZipFile(ROOT/'student-package.zip','w',zipfile.ZIP_DEFLATED) as archive:
        for f in sorted((ROOT/'student').rglob('*')):
            if f.is_file():archive.write(f,f.relative_to(ROOT/'student'))
    print(json.dumps(dict(modules=len(modules),textLessons=sum(c['contentType']=='TEXT' for m in modules for c in m['contents']),videoLessons=sum(c['contentType']=='VIDEO' for m in modules for c in m['contents']),assignments=len(assignments),questions=len(questions),quizzes=len(quizzes),examples=len(WEEKS))))
    return package

if __name__=='__main__': build()
