public class Week13 {
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
}
