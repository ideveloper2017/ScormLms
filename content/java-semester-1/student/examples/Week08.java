public class Week08 {
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
}
