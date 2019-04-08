import React from "react";
import { shallow } from "enzyme";
import FormHelper from "../index";

describe("tests to make sure the blur validation stream is created as expected", () => {
  test("makes sure event is passed in and relevant details are passed to observer", done => {
    const wrapper = shallow(<FormHelper>{() => <div />}</FormHelper>);

    const fakeEvent = {
      target: {
        name: "fakeName",
        value: "fakeValue"
      }
    } as React.FocusEvent<HTMLInputElement>;
    const instance = wrapper.instance() as FormHelper;

    instance.createOnBlur$().subscribe(output => {
      try {
        expect(output).toMatchObject({ name: "fakeName", value: "fakeValue" });
        done();
      } catch (error) {
        done.fail(error);
      }
    });

    instance.triggerFieldBlur$(fakeEvent);
  });
});
