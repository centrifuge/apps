export const groupBy = <A>(xs: A[], selector: (el: A) => any) => {
  return xs.reduce(function(rv, x) {
    ;(rv[selector(x)] = rv[selector(x)] || []).push(x)
    return rv
  }, {})
}
