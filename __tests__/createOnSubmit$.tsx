import React from "react";
import FormHelper from "../index";
import { shallow } from "enzyme";

describe("tests to make sure the submit validation stream is created as expected", () => {
  test("makes sure trigger calls observer", done => {
    const wrapper = shallow(<FormHelper>{() => <div />}</FormHelper>);

    const instance = wrapper.instance() as FormHelper;

    instance.createOnSubmit$().subscribe(output => {
      try {
        expect(output).toEqual("");
        done();
      } catch (error) {
        done.fail(error);
      }
    });

    instance.triggerSubmission$();
  });
});
