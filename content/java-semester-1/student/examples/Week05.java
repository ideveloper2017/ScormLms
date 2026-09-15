public class Week05 {
    static int clamp(int value, int min, int max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }
    public static void main(String[] args) {
        System.out.println(clamp(105, 0, 100));
        System.out.println(clamp(72, 0, 100));
    }
}
