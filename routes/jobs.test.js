"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
  getJ1Id,
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

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 80000,
    equity: 0.085,
    company_handle: "c1"
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        ...newJob
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 80000,
        equity: 0.085,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: "wrong",
        equity: "wrong",
        company_handle: "c1"
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("User is not admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
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
          }
        ],
    });
  });
  // test("filter validation works properly", async function () {
  //   const resp = await request(app).get("/companies?minEmployees=-1");
  //   expect(resp.statusCode).toEqual(400);
  //   expect(resp.body).toEqual({
  //     "error": {
  //       "message": [
  //         "instance.minEmployees must have a minimum value of 0"
  //       ],
  //       "status": 400
  //     }
  //   });
  // });
  // test("filter validation works properly", async function () {
  //   const resp = await request(app).get("/companies?maxEmployees=-1");
  //   expect(resp.statusCode).toEqual(400);
  //   expect(resp.body).toEqual({
  //     "error": {
  //       "message": [
  //         "instance.maxEmployees must have a minimum value of 0"
  //       ],
  //       "status": 400
  //     }
  //   });
  // });
  // test("filter validation works properly", async function () {
  //   const resp = await request(app).get("/companies?name=");
  //   expect(resp.statusCode).toEqual(400);
  //   expect(resp.body).toEqual({
  //     "error": {
  //       "message": [
  //         "instance.name does not meet minimum length of 1"
  //       ],
  //       "status": 400
  //     }
  //   });
  // });

  // test("filter correctly with valid inputs", async function () {
  //   const resp = await request(app).get("/companies?name=c&minEmployees=2&maxEmployees=3");
  //   expect(resp.statusCode).toEqual(200);
  //   expect(resp.body).toEqual({
  //     "companies": [
  //       {
  //         handle: "c2",
  //         name: "C2",
  //         description: "Desc2",
  //         numEmployees: 2,
  //         logoUrl: "http://c2.img",
  //       },
  //       {
  //         handle: "c3",
  //         name: "C3",
  //         numEmployees: 3,
  //         description: "Desc3",
  //         logoUrl: "http://c3.img",
  //       }]
  //   });
  // });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    let id = await getJ1Id();
    const resp = await request(app).get(`/jobs/${id}`);
    expect(resp.body).toEqual({
      job:
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0.001",
        companyHandle: "c1"
      },
    });
  });

  // test("works for anon: company w/o jobs", async function () {
  //   const resp = await request(app).get(`/companies/c2`);
  //   expect(resp.body).toEqual({
  //     company: {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     },
  //   });
  // });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/70000000`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    let id = await getJ1Id();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "J1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      jobs: {
        id: expect.any(Number),
        title: "J1-new",
        salary: 100000,
        equity: "0.001",
        companyHandle: "c1"
      },
    });
  });

  test("not admin", async function () {
    let id = await getJ1Id();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    let id = await getJ1Id();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        name: "C1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/jobs/77777777`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    let id = await getJ1Id();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        id: "c1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    let id = await getJ1Id();
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        salary: "wrong",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    let id = await getJ1Id();
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: id });
  });

  test("not admin", async function () {
    let id = await getJ1Id();
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    let id = await getJ1Id();
    const resp = await request(app)
      .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/700000`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
