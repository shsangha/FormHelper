import React from 'react';
import propTypes from 'prop-types';
import { FormContext } from './index';

export default Component =>
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
    componentDidMount() {
      const { name, validateOnChange, validateOnBlur, validator } = this.props;
      if (validator) {
        this.context.attachFieldValidator(name, validator, validateOnChange, validateOnBlur);
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
      return <Component {...this.props} {...this.context} />;
    }
  };
