import FormFieldHOC from './FormFieldHOC';

const Field = props => {
  const { children, retrieveInternalValue, name, values, type, errors, touched } = props;

  const field = {
    value: retrieveInternalValue(values, name),
    type: type || 'text',
    name
  };

  const fieldErrors = retrieveInternalValue(errors, name);
  const fieldTouched = retrieveInternalValue(touched, name);

  const inputHandlers = ({ onChange, onBlur, ...rest } = {}) => {
    const { handleBlur, handleChange } = props;

    return {
      onChange: onChange || handleChange,
      onBlur: onBlur || handleBlur,
      ...rest
    };
  };
  return children({ inputHandlers, field, errors: fieldErrors, touched: fieldTouched });
};

export default FormFieldHOC(Field);
