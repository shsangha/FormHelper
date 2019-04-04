export default function pipe(...fns: any): any {
  // bc rest params don't work at the end of an array
  const [fn1, fn2, ...rest] = fns.reverse();

  const pipedFn = (...args: any) => fn2(fn1(...args));

  return rest.length === 0
    ? pipedFn
    : pipe(
        pipedFn,
        ...rest
      );
}
