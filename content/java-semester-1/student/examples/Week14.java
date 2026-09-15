import java.nio.file.Files;
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
}
