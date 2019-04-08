import React from "react";
import { shallow } from "enzyme";
import { from, VirtualTimeScheduler, NEVER } from "rxjs";
import { delay } from "rxjs/operators";
import FormHelper from "..";
import { FormHelperState } from "../types";

const fakeChangeEvent1 = {
  name: "type1",
  value: ""
};

const fakeChangeEvent2 = {
  name: "type2",
  value: ""
};

describe("tests that the change validation stream behaves as expected", () => {
  jest.useFakeTimers();

  test("calls to the same name get debouced as expected", done => {
    const wrapper = shallow(<FormHelper>{() => <div />}</FormHelper>);
    const instance = wrapper.instance() as FormHelper;
    const scheduler = new VirtualTimeScheduler();
    const fakeBlur$ = NEVER;

    // expecting the third call to be ignored
    const fakeChange$ = from([
      [fakeChangeEvent1, fakeChangeEvent1],
      [fakeChangeEvent1, fakeChangeEvent1],
      [fakeChangeEvent1, fakeChangeEvent1],
      [fakeChangeEvent1, fakeChangeEvent1],
      [fakeChangeEvent1, fakeChangeEvent1]
    ]).pipe(delay(50, scheduler));

    const calledSpy = jest.fn();

    instance.manageOnChange$(fakeChange$, fakeBlur$).subscribe({
      next() {
        calledSpy();
      },
      error(e) {
        done.fail(e);
      },
      complete() {
        try {
          expect(calledSpy).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });
    scheduler.flush();
  });

  test("filters out into merge/switch map appropriately", done => {
    const wrapper = shallow(<FormHelper>{() => <div />}</FormHelper>);
    const instance = wrapper.instance() as FormHelper;

    const scheduler = new VirtualTimeScheduler();
    const fakeBlur$ = NEVER;
    const fakeChange$ = from([
      [fakeChangeEvent1, fakeChangeEvent2],
      [fakeChangeEvent1, fakeChangeEvent1],
      [fakeChangeEvent1, fakeChangeEvent1],
      [fakeChangeEvent1, fakeChangeEvent2]
    ]).pipe(delay(50, scheduler));

    const calledSpy = jest.fn();

    instance.manageOnChange$(fakeChange$, fakeBlur$).subscribe({
      next() {
        calledSpy();
      },
      error(e) {
        done.fail(e);
      },
      complete() {
        try {
          expect(calledSpy).toHaveBeenCalledTimes(3);
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });
    scheduler.flush();
  });

  test("blur stream being triggered interupts inner observable", done => {
    const wrapper = shallow(<FormHelper>{() => <div />}</FormHelper>);
    const instance = wrapper.instance() as FormHelper;

    const scheduler = new VirtualTimeScheduler();

    jest
      .spyOn(instance, "runFieldLevelValidation")
      .mockImplementation((a: string, b: Partial<FormHelperState>) => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({});
          }, 300);
        });
      });

    const fakeBlur$ = from([1, 1]).pipe(delay(105, scheduler));
    const fakeChange$ = from([
      fakeChangeEvent1,
      fakeChangeEvent1,
      fakeChangeEvent1,
      fakeChangeEvent2
    ]).pipe(delay(100, scheduler));

    const calledSpy = jest.fn();

    instance.manageOnBlur$(fakeChange$, fakeBlur$).subscribe({
      next(output) {
        calledSpy();
      },
      error(e) {
        done.fail(e);
      },
      complete() {
        try {
          expect(calledSpy).not.toHaveBeenCalled();
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });
    scheduler.flush();
  });

  test("returns the validation result of the given key merged with the current error state", done => {
    const wrapper = shallow(<FormHelper>{() => <div />}</FormHelper>);
    const instance = wrapper.instance() as FormHelper;

    const fakeBlur$ = NEVER;
    const fakeChange$ = from([[fakeChangeEvent1, fakeChangeEvent1]]);

    jest.spyOn(instance, "runFieldLevelValidation").mockImplementation(
      (a: string, value: Partial<FormHelperState>) =>
        new Promise(resolve =>
          resolve({
            new: "error"
          })
        )
    );

    wrapper.setState(
      {
        errors: {
          some: {
            existing: { errors: "any" }
          }
        }
      },
      () => {
        instance.manageOnChange$(fakeChange$, fakeBlur$).subscribe({
          next(output) {
            try {
              expect(output).toMatchObject({
                some: { existing: { errors: "any" } },
                type1: { new: "error" }
              });
              done();
            } catch (e) {
              done.fail(e);
            }
          },
          error(e) {
            done.fail(e);
          }
        });
      }
    );
  });
});
