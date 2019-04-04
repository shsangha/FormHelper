export default function(obj: any) {
  // console.log(obj === Object(obj));
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}
