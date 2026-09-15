"""Original Uzbek Java 21 teaching material; build.py exports it for the LMS."""

WEEKS = []

def lesson(title, goals, theory, code, output, lab, task, cases, mistakes, questions, videos):
    WEEKS.append(dict(week=len(WEEKS)+1, title=title, goals=goals, theory=theory.strip(),
        code=code.strip(), output=output, lab=lab, task=task, cases=cases,
        mistakes=mistakes, questions=questions, videos=videos))

lesson('Java muhiti va birinchi dastur',
 ['JDK, kompilyator va JVM vazifalarini ajratish', 'Terminaldan Java dasturini ishga tushirish'],
 '''Dasturiy injinering muammoni tushunishdan boshlanadi. Avval dastur kimga kerakligi, qanday ma’lumot olishi va qanday natija berishini yozamiz. Keyin algoritm tuzamiz, kod yozamiz va natijani tekshiramiz. Bu semestrda har bir mashqda shu ketma-ketlikni qo‘llaymiz.

Java dasturi .java faylda saqlanadi. JDK tarkibidagi javac uni JVM bajaradigan baytkodga aylantiradi. Java buyrug‘i JVMni ishga tushiradi. Kompilyatsiya muvaffaqiyatli bo‘lishi natija to‘g‘riligini kafolatlamaydi: ekranga noto‘g‘ri son chiqaradigan dastur ham kompilyatsiyadan o‘tishi mumkin.

Kurs misollari JDK 21 bilan tekshiriladi. Terminalda java -version va javac -version buyruqlarini bajaring. Ikkalasi ham topilishi kerak. IDEda Project SDK sifatida JDK 21 ni tanlang. IntelliJ IDEA yoki boshqa Java muhiti ishlatilishi mumkin; misollar maxsus IDEga bog‘liq emas. Dastur kirish nuqtasi public static void main(String[] args). Hozircha bu yozuvni o‘zgartirmang, metod va klasslarni keyin batafsil ko‘ramiz.

Quyidagi kodni Week01.java nomida UTF-8 bilan saqlang. Public klass nomi fayl nomi bilan mos. Terminalni shu papkada ochib javac -encoding UTF-8 Week01.java, so‘ng java Week01 bajaring. println yangi qatorga o‘tadi. Matn qo‘shtirnoq ichida yoziladi; buyruq nuqtali vergul bilan tugaydi. Xato bo‘lsa avval kompilyator ko‘rsatgan birinchi qatorni tuzating. READMEga ishga tushirish buyrug‘ini yozish boshqa odamga dasturingizni takrorlash imkonini beradi.''',
 '''public class Week01 {
    public static void main(String[] args) {
        System.out.println("Salom, Java!");
        System.out.println("Dasturiy injinering | 1-semestr");
    }
}''', 'Salom, Java!\nDasturiy injinering | 1-semestr',
 ['JDK versiyasini tekshiring va java/javac farqini ikki jumlada yozing.', 'Namunani terminalda kompilyatsiya qiling; matnga o‘z faningizni kiriting.', 'Ataylab bitta nuqtali vergulni olib tashlang, xato matnini o‘qing va tiklang.'],
 'StudentCard.java yarating: uch qatorda talaba ismi, guruh kodi va semestrni chiqarsin. READMEda kirish ma’lumoti yo‘qligini va ishga tushirish buyruqlarini yozing. Shaxsiy ma’lumot o‘rniga namuna ism ishlatish mumkin.',
 ['Chiqish aynan uch qator; har qatorda qiymat bor.', 'Fayl va public klass nomi StudentCard.', 'Yangi papkada faqat manba fayli yordamida kompilyatsiya bo‘ladi.'],
 ['Java va JavaScript boshqa tillar.', 'java buyrug‘iga klass nomini .class qo‘shimchasiz bering.', 'IDE ishlasa ham terminaldagi Java versiyasini tekshiring.'],
 [('Java manbasini kompilyatsiya qiladigan buyruq?', ['javac', 'java', 'cd', 'git'], 'javac', 'javac .java manbadan .class baytkod yaratadi.'), ('Dastur boshlanadigan metod nomi?', ['main', 'start', 'runAll', 'print'], 'main', 'Bu kursdagi an’anaviy Java dasturi main metodidan boshlanadi.'), ('public class Book qaysi faylda bo‘ladi?', ['Book.java', 'book.txt', 'Main.class', 'Book.js'], 'Book.java', 'Public klass va fayl nomi mos keladi.')],
 ['TM8Cgik_qVo','OQqmpjZPiAg'])

lesson('O‘zgaruvchilar, operatorlar va konsoldan kiritish',
 ['Masalaga mos ma’lumot turini tanlash', 'Scanner orqali son o‘qish va formula hisoblash'],
 '''O‘zgaruvchi nom, tur va qiymatga ega. int butun son, long kattaroq butun son, double kasr son, boolean true yoki false, char bitta UTF-16 kod birligini saqlaydi. String matn uchun ishlatiladi. Nomni vazifaga qarab tanlang: a o‘rniga totalMinutes o‘qishga osonroq. Lokal o‘zgaruvchini o‘qishdan oldin qiymat bering.

Arifmetikada tur muhim: 7 / 2 natijasi 3, chunki ikkala operand butun. 7 / 2.0 esa 3.5. Qoldiq operatori % bilan 135 daqiqani 2 soat 15 daqiqaga ajratamiz. Hisoblashdan keyin doublega o‘tkazish yo‘qolgan kasrni tiklamaydi. Qavslar formulani aniq qiladi. final qiymatni qayta tayinlashni cheklaydi; o‘zgarmas koeffitsient uchun ishlating.

Scanner konsoldan ma’lumot oladi. nextInt butun tokenni o‘qiydi; foydalanuvchi harf kiritsa xato chiqishi mumkin. Hozir topshiriqda son kiritish shartini aniq belgilaymiz, 13-haftada xatolarni boshqaramiz. nextInt ortidan nextLine chaqirilganda qator oxiri qolgan bo‘lishi mumkin; butun qatorni nextLine orqali o‘qib keyin parse qilish ham bir yechim.

Quyidagi misolda Scanner konsol o‘rniga belgilangan 135 matnidan o‘qiydi, shuning uchun natijani avtomatik tekshirish mumkin. Laboratoriyada uni new Scanner(System.in) bilan almashtiring. Qo‘shishdagi + matn operand bilan birikishni bildiradi. Pulga oid aniq hisoblar uchun double har doim mos emas; bu bosqichda daqiqa, dona va butun birliklardan foydalanamiz.''',
 '''import java.util.Scanner;
public class Week02 {
    public static void main(String[] args) {
        Scanner input = new Scanner("135");
        int totalMinutes = input.nextInt();
        System.out.println(totalMinutes / 60 + " soat " + totalMinutes % 60 + " daqiqa");
        System.out.println(7 / 2.0);
    }
}''', '2 soat 15 daqiqa\n3.5',
 ['Scanner manbasini System.in qiling va 0, 60, 135 kiriting.', '7 / 2 va 7 / 2.0 natijalarini izohlang.', 'Selsiydan Farengeytga o‘tkazuvchi formula yozing: F = C * 9.0 / 5 + 32.'],
 'TimeConverter.java: 0..86400 oralig‘idagi butun son sekundni soat, daqiqa va sekundga ajrating. Chiqish h:m:s ko‘rinishida; nol bilan to‘ldirish shart emas. Ushbu haftada kirish to‘g‘ri son deb olinadi.',
 ['0 → 0:0:0', '3661 → 1:1:1', '86400 → 24:0:0'],
 ['int / int kasr qismini tashlaydi.', 'O‘zgaruvchini e’lon qilish unga avtomatik lokal qiymat bermaydi.', 'Ko‘paytirish natijasi int chegarasidan oshishi mumkin.'],
 [('9 / 2 natijasi?', ['4','4.5','5','0'], '4','Ikkala operand int bo‘lgani uchun butun bo‘lish bajariladi.'), ('17 % 5 natijasi?', ['2','3','5','17'], '2','17 = 3 * 5 + 2.'), ('Mantiqiy qiymat turi?', ['boolean','String','double','char'], 'boolean','boolean faqat true yoki false oladi.')],
 ['rCCLyHR5P1I','4sedhBrnYUs'])

lesson('Shartlar va chegaraviy qiymatlar',
 ['if/else orqali qaror yozish', 'Chegara holatlarini test qilish'],
 '''Shart operatori dastur yo‘lini tanlaydi. if ichidagi ifoda boolean bo‘lishi kerak. else if bir nechta tartibli holat uchun, else qolgan holatlar uchun xizmat qiladi. Ballni bahoga aylantirishda avval 0..100 diapazonini tekshiramiz; keyin yuqoridan pastga chegara qo‘yamiz. Aks holda 105 ham eng yuqori bahoga tushib qoladi.

== tenglikni, != teng emaslikni, >= va <= chegarani ham qamrab olishni bildiradi. && ikkala shart rost bo‘lishini, || kamida bittasi rost bo‘lishini talab qiladi. && va || qisqa tutashuv qiladi: natija ma’lum bo‘lsa o‘ng ifoda baholanmaydi. Masalan, divisor != 0 && total / divisor > 3 bo‘lishdan oldin nolni tekshiradi.

Shartlar jadvalini avval qog‘ozga yozing. Bizning mashq: 0..59 qayta ishlash, 60..79 qoniqarli, 80..100 yaxshi. Bu o‘quv misolidagi chegaralar, universitetning rasmiy baholash shkalasi emas. 59, 60, 79, 80, -1 va 101 sinovlari oddiy 75 sinovidan ko‘proq xato topishi mumkin.

Bir qiymatga qarab menyu tanlashda switch qulay. An’anaviy case bloklarida break unutish keyingi blokka o‘tishga olib kelishi mumkin. Boshlanishida oddiy if/else bilan to‘g‘ri yechim tuzing, keyin menyuni switch bilan qayta yozing. Matnlarni == bilan solishtirmang; mazmun uchun equals ishlatiladi. Bu farqni 7-haftada mashq qilamiz.''',
 '''public class Week03 {
    public static void main(String[] args) {
        int score = 80;
        if (score < 0 || score > 100) System.out.println("Noto'g'ri ball");
        else if (score >= 80) System.out.println("Yaxshi");
        else if (score >= 60) System.out.println("Qoniqarli");
        else System.out.println("Qayta ishlash");
    }
}''', 'Yaxshi',
 ['Namunadagi score qiymatini chegara qiymatlariga almashtiring.', 'Musbat/manfiy/nol aniqlagich yarating.', '1, 2, 0 buyruqlarini taniydigan menyu yozing; qolganida “Noma’lum buyruq”.'],
 'Ticket.java: yosh 0..120 oralig‘ida. 0..6 uchun “Bepul”, 7..17 uchun “Bolalar”, 18..59 uchun “Oddiy”, 60..120 uchun “Imtiyozli”, boshqa qiymat uchun “Noto‘g‘ri yosh” chiqaring.',
 ['6 → Bepul; 7 → Bolalar', '17 → Bolalar; 18 → Oddiy', '59 → Oddiy; 60 → Imtiyozli', '-1 va 121 → Noto‘g‘ri yosh'],
 ['= qiymat beradi, == solishtiradi.', 'if dan keyingi ortiqcha ; bo‘sh shart tanasini yaratadi.', 'Keng shartni boshiga qo‘yish tor shartga yetib bormaslikka olib keladi.'],
 [('Ikkala shart rost bo‘lishi uchun qaysi operator?', ['&&','||','!','='], '&&','Mantiqiy AND ikkala operand rost bo‘lganda rost.'), ('x=60 bo‘lsa x >= 60 natijasi?', ['true','false','60','Xato'], 'true','Tenglik ham chegaraga kiradi.'), ('0..100 diapazonidan tashqarini tekshirish?', ['x < 0 || x > 100','x < 0 && x > 100','x == 0','x > 0'], 'x < 0 || x > 100','Pastki yoki yuqori chegaradan chiqish kifoya.')],
 ['DlEQ_SkmjLM','q2iHfJqM8O0'])

lesson('Sikllar va algoritmik fikrlash',
 ['for va while bilan takrorlash', 'Sikl tugash shartini asoslash'],
 '''Bir xil amal ko‘p marta kerak bo‘lsa sikl yozamiz. for boshlang‘ich qiymat, davom etish sharti va yangilanishni bir joyda beradi. Takrorlar soni oldindan ma’lum bo‘lsa qulay. while shart rost bo‘lganda davom etadi; foydalanuvchi chiqish buyrug‘i berguncha ishlaydigan menyuga mos. do/while tanani kamida bir marta bajaradi.

Yig‘uvchi o‘zgaruvchi sikldan oldin 0 bo‘ladi. 1..n yig‘indisida har qadamda i qo‘shiladi. i=1, n=5 uchun qo‘lda jadval tuzing: qadamlar oxirida sum 1, 3, 6, 10, 15 bo‘ladi. Shu jadval dastur izini tushunishga yordam beradi. Sikl ichida sum=0 yozilsa oldingi natija yo‘qoladi.

Siklning to‘xtashini tekshiring: hisoblagich chegaraga yaqinlashyaptimi? while ichida o‘zgaruvchi yangilanmasa cheksiz takrorlanishi mumkin. break eng yaqin sikldan chiqadi; continue joriy qadamning qolganini tashlab keyingi takrorga o‘tadi. Ularni shartlarni yashirish uchun ortiqcha ishlatmang.

Ichma-ich sikl jadval yaratishi mumkin: tashqi sikl satrlar, ichki sikl ustunlar uchun. n ta elementni bir marta ko‘rish O(n), n*n juftlikni ko‘rish O(n²) ish hajmiga olib keladi. Hozir bu belgilarni isbotlashdan ko‘ra amallar sonini sanang. 0, 1 va ko‘p takror holatini tekshirish chegaradagi xatolarni ochadi.''',
 '''public class Week04 {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 1; i <= 5; i++) sum += i;
        System.out.println(sum);
    }
}''', '15',
 ['1..5 yig‘indisini for, so‘ng while bilan hisoblang.', '1..20 ichidagi juft sonlarni chiqaring.', '3x4 yulduzchali jadvalni ichma-ich sikl bilan yozing.'],
 'DigitSum.java: 0..1000000000 butun sonning raqamlari yig‘indisini while bilan hisoblang. Har qadamda % 10 va / 10 dan foydalaning. Kirish to‘g‘ri, manfiy emas deb olinadi. Sonni Stringga aylantirmang.',
 ['0 → 0', '507 → 12', '1000000000 → 1', '9999 → 36'],
 ['< va <= orasida bitta takror farqi bor.', 'Yig‘uvchini sikl ichida qayta nollamang.', 'while davom etishi uchun emas, tugashi uchun ham sabab bo‘lsin.'],
 [('for(int i=0;i<3;i++) necha marta ishlaydi?', ['3','2','4','0'], '3','i qiymatlari 0, 1, 2.'), ('Sikldan darhol chiqish?', ['break','continue','next','skip'], 'break','break eng yaqin siklni tugatadi.'), ('Kamida bir marta bajariladigan sikl?', ['do/while','while','for har doim','Hech biri'], 'do/while','Shart tana bajarilgandan keyin tekshiriladi.')],
 ['PPoZho4XsuI','zEroZ1eXdrk'])

lesson('Metodlar va masalani qismlarga ajratish',
 ['Parametr va qaytish qiymatini ishlatish', 'Konsolni hisoblash mantiqidan ajratish'],
 '''Metod nomlangan vazifani bajaradi. Parametr metodga kiruvchi ma’lumot; return natijani chaqiruvchiga qaytaradi. int sum(int a, int b) ikki butun son oladi va butun natija beradi. void natija qaytarmaslikni bildiradi. println qilish va return qilish bir xil emas: chiqarilgan sonni boshqa hisoblashga bevosita uzata olmaysiz.

Metodga bitta aniq mas’uliyat bering. Masalan, isEven sonning juftligini tekshirsin, foydalanuvchiga savol bermasin. main kirishni o‘qib, metodni chaqirib, natijani chiqarsin. Shunday tuzilma metodni ko‘p kirishlarda konsolsiz tekshirishga imkon beradi. Metodning shartnomasida ruxsat etilgan kirishlar va natija ma’nosi yoziladi.

Java argumentlarni qiymat bo‘yicha uzatadi. int parametr qiymatini metod ichida almashtirish chaqiruvchining int o‘zgaruvchisini o‘zgartirmaydi. Obyekt havolasining nusxasi uzatilganda obyekt holatini o‘zgartirish mumkin; massivlarda buni keyin ko‘ramiz. Lokal o‘zgaruvchi o‘z blokidan tashqarida ko‘rinmaydi.

Overloading bir nomdagi metodlarning parametr ro‘yxati farqlanishidir. Faqat qaytish turini o‘zgartirish yetmaydi. Boshlanishida ko‘p variant o‘rniga sodda aniq metodlar yozing. Namunadagi clamp ballni oraliqqa sig‘diradi: past bo‘lsa pastki, yuqori bo‘lsa yuqori chegara qaytadi. Bu validatsiya o‘rniga barcha joyda ishlatilishi kerak degani emas; noto‘g‘ri kirishni rad etish talab qilingan joyda yashirib tuzatish xato.''',
 '''public class Week05 {
    static int clamp(int value, int min, int max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
    public static void main(String[] args) {
        System.out.println(clamp(105, 0, 100));
        System.out.println(clamp(72, 0, 100));
    }
}''', '100\n72',
 ['maxOfThree metodini yozing va teng sonlar bilan tekshiring.', 'isEven metodini printlnsiz yozing.', 'clamp metodining min <= max shartini READMEda hujjatlashtiring.'],
 'NumberTools.java: static int digitSum(int n), static boolean isPrime(int n) yozing. n 0..1000000. main faqat namuna chaqiruvlarini ko‘rsatsin. isPrime 0 va 1 uchun false qaytarsin. Sinovlar jadvalini ilova qiling.',
 ['digitSum(507) → 12; digitSum(0) → 0', 'isPrime(0), isPrime(1), isPrime(9) → false', 'isPrime(2), isPrime(97) → true'],
 ['return dan keyingi bajarilmaydigan kodni yozmang.', 'Faqat qaytish turi overloading yaratmaydi.', 'Parametr nomi chaqiruvchi o‘zgaruvchi nomi bilan bir xil bo‘lishi shart emas.'],
 [('Natija qaytaradigan kalit so‘z?', ['return','print','break','new'], 'return','return metod natijasini chaqiruvchiga uzatadi.'), ('void nimani bildiradi?', ['Natija qaytarmaydi','Faqat nol qaytaradi','Parametr olmaydi','Metod private'], 'Natija qaytarmaydi','void metod parametr olishi va ish bajarishi mumkin.'), ('Overloading uchun nima farqlanadi?', ['Parametr ro‘yxati','Faqat return turi','Faqat metod tanasi','Fayl rangi'], 'Parametr ro‘yxati','Parametr soni yoki turlari farqlanishi kerak.')],
 ['v5p_SUfi710'])

lesson('Massivlar va qidirish',
 ['Massiv indekslari bilan xavfsiz ishlash', 'Minimum, o‘rtacha va chiziqli qidirish yozish'],
 '''Massiv bir turdagi elementlar ketma-ketligi bo‘lib, uzunligi yaratilganda belgilanadi. int[] scores = {70, 90, 80} uch elementga ega. Birinchi indeks 0, oxirgisi length-1. scores[3] bu massivda mavjud emas. for shartida i < scores.length yozish shu chegarani saqlaydi.

Yig‘indi uchun 0 dan boshlash to‘g‘ri, minimum uchun esa 0 noto‘g‘ri bo‘lishi mumkin. Faqat musbat sonlardan iborat massivda bunday minimum sun’iy 0 bo‘lib qoladi. Massiv bo‘sh emasligi tekshirilgach, minimumni birinchi elementdan boshlang. O‘rtacha uchun butun bo‘lishga tushmaslik maqsadida yig‘indini doublega o‘tkazing; bo‘sh massiv uchun natija siyosatini oldindan belgilang.

Chiziqli qidiruv elementlarni chapdan o‘ngga tekshiradi. Topilganda indeks, topilmaganda -1 qaytarish keng tarqalgan shartnoma. Takrorlangan qiymatlarda birinchi uchragani qaytarilishini aniq ayting. for-each qiymatlarni o‘qishga qulay, lekin indeks kerak bo‘lsa oddiy for tushunarliroq.

Massiv havola turidir. int[] other = scores yangi nusxa yaratmaydi: ikkala o‘zgaruvchi bir massivni ko‘rsatadi. other[0] almashtirilsa scores[0] ham o‘zgaradi. Mustaqil nusxa uchun clone yoki Arrays.copyOf ishlatiladi. Birinchi semestrda kod yozish bilan birga kirish holati o‘zgaradimi degan savolni doim bering.''',
 '''public class Week06 {
    static int indexOf(int[] values, int target) {
        for (int i = 0; i < values.length; i++) {
            if (values[i] == target) return i;
        }
        return -1;
    }
    public static void main(String[] args) {
        int[] scores = {70, 90, 80};
        System.out.println(indexOf(scores, 90));
        System.out.println(indexOf(scores, 60));
    }
}''', '1\n-1',
 ['Massivdagi eng katta qiymatni toping; bo‘sh massivni alohida tekshiring.', 'Massiv va uning clone nusxasini o‘zgartirib farqini ko‘ring.', 'Chiziqli qidiruvda elementlar necha marta tekshirilganini hisoblang.'],
 'ScoreStats.java: 1..100 ta 0..100 ball uchun minimum, maksimum, o‘rtacha va 60 dan kam ballar sonini hisoblang. Hisoblash metodlariga int[] uzating. Bo‘sh massivda “Ma’lumot yo‘q” yozing; nolga bo‘lmang.',
 ['[70,90,80] → min70 max90 avg80.0 low0', '[0,60,100] → min0 max100 avg53.333... low1', '[55] → min55 max55 avg55.0 low1', '[] → Ma’lumot yo‘q'],
 ['Oxirgi indeks length emas, length-1.', 'Massiv uzunligi length; length() emas.', 'Massivni boshqa o‘zgaruvchiga tayinlash nusxa olish emas.'],
 [('5 elementli massivning oxirgi indeksi?', ['4','5','1','6'], '4','Indekslar 0 dan boshlanadi.'), ('int[] a={2,3}; a.length nechaga teng?', ['2','1','3','0'], '2','length elementlar soni.'), ('Topilmagan indeks uchun kursdagi shartnoma?', ['-1','0','1','100'], '-1','0 haqiqiy birinchi indeks bo‘lishi mumkin.')],
 ['GoXwIVyNvX0@4038'])

lesson('String va matnni qayta ishlash',
 ['Matn mazmunini to‘g‘ri solishtirish', 'Kiritilgan matnni tozalash va tahlil qilish'],
 '''String o‘zgarmas matn obyektidir. trim yoki toUpperCase yangi natija qaytaradi; uni saqlamasangiz eski matn o‘zgarishsiz qoladi. String name = raw.trim() chetdagi oddiy bo‘shliqlarni olib tashlaydi. isBlank faqat bo‘shliqdan iborat matnni ham aniqlaydi. Bu usullar matnni tekshirishga yordam beradi, ammo ma’nosini avtomatik to‘g‘rilamaydi.

== havolalarning aynan bir obyektni ko‘rsatishini tekshiradi. equals matn mazmunini solishtiradi. Literal bilan test qilganda == tasodifan kutilgan natija berishi mumkin; kiritilgan matnda bunga tayanmang. null bo‘lishi mumkin bo‘lgan o‘zgaruvchida metod chaqirish xato; “java”.equals(value) null uchun false qaytaradi.

length UTF-16 kod birliklari sonini beradi. charAt indeks bilan ishlaydi, biroq ayrim emoji ikki kod birlikdan iborat; bu semestrning harf bo‘yicha oddiy mashqlari lotin ASCII belgilariga cheklanadi. substring boshlanishni oladi, tugash indeksini olmaydi. 0..3 oralig‘i birinchi uch kod birlikni beradi.

split muntazam ifoda qabul qiladi. Oddiy vergul bilan ajratilgan mashq matnini bo‘lish mumkin, ammo qo‘shtirnoqli haqiqiy CSV formatini shunchaki split bilan to‘liq tahlil qilib bo‘lmaydi. Ko‘p marta matn yig‘ishda StringBuilder qulay. Foydalanuvchi ismini faqat bir xil qolipga majburlashdan ko‘ra bo‘sh emasligi va ruxsat etilgan uzunligini tekshirish odatda maqsadga muvofiq.''',
 '''public class Week07 {
    public static void main(String[] args) {
        String raw = "  Java asoslari  ";
        String clean = raw.trim();
        System.out.println(clean);
        System.out.println("java".equalsIgnoreCase("JAVA"));
        System.out.println(clean.split(" ").length);
    }
}''', 'Java asoslari\ntrue\n2',
 ['Bo‘sh, faqat bo‘shliqli va odatiy satrni isBlank bilan tekshiring.', 'new String("java") bilan equals va == farqini kuzating.', 'StringBuilder yordamida 1 dan 5 gacha sonlarni vergul bilan birlashtiring.'],
 'TextAnalyzer.java: lotin ASCII harflari va bo‘shliqlardan iborat qator uchun so‘zlar hamda unli harflar (a,e,i,o,u; katta-kichik farqsiz) sonini hisoblang. Ketma-ket bo‘shliqlar bitta ajratuvchi deb olinadi; bo‘sh satrda 0 so‘z.',
 ['“Java til” → 2 so‘z, 3 unli', '“   ” → 0 so‘z, 0 unli', '“  SALOM   Java ” → 2 so‘z, 4 unli'],
 ['equals va == vazifalari boshqa.', 'trim natijasini o‘zgaruvchiga saqlang.', 'Bo‘sh satrni split qilishdan oldin tekshiring.'],
 [('String mazmuni tengligini qaysi metod tekshiradi?', ['equals','==','same','compareReference'], 'equals','equals mazmunni solishtiradi.'), ('"Java".substring(0,2) natijasi?', ['Ja','Jav','av','Java'], 'Ja','Tugash indeksi kiritilmaydi.'), ('String o‘zgaruvchanmi?', ['Yo‘q, obyekt o‘zgarmas','Ha, har bir metod o‘zgartiradi','Faqat int bo‘lsa','Har doim null'], 'Yo‘q, obyekt o‘zgarmas','Matnni o‘zgartiruvchi usullar yangi natija qaytaradi.')],
 ['P9hEmbfdiuc'])

lesson('Debugging, testlash va oraliq nazorat',
 ['Xatoni takrorlanadigan misol bilan ko‘rsatish', 'Normal, chegara va noto‘g‘ri kirish testlarini ajratish'],
 '''Xatolarni uch guruhda kuzatamiz: sintaksis xatosi kompilyatsiyaga to‘sqinlik qiladi; bajarilish xatosi ish vaqtida yuz beradi; mantiqiy xato dastur ishlasa ham noto‘g‘ri natija beradi. Dastur yiqilmagani uning to‘g‘riligiga dalil emas. Xato haqidagi hisobotda kirish, kutilgan natija, amaldagi natija va takrorlash buyrug‘i bo‘lsin.

Debugger breakpointda dasturni to‘xtatadi. Step over keyingi qadamga o‘tadi; step into chaqirilayotgan metod ichiga kiradi. O‘zgaruvchilar oynasida qiymatlarni kuzating. Yig‘indi noto‘g‘ri bo‘lsa har qatordan shubhalanish o‘rniga birinchi noto‘g‘ri qiymat paydo bo‘lgan qadamni toping. println ham sodda kuzatuv uchun foydali, lekin tayyor yechim chiqishini keraksiz diagnostika bilan buzmasin.

Testning kutilgan javobini tekshirilayotgan algoritmning aynan nusxasi bilan hisoblamang: bitta xato ikkala joyga ko‘chadi. Kichik misolni qo‘lda hisoblang. Minimum topishda [8,9], [-3,-1], bitta element va bo‘sh kirish alohida holatlar. Chegaraviy sinov shart operatorlaridagi tenglik xatolarini topadi.

Quyida oddiy tekshiruv metodi kutilgan qiymat bilan natijani solishtiradi va farqda AssertionError beradi. Bu Java assert kalit so‘ziga bog‘liq emas va -ea talab qilmaydi. Keyingi kurslarda JUnit bilan ishlash mumkin. Hozir tashqi kutubxonasiz takrorlanadigan sinov yozishni o‘rganamiz. Gitda kichik mazmunli commitlar yordamida ishlaydigan holatlarni saqlash, READMEda buyruqlarni yozish ham sifatning bir qismi.''',
 '''public class Week08 {
    static int max(int a, int b) { return a > b ? a : b; }
    static void check(int expected, int actual) {
        if (expected != actual) throw new AssertionError(expected + " != " + actual);
    }
    public static void main(String[] args) {
        check(9, max(8, 9));
        check(-1, max(-3, -1));
        check(5, max(5, 5));
        System.out.println("3 test o'tdi");
    }
}''', "3 test o'tdi",
 ['max metodidagi > ni < ga o‘zgartiring va qaysi test yiqilishini ko‘ring.', 'Breakpoint bilan birinchi noto‘g‘ri qaytishni toping.', 'Bug-report.md: kirish, kutilgan, amaldagi natija va tuzatishni yozing.'],
 'Oraliq amaliy ish: konsol orqali 5 ta 0..100 ball olib, massivga joylang; min, max, o‘rtacha va 60+ ballar sonini metodlarda hisoblang. Diapazondan tashqari sonni qayta so‘rang. 5 ta test va bitta topilgan xato hisobotini topshiring. Harf kiritishni boshqarish bu ishda talab qilinmaydi.',
 ['[0,0,0,0,0] → avg0, pass0', '[100,100,100,100,100] → avg100, pass5', '[59,60,79,80,100] → avg75.6, pass4', '-1 yoki 101 ball massivga saqlanmaydi'],
 ['Faqat odatiy kirish bilan cheklanmang.', 'Mantiqiy xatoda kompilyator yordam bermasligi mumkin.', 'Testni o‘chirish xatoni tuzatish emas.'],
 [('Chegaraviy test juftligi qaysi?', ['59 va 60','71 va 73','20 va 30','10 va 40'], '59 va 60','60 chegarasining ikki tomonini tekshiradi.'), ('Dastur ishlab noto‘g‘ri natija bersa?', ['Mantiqiy xato','Faqat sintaksis xatosi','Kompilyatsiya to‘xtaydi','Muammo yo‘q'], 'Mantiqiy xato','Algoritm yoki shart noto‘g‘ri bo‘lishi mumkin.'), ('Yaxshi bug hisobotida nima zarur?', ['Kirish va kutilgan/amaldagi natija','Faqat “ishlamadi”','Faqat fayl rangi','Faqat kompyuter nomi'], 'Kirish va kutilgan/amaldagi natija','Boshqa odam xatoni takrorlashi kerak.')],
 ['mlEemeFbqLw'])

lesson('Klasslar, obyektlar va inkapsulyatsiya',
 ['Predmet sohasini klass orqali modellashtirish', 'Obyekt holatini konstruktor va metodlarda himoyalash'],
 '''Klass obyektlarning tuzilishi va xulqini belgilaydi. Student klassida name va score maydonlari hamda score ni yangilash metodi bo‘lishi mumkin. new har safar yangi obyekt yaratadi. Ikkita talaba bir klassdan yaratilsa ham holati mustaqil. Konstruktor boshlang‘ich holatni o‘rnatadi va klass bilan bir xil nomga ega, qaytish turi yozilmaydi.

Inkapsulyatsiya maydonlarni yashirish bilangina tugamaydi. Obyektning ruxsat etilgan holatini saqlash kerak. Ball 0..100 bo‘lsa, konstruktor ham yangilash metodi ham shu shartni tekshiradi. private maydonga tashqaridan istalgan qiymat berishni cheklaydi; public metod biznes qoidani bajaradi. Hamma maydon uchun majburiy setter yaratish shart emas.

this joriy obyektni bildiradi. Parametr va maydon nomi bir xil bo‘lsa this.score = score ularni ajratadi. static a’zo alohida obyektga tegishli emas; umumiy yordamchi hisoblashlar uchun ishlatilishi mumkin. Talabaning shaxsiy ballini static qilish barcha obyektlar uchun bir qiymat yaratadi va modelni buzadi.

Namunada noto‘g‘ri ball uchun IllegalArgumentException ishlatiladi. Hozir uni shartnoma buzilganda ishni to‘xtatish sifatida ko‘ring, ushlab foydalanuvchiga xabar berishni 13-haftada o‘rganamiz. Obyektni chiqarishda toString qisqa mazmun beradi. Maxfiy qiymatlarni toStringga kiritishdan saqlaning; mashqlarda namuna ma’lumot ishlating.''',
 '''public class Week09 {
    static class Student {
        private final String name;
        private int score;
        Student(String name, int score) { this.name = name; setScore(score); }
        void setScore(int score) {
            if (score < 0 || score > 100) throw new IllegalArgumentException("Ball 0..100");
            this.score = score;
        }
        public String toString() { return name + ": " + score; }
    }
    public static void main(String[] args) {
        Student student = new Student("Ali", 70);
        student.setScore(85);
        System.out.println(student);
    }
}''', 'Ali: 85',
 ['Ikki Student yarating, birining ballini o‘zgartirib ikkinchisini tekshiring.', 'Konstruktor va setterga -1 berib shart buzilishini kuzating.', 'name uchun bo‘sh emaslik shartini qo‘shing.'],
 'Book klassi: private final id va title, private borrowed. Konstruktor bo‘sh id/title ni rad etsin. borrow() band kitob uchun false, aks holda band qilib true qaytarsin. giveBack() bo‘sh kitob uchun false, aks holda qaytarib true qaytarsin. Setter orqali borrowedni tashqaridan almashtirmang.',
 ['Yangi kitobni birinchi borrow → true; ikkinchi → false', 'giveBack → true; qayta giveBack → false', 'Ikki kitob holati mustaqil', 'Bo‘sh nom konstruktor tomonidan rad etiladi'],
 ['Konstruktor oldiga void yozmang.', 'private maydonni public setter bilan shartsiz ochish himoyani yo‘qotadi.', 'Shaxsiy holatni static qilmang.'],
 [('Obyekt yaratish operatori?', ['new','class','return','this'], 'new','new konstruktor yordamida obyekt yaratadi.'), ('private maydonga odatda qayerdan kiriladi?', ['Shu klass ichidan','Istalgan klassdan','Faqat terminaldan','Faqat READMEdan'], 'Shu klass ichidan','private klassning ichki holatini himoya qiladi.'), ('Konstruktor qaytish turi?', ['Yozilmaydi','void majburiy','int majburiy','String majburiy'], 'Yozilmaydi','Konstruktor nomi klass nomi bilan mos va qaytish turi yo‘q.')],
 ['YRdWqNb0yjs','wF-0nfL0W2o'])

lesson('Meros olish va kompozitsiya',
 ['is-a va has-a munosabatlarini farqlash', 'Override va superni maqsadli ishlatish'],
 '''Meros olish umumiy xulqni kengaytirish imkonini beradi. PrintedBook — Book turi bo‘lishi mumkin; Library esa Book emas, unda kitoblar bor. Birinchisi is-a, ikkinchisi has-a. Faqat kodni qayta ishlatish istagi uchun noto‘g‘ri meros zanjiri qurmaslik kerak. Ko‘p holatda obyektni maydon sifatida saqlash, ya’ni kompozitsiya, modelni tushunarli qiladi.

extends bilan ota klass tanlanadi. Java klassi faqat bitta klassdan bevosita meros oladi. super konstruktorni yoki ota metodni chaqirishga yordam beradi. Ota konstruktor parametr talab qilsa farzand konstruktori kerakli qiymatni uzatadi. Ota klass private maydoniga farzand to‘g‘ridan-to‘g‘ri kira olmaydi; mos metod orqali ishlaydi.

Override — meros olingan metod xulqini mos imzo bilan almashtirish. @Override yozuvi xato imzoni kompilyatorga tekshirtiradi. Overloading esa bitta nomdagi turli parametrli metodlar. Bu tushunchalarni aralashtirmang. Ota turidagi o‘zgaruvchi farzand obyektini ushlashi mumkin; chaqirilgan instance metodning mos override varianti bajariladi.

Namunada Resource nomli umumiy resurs va VideoLesson bor. Haqiqiy loyiha uchun resurslar soni kam bo‘lsa bu ierarxiya ortiqcha bo‘lishi mumkin; maqsad polymorphismni ko‘rsatish. Dizaynni chizmada tushuntiring: qaysi ma’lumot umumiy, qaysi xulq farq qiladi, foydalanuvchi qaysi birini chaqiradi. Farzand klass ota klassning va’dalarini buzmasligi kerak.''',
 '''public class Week10 {
    static class Resource {
        private final String title;
        Resource(String title) { this.title = title; }
        String label() { return title; }
    }
    static class VideoLesson extends Resource {
        VideoLesson(String title) { super(title); }
        @Override String label() { return "Video: " + super.label(); }
    }
    public static void main(String[] args) {
        Resource item = new VideoLesson("Java");
        System.out.println(item.label());
    }
}''', 'Video: Java',
 ['Resource va TextLesson klasslarini yozing.', 'Ikkalasini Resource[] orqali aylanib label ni chaqiring.', 'Library has-a Book munosabatini kichik chizma bilan ifodalang.'],
 'LibraryItem ota klassiga id va title bering. PrintedBook pageCount, EBook sizeKb maydoniga ega bo‘lsin. description() har bir turga mos matn qaytarsin. Barcha obyektlarni LibraryItem[]da saqlab bitta siklda chiqaring. Manfiy sahifa/hajm rad etilsin.',
 ['PrintedBook tavsifida sahifa soni bor', 'EBook tavsifida KB hajmi bor', 'Ota turidagi havola orqali to‘g‘ri override chaqiriladi', '0 yoki manfiy pageCount rad etiladi'],
 ['extends “ichida bor” degani emas.', '@Override xatolarni erta aniqlashga yordam beradi.', 'Farzand ota private maydonini to‘g‘ridan-to‘g‘ri o‘qimaydi.'],
 [('Meros olish kalit so‘zi?', ['extends','implementsOnly','new','import'], 'extends','Klassdan meros olish uchun extends.'), ('Library va Book uchun mos munosabat?', ['Library has-a Book','Library is-a Book','Book is-a String','Munosabat bo‘lmaydi'], 'Library has-a Book','Kutubxona kitoblarni o‘zida saqlaydi.'), ('Override nima?', ['Meros olingan metod xulqini almashtirish','Faqat boshqa parametr qo‘shish','Fayl nomini almashtirish','Konstruktorni o‘chirish'], 'Meros olingan metod xulqini almashtirish','Mos metod imzosi bilan yangi bajarilish beriladi.')],
 ['nNM3ND15LH8'])

lesson('Interfeyslar va polimorfizm',
 ['Xulq shartnomasini interface bilan berish', 'Kodga yangi amalga oshirishni ulash'],
 '''Interfeys biror qobiliyatning shartnomasini ifodalaydi. Notifier “xabar yubora oladi” degani; xabar konsolga yoziladimi yoki boshqa yo‘l bilan yetkaziladimi, undan foydalanuvchi kod uchun alohida masala. implements bilan klass shartnomani bajaradi. Bir klass bir nechta interfeysni amalga oshirishi mumkin.

Interfeys turidagi parametr qabul qilgan metod konkret klassga kamroq bog‘lanadi. Masalan, report(Notifier n) faqat n.send ni biladi. ConsoleNotifier o‘rniga test uchun xabarni xotirada saqlaydigan variantni berish mumkin. Bu semestrdagi misollar haqiqiy email yoki SMS jo‘natmaydi; tashqi ta’sirsiz modellashtiramiz.

Abstract klass umumiy holat va qisman bajarilgan metodlarni bir joyda berishi mumkin; undan bevosita obyekt yaratilmaydi. Interfeys esa asosiy e’tiborni bajarilishi kerak bo‘lgan xulqqa qaratadi. Zamonaviy Java interfeyslarida default metod ham bo‘lishi mumkin, lekin bu mashqda oddiy abstract metod bilan cheklanamiz.

Polimorfizm bir xil chaqiruv turli obyektlarda mos xulqni bajarishidir. Har yangi tur uchun if (type.equals(...)) qo‘shish o‘rniga kerakli klassni shartnoma bilan ulash mumkin. Biroq ikkita oddiy ifni yo‘qotish uchungina o‘nlab klass yaratish ham shart emas. Dizaynni talablardagi o‘zgarish bilan asoslang: yangi format qo‘shilganda qaysi fayllar o‘zgaradi?''',
 '''public class Week11 {
    interface Notifier { void send(String message); }
    static class ConsoleNotifier implements Notifier {
        public void send(String message) { System.out.println("Xabar: " + message); }
    }
    static void report(Notifier notifier) { notifier.send("Topshiriq tayyor"); }
    public static void main(String[] args) { report(new ConsoleNotifier()); }
}''', 'Xabar: Topshiriq tayyor',
 ['UppercaseNotifier yozing; report metodini o‘zgartirmang.', 'ConsoleNotifier va yangi variantni bir massivda chaqiring.', 'Interfeys va abstract klass farqini o‘z misolingizda tushuntiring.'],
 'ReportFormatter interfeysi format(String title, int count) metodiga ega. PlainFormatter “Java: 3”, CsvFormatter “Java,3” qaytarsin. Hisobot funksiyasi ReportFormatter qabul qilsin. CSV mashqida title ichida vergul yoki yangi qator bo‘lmasin; bu cheklovni hujjatlashtiring.',
 ['PlainFormatter(Java,3) → Java: 3', 'CsvFormatter(Java,3) → Java,3', 'Hisobot funksiyasi konkret formatter klassiga cast qilmaydi'],
 ['Interfeysdagi public metodni kuchsizroq kirish bilan amalga oshirmang.', 'Abstract klassdan new bilan bevosita obyekt olmang.', 'Shartnomani nom emas, kutilgan xulq ham belgilaydi.'],
 [('Interfeysni amalga oshirish kalit so‘zi?', ['implements','extendsClass','newInterface','package'], 'implements','Klass interfeysni implements orqali bajaradi.'), ('Abstract klassdan bevosita new qilish mumkinmi?', ['Yo‘q','Ha har doim','Faqat Windowsda','Faqat static bo‘lsa'], 'Yo‘q','Konkret farzand klass kerak.'), ('Notifier parametrining afzalligi?', ['Turli amalga oshirishlarni qabul qiladi','Faqat bitta klassni oladi','Testlashni taqiqlaydi','Har doim tarmoq ishlatadi'], 'Turli amalga oshirishlarni qabul qiladi','Interfeysga mos obyektlarni almashtirish mumkin.')],
 ['i0G7nfgxkFo','GoXwIVyNvX0@12323'])

lesson('Kolleksiyalar: List, Set va Map',
 ['Vazifaga mos kolleksiya tanlash', 'Generics yordamida tur xavfsizligini saqlash'],
 '''Massiv uzunligi o‘zgarmaydi; dinamik ro‘yxat uchun ArrayList qulay. List tartibni saqlaydi va takror qiymatlarga ruxsat beradi. Set takror elementni saqlamaydi. Map kalitdan qiymatga bog‘lanishni beradi: talaba kodi → ball. Bir xil kalitga put yana chaqirilsa oldingi qiymat almashtiriladi, yangi mustaqil yozuv qo‘shilmaydi.

List<String> faqat String elementlari bilan ishlash niyatini kompilyatorga bildiradi. Generics noto‘g‘ri tur qo‘shishni erta ushlaydi. Primitive int o‘rniga kolleksiyada Integer ishlatiladi; Java ko‘pincha boxing/unboxingni avtomatik qiladi. Null Integerni intga aylantirish xato bo‘lishi mumkin, shuning uchun topilmagan qiymat holatini tekshiring.

ArrayListda size(), massivda length ishlatiladi. remove(int) indeksni olib tashlashi, remove(Object) qiymatni olib tashlashi mumkin. Integer ro‘yxatida bu farq muhim. Oddiy for-each paytida ro‘yxatning o‘zini o‘zgartirishdan saqlaning; kerak bo‘lsa removeIf yoki iterator ishlating.

HashMap va HashSet chiqarish tartibini kafolatlamaydi. Namunada natija takrorlanuvchan bo‘lishi uchun TreeMap tanlangan; u kalitlarni tartiblaydi. Talaba registrida IDni kalit qilish qidiruvni soddalashtiradi. Takror ID uchun mavjud yozuvni indamay almashtirish o‘rniga containsKey bilan tekshirib foydalanuvchiga tushunarli xabar bering.''',
 '''import java.util.Map;
import java.util.TreeMap;
public class Week12 {
    public static void main(String[] args) {
        Map<String, Integer> counts = new TreeMap<>();
        for (String word : new String[]{"java", "kod", "java"}) {
            counts.put(word, counts.getOrDefault(word, 0) + 1);
        }
        System.out.println(counts);
    }
}''', '{java=2, kod=1}',
 ['ArrayListga uch nom qo‘shing, birini indeks bilan o‘chiring.', 'HashSet yordamida takror nomlarni ajrating.', 'Mapda mavjud bo‘lmagan kalit uchun get va getOrDefaultni solishtiring.'],
 'StudentRegistry: Map<String,Integer> orqali ID va ball saqlang. add takror IDni rad etsin, update mavjud ID ballini yangilasin, find topilmagan IDni aniq bildirsin. Ball 0..100. Ro‘yxatni ID bo‘yicha tartiblab chiqaring.',
 ['add(S1,70), add(S1,80) → ikkinchisi rad; qiymat70', 'update(S1,90), find(S1) → 90', 'find(S9) → topilmadi', 'add(S2,101) → rad'],
 ['Mapda bir kalit uchun bitta qiymat mavjud.', 'HashMap tartibiga tayanmang.', 'List<Integer>.remove(1) qiymat1 emas, indeks1ni o‘chiradi.'],
 [('Takror elementni saqlamaydigan tuzilma?', ['Set','List','Oddiy massiv','StringBuilder'], 'Set','Set noyob elementlar to‘plami.'), ('Kalit-qiymat juftligini nima saqlaydi?', ['Map','List','char','boolean'], 'Map','Map kalitni qiymatga bog‘laydi.'), ('ArrayList elementlar soni?', ['size()','length','countField','capacity()'], 'size()','Kolleksiyalar size metodiga ega.')],
 ['GoXwIVyNvX0@6050','GoXwIVyNvX0@6925'])

lesson('Istisnolar va ishonchli kiritish',
 ['Kutiladigan kirish xatosini boshqarish', 'Istisnoni yashirmasdan foydalanuvchiga tushuntirish'],
 '''Foydalanuvchi son o‘rniga harf kiritishi yoki fayl topilmasligi mumkin. Exception muvaffaqiyatsiz yo‘lni ifodalashga yordam beradi. try xavfli amalni, catch mos xatoni boshqarishni belgilaydi. finally odatda yakuniy tozalash uchun ishlatiladi; fayl kabi AutoCloseable resurslar uchun try-with-resources sodda va ishonchliroq.

Integer.parseInt("abc") NumberFormatException beradi. Bu xatoni aniq ushlab “Butun son kiriting” deyish foydali. catch(Exception e) bilan hamma narsani yashirib davom etish dasturdagi haqiqiy nuqsonni niqoblashi mumkin. Bo‘sh catch bloki qoldirmang. Xatoni tiklash, qayta so‘rash yoki yuqoriga uzatish siyosatini tanlang.

Checked exception uchun kompilyator ushlash yoki throws bilan e’lon qilishni talab qiladi; IOException shunday misol. RuntimeException oilasi uchun bu majburiyat yo‘q. throw yangi xatoni chiqaradi; throws metod shartnomasida mumkin bo‘lgan xatoni ko‘rsatadi. Bu ikkisi boshqa vazifa bajaradi.

Kirishni tekshirishni ikki qavatda qo‘llang. Konsol qavati matnning son ekanini tekshiradi; domen metodi esa ball 0..100 ekanini tekshiradi. Keyinroq shu domen metodini boshqa interfeys chaqirsa ham qoida saqlanadi. Foydalanuvchiga texnik stack trace o‘rniga qisqa yo‘l-yo‘riq bering; laboratoriya hisobotida esa xatoning aniq turi va sababi bo‘lsin.''',
 '''public class Week13 {
    static String parseScore(String raw) {
        try {
            int value = Integer.parseInt(raw.trim());
            if (value < 0 || value > 100) return "Ball 0..100 bo'lsin";
            return "Qabul: " + value;
        } catch (NumberFormatException error) {
            return "Butun son kiriting";
        }
    }
    public static void main(String[] args) {
        System.out.println(parseScore("abc"));
        System.out.println(parseScore(" 85 "));
    }
}''', 'Butun son kiriting\nQabul: 85',
 ['abc, bo‘sh matn, 101 va 85 kirishlarini solishtiring.', 'Konsolda noto‘g‘ri kirishda qayta so‘rash siklini yozing.', 'throw va throws farqini bitta misolda tushuntiring.'],
 'SafeScoreInput.java: foydalanuvchi 0..100 butun ball yoki q kiritsin. Noto‘g‘ri matn va chegaradan tashqari son dasturga zarar bermasin; sababini yozib qayta so‘rasin. q kiritilganda toza tugasin. EOF kelganda ham cheksiz siklga tushmasin.',
 ['abc → “Butun son kiriting”, qayta so‘raydi', '101 → diapazon xabari', ' 85 → qabul qiladi', 'q va bo‘sh kirish oqimi → dastur tugaydi'],
 ['Bo‘sh catch xatoni yashiradi.', 'NumberFormatException va noto‘g‘ri ball diapazoni alohida holat.', 'EOF bo‘lsa hasNextLine false qaytadi.'],
 [('Integer.parseInt("abc") qanday xato?', ['NumberFormatException','IOException','Hech qanday','NullPointerException har doim'], 'NumberFormatException','Matn butun son ko‘rinishida emas.'), ('Xatoni chiqarish kalit so‘zi?', ['throw','throws','try','finally'], 'throw','throw aniq istisnoni chiqaradi.'), ('Fayl resursini avtomatik yopish?', ['try-with-resources','Bo‘sh catch','Faqat println','while(true)'], 'try-with-resources','AutoCloseable resurs blok tugaganda yopiladi.')],
 ['adTDlH0lhaA'])

lesson('Fayllar va ma’lumotni saqlash',
 ['UTF-8 matn faylini o‘qish va yozish', 'Yuklashda buzilgan ma’lumotni aniqlash'],
 '''Dastur xotirasidagi ro‘yxat jarayon tugaganda yo‘qoladi. Faylga yozish holatni keyingi ishga tushirishga saqlaydi. Path fayl manzilini, Files ko‘p o‘qish-yozish amallarini beradi. Files.writeString va readString kichik matnlar uchun qulay. Katta faylni butun xotiraga yuklash o‘rniga oqim bo‘yicha o‘qish kerak bo‘lishi mumkin.

Kodlashni UTF-8 deb aniq ko‘rsating: o‘zbekcha belgilar boshqa muhitda ham bir xil o‘qiladi. Nisbiy yo‘l joriy ish papkasiga bog‘liq. Dastur “fayl topilmadi” desa avval qaysi papkadan ishga tushganini tekshiring. Yozish mavjud faylni almashtirishi mumkin; foydalanuvchi ma’lumotini saqlashda xatoni ko‘rsatish va zaxira siyosatini o‘ylash zarur.

O‘quv registri uchun har qatorda id;title;status shaklini tanlaymiz. Bu to‘liq CSV standarti emas. id va title ichida nuqtali vergul hamda yangi qatorni taqiqlash shartnomani soddalashtiradi. split(";", -1) oxirgi bo‘sh ustunni ham saqlaydi. Ustunlar soni, status qiymati va takror ID tekshirilsin.

Yuklashni avval vaqtinchalik kolleksiyaga bajaring. Bir qator xato bo‘lsa mavjud xotira holatini yarim yuklangan ma’lumot bilan almashtirmang. Fayl topilmasa birinchi ishga tushirishda bo‘sh ro‘yxat maqbul bo‘lishi mumkin, ammo ruxsat xatosini bo‘sh ro‘yxat deb yashirmang. Quyidagi namuna vaqtinchalik fayl ishlatib, nihoyat uni tozalaydi; foydalanuvchi fayllariga tegmaydi.''',
 '''import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.io.IOException;
public class Week14 {
    public static void main(String[] args) throws IOException {
        Path file = Files.createTempFile("java-course-", ".txt");
        try {
            Files.writeString(file, "B1;Java;available", StandardCharsets.UTF_8);
            System.out.println(Files.readString(file, StandardCharsets.UTF_8));
        } finally {
            Files.deleteIfExists(file);
        }
    }
}''', 'B1;Java;available',
 ['Namuna matnga o‘zbekcha sarlavha qo‘shib qayta o‘qing.', 'split(";", -1) bilan uch ustunni ajrating.', 'Buzilgan qator uchun qator raqami ko‘rsatiladigan xabar yozing.'],
 'RegistryStore: talabalar ID va ballini UTF-8 faylga id;score ko‘rinishida saqlang va yuklang. ID ichida ; yoki yangi qator bo‘lmasin, ball 0..100, ID takrorlanmasin. Noto‘g‘ri fayl yuklansa avvalgi xotira holati saqlansin. Ma’lumot papkasi hujjatlashtirilsin.',
 ['Ikki yozuvni save/load qilish natijani saqlaydi', 'Buzilgan qator → qator raqami bilan xato', 'Takror ID → yuklash rad', 'Mavjud bo‘lmagan fayl → hujjatlashtirilgan bo‘sh boshlanish'],
 ['Fayl yo‘li ish papkasiga bog‘liq.', 'split sukut bo‘yicha oxirgi bo‘sh ustunlarni tashlashi mumkin.', 'Yarim yuklangan holatni asosiy ro‘yxatga yozmang.'],
 [('Matn kodlashini aniq belgilash uchun?', ['StandardCharsets.UTF_8','Math.PI','System.in','Integer.MAX_VALUE'], 'StandardCharsets.UTF_8','UTF-8 kodlash shartnomasini aniq beradi.'), ('Path nimani ifodalaydi?', ['Fayl yoki papka yo‘li','Faqat fayl ichidagi matn','HTTP javob','Java klass nomi'], 'Fayl yoki papka yo‘li','Path fayl tizimidagi manzil bilan ishlaydi.'), ('Buzilgan fayl yuklansa eng xavfsiz holat?', ['Avvalgi holatni saqlab xabar berish','Yarmini indamay qabul qilish','Barcha fayllarni o‘chirish','Ballni tasodifiy tanlash'], 'Avvalgi holatni saqlab xabar berish','Vaqtinchalik holatda tekshirib keyin almashtirish yaxlitlikni saqlaydi.')],
 ['Pg0aoSbrqOE'])

lesson('Yakuniy loyiha: mini kutubxona',
 ['Talabdan ishlaydigan konsol dasturigacha yetkazish', 'Natijani test, README va namoyish bilan himoya qilish'],
 '''Yakuniy loyihada semestr mavzulari birlashadi. Foydalanuvchi kutubxonachi rolida kitob qo‘shadi, qidiradi, ro‘yxatni ko‘radi, kitobni beradi va qaytaradi. Bu mahalliy konsol dasturi; haqiqiy talaba ma’lumotlari talab qilinmaydi. Muammoni eng kichik ishlaydigan bosqichdan boshlang: avval xotiradagi bitta kitobni qo‘shish va ko‘rsatish.

Book obyektida id, title va borrowed holati bo‘ladi. LibraryService takror ID, bo‘sh nom va band kitobni qayta berish kabi qoidalarni tekshiradi. ConsoleMenu kiritish va xabarlar bilan shug‘ullanadi. FileStore saqlash/yuklashni boshqaradi. Domen klasslari ichida Scanner chaqirmaslik testlashni osonlashtiradi.

Qabul mezonini foydalanuvchi harakati sifatida yozing: “B1 kitobini qo‘shdim; B1 ni yana qo‘shsam rad etildi; oldingi nom o‘zgarmadi”. Har xato yo‘ldan keyin holatni ham tekshiring. Dastur qayta ochilganda band holat saqlanishi kerak. Fayl buzilsa tushunarli xabar chiqsin; eski xotira holatini buzmasin.

Ishni 9-haftada domen modeli, 12-haftada kolleksiya, 14-haftada saqlash va 15-haftada yakunlash bosqichlariga ajrating. Har bosqich kichik ishlaydigan natija bersin. Himoyada faqat kod o‘qish yetarli emas: oddiy oqim, noto‘g‘ri kirish va qayta ishga tushirishni namoyish qiling. README boshqa talaba loyihani sizsiz ishga tushira oladigan darajada bo‘lsin. Quyidagi kichik misol yakuniy javob emas, takror ID qoidasining mustaqil boshlang‘ich namunasi.''',
 '''import java.util.Map;
import java.util.TreeMap;
public class Week15 {
    static boolean add(Map<String, String> books, String id, String title) {
        if (id.isBlank() || title.isBlank() || books.containsKey(id)) return false;
        books.put(id, title);
        return true;
    }
    public static void main(String[] args) {
        Map<String, String> books = new TreeMap<>();
        System.out.println(add(books, "B1", "Java"));
        System.out.println(add(books, "B1", "Boshqa nom"));
        System.out.println(books.get("B1"));
    }
}''', 'true\nfalse\nJava',
 ['Talablarni 6 ta foydalanuvchi ssenariysiga ajrating.', 'Domen modeli va menyuni alohida klasslarda yozing.', 'Bir kursdoshingiz README bilan dasturni ishga tushirsin; tushunarsiz joylarni yozib tuzating.'],
 'Mini Library yakuniy loyiha: qo‘shish, ID/nom bo‘yicha qidirish, ro‘yxat, berish, qaytarish, UTF-8 faylga saqlash/yuklash va chiqish menyusi. Kamida Book, LibraryService, ConsoleMenu, FileStore ajratilsin. 12 ta avtomatik yoki takrorlanadigan qo‘lda test, README, klasslar chizmasi va 3–5 daqiqalik namoyish tayyorlang. Tayyor kutubxona tizimi ko‘chirmasini topshirmang; foydalangan yordam va manbalarni yozing.',
 ['B1 qo‘shiladi; takror B1 rad etilib eski nom saqlanadi', 'B1 ni berish → muvaffaqiyat; yana berish → rad', 'B1 ni qaytarish → muvaffaqiyat; qayta qaytarish → rad', 'Mavjud bo‘lmagan ID → tushunarli xabar', 'Save, dasturdan chiqish, load → nom va band holat saqlangan', 'Buzilgan fayl va noto‘g‘ri menyu kirishi ma’lumotni buzmaydi'],
 ['Barcha mantiqni main ichiga yig‘mang.', 'Faqat muvaffaqiyatli oqimni namoyish qilish yetarli emas.', 'READMEda boshqa kompyuterdagi mutlaq yo‘lni yozmang.'],
 [('Takror ID kiritilganda loyiha talabi?', ['Rad etish, eski yozuvni saqlash','Indamay almashtirish','Tasodifiy ID berish','Dastur yiqilishi'], 'Rad etish, eski yozuvni saqlash','Ma’lumot yaxlitligi saqlanishi kerak.'), ('ConsoleMenu mas’uliyati?', ['Kiritish va foydalanuvchi xabarlari','Barcha fayl formatlari','Faqat baholash','JDK o‘rnatish'], 'Kiritish va foydalanuvchi xabarlari','Domen qoidalari servisda, interfeys konsol qavatida.'), ('Qayta ishga tushirish testi nimani tekshiradi?', ['Saqlash va yuklashni','Faqat kompilyatsiyani','Faqat ranglarni','Internet tezligini'], 'Saqlash va yuklashni','Jarayon tugagandan keyin holat tiklanishini tekshiradi.')],
 ['BLrk_Z2Ph0I'])
