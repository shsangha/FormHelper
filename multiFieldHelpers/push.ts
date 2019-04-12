export default (values: any[], newValue: any) => {
  const copy = [...(values || [])];

  copy.push(newValue);

  return copy;
};
