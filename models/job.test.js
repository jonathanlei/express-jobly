"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

 /* Helper function to find job1's id */
const getJ1Id = async function () {
  let jobs = await Job.findAll();
  let id = jobs[0].id;
  return id;  
}

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
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [job.id]);
    // console.log("result:", result.rows);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
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
      equity: "0.8",
      companyHandle: "wrong!"
    };
    try {
      await Job.create(jobWithWrongCom);
      fail();
    } catch (err) {
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
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0.001",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 1000000,
        equity: "0",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 80000,
        equity: "0.085",
        companyHandle: "c3"
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
    let jobs = await Job.findAll();
    let id = jobs[0].id;
    let job = await Job.get(id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 100000,
      equity: "0.001",
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(7000000);
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
    equity: "0.001111",
  };


  test("works", async function () {
    let id = await getJ1Id();
    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,[id]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      title: "new",
      salary: 100000000,
      equity: "0.001111",
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    let id = await getJ1Id();
    const updateDataSetNulls = {
      title: "new",
      salary: null,
      equity: null,
    };

    let job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
      id: expect.any(Number),
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,[id]);
    expect(result.rows).toEqual([{
      id: expect.any(Number),
      companyHandle: "c1",
      title: "new",
      salary: null,
      equity: null,
    }]);
  });

  test("not found if no such job", async function () {
    try {
      let job = await Job.update(70000000, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    let id = await getJ1Id();
    try {
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let id = await getJ1Id();
    await Job.remove(id);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.remove(700000000);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
