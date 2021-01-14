"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create job */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: 0.8,
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, [job.id]);
    delete result.rows[0].id; 
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 100000,
        equity: "0.8",
        companyHandle: "c1"
      }
    ]);
  });

  test("not found with companyHandle", async function () {

    const jobWithWrongCom = {
      title: "new",
      salary: 100000,
      equity: 0.8,
      companyHandle: "wrong!"
    };
    try {
      await Job.create(jobWithWrongCom);
      fail();
    } catch (err) {
      console.log(err);
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: jobIds.j1,
        title: "j1",
        salary: 100000,
        equity: 0.001,
        company_handle: "c1"
      },
      {
        id: jobIds.j2,
        title: "j2",
        salary: 1000000,
        equity: 0,
        company_handle: "c2"
      },
      {
        id: jobIds.j3,
        title: "j3",
        salary: 80000,
        equity: 0.085,
        company_handle: "c3"
      },
    ]);
  });
});
// /************************************** findAll (filter)
//  * name: filter by company name that includes given phrase (case insensitive)
//  * minEmployees: filter to companies that have at least that number of employees.
//  * maxEmployees: filter to companies that have no more than that number of employees.
//  ** If the minEmployees parameter is greater than the maxEmployees parameter, respond with a 400 error with an appropriate message.
//  *
// */

// describe("findAll (filtered) companies", function () {
//   test("minEmployees filter", async function () {
//     let companies = await Company.filterCompanies({ minEmployees: 3 });
//     expect(companies).toEqual([
//       {
//         handle: "c3",
//         name: "C3",
//         description: "Desc3",
//         numEmployees: 3,
//         logoUrl: "http://c3.img",
//       },
//     ]);
//   });
//   test("maxEmployees filterCompanies", async function () {
//     let companies = await Company.filterCompanies({ maxEmployees: 2 });
//     expect(companies).toEqual([
//       {
//         handle: "c1",
//         name: "C1",
//         description: "Desc1",
//         numEmployees: 1,
//         logoUrl: "http://c1.img",
//       },
//       {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//     ]);
//   });


//   test("name filterCompanies", async function () {
//     const newCompany = {
//       handle: "new",
//       name: "New Company",
//       description: "New Description",
//       numEmployees: 1,
//       logoUrl: "http://new.img",
//     };
//     let companyToBeReturned = await Company.create(newCompany);

//     let companies = await Company.filterCompanies({ name: "new" });
//     expect(companies).toEqual([
//       newCompany
//     ]);
//   });

//   test("minEmployees exceeds maxEmployees", async function () {
//     expect(async () => {
//       await Company.filterCompanies({ minEmployees: 3, maxEmployees: 1 }).toThrowError(new BadRequestError("minEmployees cannot exceed maxEmployees."));
//     });
//   });

//   test("filterCompanies no match", async function () {
//     let companies = await Company.filterCompanies({ name: "neverMakeAcompanyCalledthis", minEmployees: 44, maxEmployees: 44 });
//     expect(companies).toEqual([]);
//   });
//   // pass in the badrequesterror class
//   test("negative min", async function () {
//     expect(async () => {
//       await Company.filterCompanies({ minEmployees: -44 }).toThrowError(new BadRequestError());
//     });
//   });
//   test("negative max", async function () {
//     expect(async () => {
//       await Company.filterCompanies({ maxEmployees: -77 }).toThrowError(new BadRequestError());
//     });
//   });
//   test("invalid max: string max", async function () {
//     expect(async () => {
//       await Company.filterCompanies({ maxEmployees: "goofball" }).toThrowError(new BadRequestError());
//     });
//   });
// });
// // test for invalid min
// //End of describe function

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("j1");
    expect(job).toEqual({
      id: jobIds.j1,
      title: "j1",
      salary: 100000,
      equity: 0.001,
      company_handle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "new",
    salary: 100000000,
    equity: 0.001111,
  };

  test("works", async function () {
    let job = await Job.update("j1", updateData);
    expect(job).toEqual({
      id: jobIds.j1,
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,[job.id]);
    expect(result.rows).toEqual([{
      id: jobIds.j1,
      title: "new",
      salary: 100000000,
      equity: 0.001111,
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "new",
      salary: null,
      equity: null,
    };

    let job = await Job.update("c1", updateDataSetNulls);
    expect(job).toEqual({
      id: jobIds.j1,
      company_handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`,[job.id]);
    expect(result.rows).toEqual([{
      id: jobIds.j1,
      company_handle: "c1",
      title: "new",
      salary: null,
      equity: null,
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(jobid.j1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobIds.j1);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${jobIds.j1}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
