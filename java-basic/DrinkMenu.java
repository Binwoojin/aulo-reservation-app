public class DrinkMenu {
  public static void main(String[] args) {
    String[] drinks = {"아메리카노", "카페라떼", "바닐라라떼", "허브티"}; // 메뉴 구성(배열로 구성)
    int[] prices = {3500, 4500, 5000, 4000}; // 메뉴 순서에 맞게 금액 기재해야 함

    System.out.println("=== Aulo Drink Menu ===");

    for (int i = 0; i < drinks.length; i++) {
      System.out.println((i + 1) + ". " + drinks[i] + " - " + prices[i] + "원");
    }
  }
}
