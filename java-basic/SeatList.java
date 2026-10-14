public class SeatList {
  public static void main(String[] args) {
    String[] seats = { "Flow Central", "Flow Window", "Flow Focus", "Flow Nest"};
    String[] status = { "자유 이용 가능", "자유 이용 가능", "예약 가능", "예약 가능"};

    System.out.println("=== Aulo Seat List ===");

    for (int i = 0; i < seats.length; i++) {
      System.out.println((i + 1) + ". " + seats[i] + " - " + status[i]);
    }
  }
}
