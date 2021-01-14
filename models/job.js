"use strict";


const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const FOREIGNKEYCONSTRAINT = 'jobs_company_handle_fkey';

/** Related functions for jobss. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle}
   *
   * Returns {  id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if the job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    let result;
    try {
      result = await db.query(
        `INSERT INTO jobs
             (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ]);
    } catch (err) {
      if (err.constraint === FOREIGNKEYCONSTRAINT) {
        throw new NotFoundError(`${companyHandle} is not found in the database`);
      }
      throw err;
    }
    const job = result.rows[0];
    return job;
  }

  /** Find all Jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle AS "companyHandle"}, ...]
   * */

  static async findAll() {
    const jobsResp = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY id`);
    return jobsResp.rows;
  }
  // /** Filter list of all companies.
  //   * name: filter by company name that includes given phrase (case insensitive)
  //   * minEmployees: filter to companies that have at least that number of employees.
  //   * maxEmployees: filter to companies that have no more than that number of employees.
  //   ** If the minEmployees parameter is greater than the maxEmployees parameter, respond with a 400 error with an appropriate message.
  //   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
  //   * If no companies found, returns []
  //  **/

  // static async filterJobs({ name, minEmployees, maxEmployees }) {
  //   if (minEmployees > maxEmployees) {
  //     throw new BadRequestError("minEmployees cannot exceed maxEmployees.");
  //   }
  //   let filterStrArr = [];
  //   if (name && !name.includes(`'`) && !name.includes(`;`)) {
  //     filterStrArr.push(`name ILIKE '%${name}%'`);
  //   }
  //   if (minEmployees !== undefined) {
  //     filterStrArr.push(`num_employees >= ${minEmployees}`);
  //   }
  //   if (maxEmployees !== undefined) {
  //     filterStrArr.push(`num_employees <= ${maxEmployees}`);
  //   }
  //   const whereClause = filterStrArr.join(" AND ");
  //   const companiesRes = await db.query(
  //     `SELECT handle,
  //                 name,
  //                 description,
  //                 num_employees AS "numEmployees",
  //                 logo_url AS "logoUrl"
  //          FROM companies
  //          WHERE ${whereClause}
  //          ORDER BY name`);
  //   return companiesRes.rows;
  // }

  /* gets job by id */
  static async get(id) {
    const jobsResp = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1
           ORDER BY title`, [id]);
    const job = jobsResp.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, title, salary, equity) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies
                      SET ${setCols}
                      WHERE handle = ${handleVarIdx}
                      RETURNING handle,
                                name,
                                description,
                                num_employees AS "numEmployees",
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Job;
