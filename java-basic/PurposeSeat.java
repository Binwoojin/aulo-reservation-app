public class PurposeSeat {
  public static void main(String[] args) {
    String[] purpose = {"공부", "작업", "휴식"}; // 목적에 해당되는 공부, 작업, 휴식을 배열로 선언
    String[] recommendSeat = {"Flow Focus", "Flow Central", "Flow Nest"}; 

    System.out.println("=== Purpose Seat Recommendation ===");

    for (int i = 0; i < purpose.length; i++) {
      System.out.println(purpose[i] + " 추천 좌석 : " + recommendSeat[i]);
    }
  }
}

