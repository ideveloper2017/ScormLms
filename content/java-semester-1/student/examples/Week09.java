public class Week09 {
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
}
