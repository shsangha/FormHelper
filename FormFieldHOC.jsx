import React from 'react';
import propTypes from 'prop-types';
import { FormContext } from './index';
import pipe from './utils/pipe';
import isEmptyObj from './utils/isEmptyObj';

export default (Component, multiField) =>
  class FormFieldHoc extends React.Component {
    static contextType = FormContext;

    static propTypes = {
      validateOnChange: propTypes.bool,
      validateOnBlur: propTypes.bool,
      validator: propTypes.func,
      dynamic: propTypes.bool,
      name: propTypes.string.isRequired
    };

    static defaultProps = {
      validateOnChange: true,
      validateOnBlur: true,
      dynamic: false
    };

    pipeMultiFieldValidation = (validator, name) => {
      return pipe(
        validator,
        err => (isEmptyObj(err) ? null : err),
        filterdError =>
          filterdError
            ? setInternvalError(
                retrieveInternalValue(this.context.errors, name) || {},
                toPath(name).slice(-1),
                err
              )
            : {}
      );
    };

    componentDidMount() {
      const { name, validateOnChange, validateOnBlur, validator } = this.props;
      if (validator) {
        this.context.attachFieldValidator(
          name,
          multiField ? pipeMultiFieldValidation(validator, name) : validator,
          validateOnChange,
          validateOnBlur
        );
      }
    }
    componentWillUnmount() {
      const { dynamic, name } = this.props;
      const { detachFieldValidator, cleanUpField } = this.context;
      if (dynamic) {
        cleanUpField(name);
        detachFieldValidator(name);
      }
    }

    render() {
      const { retrieveInternalValue, values, errors, touched } = this.context;
      const { name } = this.props;

      console.log(values, name, 'VALUES');

      const FieldState = {
        value: retrieveInternalValue(values, name),
        errors: retrieveInternalValue(errors, name),
        touched: retrieveInternalValue(touched, name)
      };

      return <Component {...this.props} {...this.context} FieldState={FieldState} />;
    }
  };
