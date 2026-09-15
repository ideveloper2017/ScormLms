import java.util.Map;
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
}
