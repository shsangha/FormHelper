import React from "react";
import propTypes from "prop-types";
import { toPath } from "lodash";
import { FormContext } from "./index";
import pipe from "./utils/pipe";
import isEmptyObj from "./utils/isEmptyObj";
import set from "./utils/set";
import runAll from "./utils/runAll";
import retrieveInternalValue from "./utils/retrieveInternalValue";

const { setInternalError } = set;

export default (Component, multiField) =>
  class FormFieldHoc extends React.Component {
    static contextType = FormContext;

    static propTypes = {
      validateOnChange: propTypes.bool,
      validateOnBlur: propTypes.bool,
      validator: propTypes.func,
      name: propTypes.string.isRequired
    };

    static defaultProps = {
      validateOnChange: true,
      validateOnBlur: true
    };

    pipeMultiFieldValidation = (validator, name) => {
      return pipe(
        validator,
        err => (isEmptyObj(err) ? null : err),
        filterdError =>
          filterdError
            ? setInternalError(
                retrieveInternalValue(this.context.errors, name) || {},
                toPath(name).slice(-1),
                filterdError
              )
            : {}
      );
    };

    componentDidMount() {
      const { name, validateOnChange, validateOnBlur, validator } = this.props;
      if (validator) {
        this.context.attachFieldValidator(
          name,
          multiField
            ? this.pipeMultiFieldValidation(validator, name)
            : validator
        );
      }
    }

    componentWillUnmount() {
      const { name } = this.props;
      const { detachFieldValidator, cleanUpField } = this.context;
      cleanUpField(name);
      detachFieldValidator(name);
    }

    public inputHandlers = ({
      onChange,
      onBlur,
      ...rest
    }: {
      onChange?: (event: React.ChangeEvent<HTMLElement>) => void;
      onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
    } = {}) => {
      const {
        handleChange,
        triggerFieldChange$,
        triggerFieldBlur$
      } = this.context;

      const changeHandler = onChange || handleChange;

      return {
        onChange: runAll(changeHandler, triggerFieldChange$),
        onBlur: runAll(onBlur, triggerFieldBlur$)
      };
    };

    public getFieldState = () => {
      const { name } = this.props;
      const { values, errors, touched } = this.context;

      return {
        value: retrieveInternalValue(values, name),
        errors: retrieveInternalValue(errors, name),
        touched: retrieveInternalValue(touched, name)
      };
    };

    render() {
      const FieldState = this.getFieldState();

      return (
        <Component {...this.props} {...this.context} FieldState={FieldState} />
      );
    }
  };
