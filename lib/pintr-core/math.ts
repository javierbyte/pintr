export function tweenValue(
  value: number,
  tweens: readonly (readonly [number, number])[]
): number {
  const sortedTweens = [...tweens].sort((a, b) => a[0] - b[0]);

  if (
    value < sortedTweens[0][0] ||
    value > sortedTweens[sortedTweens.length - 1][0]
  ) {
    return value;
  }

  for (let i = 0; i < sortedTweens.length; i++) {
    const tween = sortedTweens[i];

    if (tween[0] === value) return tween[1];

    if (tween[0] > value) {
      const previousTween = sortedTweens[i - 1];
      const range = tween[0] - previousTween[0];
      const progress = (value - previousTween[0]) / range;

      return progress * tween[1] + (1 - progress) * previousTween[1];
    }
  }

  return value;
}
