import {
  deleteValue,
  deleteErrorOrTouched
} from "../../multiFieldHelpers/delete";

describe("tests the deletion helper for multiFields", () => {
  describe("tests the deletion of values", () => {
    test("edge case delete last item", () => {
      const values = [
        { first: "object" },
        {
          second: {
            nested: {
              object: true
            }
          }
        },
        { third: "should get deleted" }
      ];

      const result = deleteValue(values, 2);
      expect(result[2]).toBeUndefined();
      expect(result).toEqual(
        expect.arrayContaining([
          {
            first: "object"
          },
          {
            second: {
              nested: {
                object: true
              }
            }
          }
        ])
      );
    });
    test("edge case delete from start of array", () => {
      const values = [
        { first: "deleted" },
        {
          second: {
            nested: {
              object: true
            }
          }
        },
        { third: "stay" }
      ];

      const result = deleteValue(values, 0);
      expect(result[2]).toBeUndefined();
      expect(result).toEqual(
        expect.arrayContaining([
          {
            second: {
              nested: {
                object: true
              }
            }
          },
          {
            third: "stay"
          }
        ])
      );
    });
    test("deletes from middle of array", () => {
      const values = [
        { first: "stay" },
        {
          second: {
            nested: {
              object: true
            }
          }
        },
        { third: "stay" }
      ];

      const result = deleteValue(values, 1);
      expect(result[2]).toBeUndefined();
      expect(result).toEqual(
        expect.arrayContaining([
          {
            first: "stay"
          },
          {
            third: "stay"
          }
        ])
      );
    });
  });

  describe("tests the error/touched state changes", () => {
    test("sets the error states of other keys to undefined if there wasnt anything in the spot before it", () => {
      const obj = {
        0: { error: 0 },
        2: { error: 2 },
        3: { error: 3 }
      };

      const result = deleteErrorOrTouched(obj, 1);
      expect(result).toEqual(
        expect.objectContaining({
          "0": {
            error: 0
          },
          "2": {
            error: 3
          }
        })
      );
    });
  });
});
