import java.util.Map;
import java.util.TreeMap;
public class Week12 {
    public static void main(String[] args) {
        Map<String, Integer> counts = new TreeMap<>();
        for (String word : new String[]{"java", "kod", "java"}) {
            counts.put(word, counts.getOrDefault(word, 0) + 1);
        }
        System.out.println(counts);
    }
}
