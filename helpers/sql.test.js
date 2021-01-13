const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");
//test it works with partial data, return the right output

describe("sqlForPartialUpdate", function () {
  test("works, with partial matching input", function () {
    const dataToUpdate = {
      numEmployees: 2,
      logoUrl: "/logos/logo3.png"
    }
    const jsToSql = {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    }

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: "\"num_employees\"=$1, \"logo_url\"=$2",
      values: [2, "/logos/logo3.png"]
    });
  });
});

describe("sqlForPartialUpdate", function () {
  test("works, with extra inputs keys", function () {
    const dataToUpdate = {
      numEmployees: 2,
      logoUrl: "/logos/logo3.png",
      handle: "test"
    }
    const jsToSql = {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    }

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: "\"num_employees\"=$1, \"logo_url\"=$2, \"handle\"=$3",
      values: [2, "/logos/logo3.png", "test"]
    });
  });
});


describe("sqlForPartialUpdate", function () {
  test("throw BadRequestError if passed in empty object ", function () {
    const dataToUpdate = {};
    const jsToSql = {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    }
    expect(() => { sqlForPartialUpdate(dataToUpdate, jsToSql) })
      .toThrowError(new BadRequestError("No data"));
  });
});