public class Week11 {
    interface Notifier { void send(String message); }
    static class ConsoleNotifier implements Notifier {
        public void send(String message) { System.out.println("Xabar: " + message); }
    }
    static void report(Notifier notifier) { notifier.send("Topshiriq tayyor"); }
    public static void main(String[] args) { report(new ConsoleNotifier()); }
}
