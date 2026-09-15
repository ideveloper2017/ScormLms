public class Week10 {
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
}
