public class Week06 {
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
}
