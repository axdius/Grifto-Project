function fibonacci(n) {
  let series = [];

  if (n >= 1) series.push(0);
  if (n >= 2) series.push(1);

  for (let i = 2; i < n; i++) {
    series.push(series[i - 1] + series[i - 2]);
  }

  return series;
}

console.log(fibonacci(10));
// Output: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]