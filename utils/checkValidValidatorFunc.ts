export default function(name:string) {
  this: any
  
  return (
    (this.fieldValidators[name] &&
      this.fieldValidators[name].validator &&
      typeof this.fieldValidators[name].validator === 'function') ||
    false
  );
}
