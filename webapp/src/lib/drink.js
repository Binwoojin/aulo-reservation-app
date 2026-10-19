// 음료의 온도·사진 (policy.js MENU의 temps·image)
// temps가 둘이면 손님이 고르고(needsTemp), 하나면 그 온도로만 나간다(fixedTemp).
export const drinkTemps = (drink) => drink?.temps ?? [];
export const needsTemp = (drink) => drinkTemps(drink).length > 1;
export const fixedTemp = (drink) => (drinkTemps(drink).length === 1 ? drinkTemps(drink)[0] : null);
// 샷 추가는 커피에만
export const canAddShot = (drink) => drink?.category === 'coffee';

// 사진 파일 이름: 고른 온도의 사진, 아직 안 골랐으면 첫 번째 온도의 사진. 사진이 없으면 null
export const drinkImage = (drink, temp) => {
  const image = drink?.image;
  if (!image || typeof image === 'string') return image ?? null;
  return image[temp] ?? image[drinkTemps(drink)[0]] ?? null;
};
