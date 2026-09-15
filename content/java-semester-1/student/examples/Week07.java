public class Week07 {
    public static void main(String[] args) {
        String raw = "  Java asoslari  ";
        String clean = raw.trim();
        System.out.println(clean);
        System.out.println("java".equalsIgnoreCase("JAVA"));
        System.out.println(clean.split(" ").length);
    }
}
