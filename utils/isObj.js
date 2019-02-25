export default function(obj) {
  // console.log(obj === Object(obj));
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}
