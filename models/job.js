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
  /** Filter list of all jobs.
   * title: filter by job title. Like before, this should be a case-insensitive, matches-any-part-of-string search.
   * minSalary: filter to jobs with at least that salary.
   *hasEquity: if true, filter to jobs that provide a non-zero amount of equity If false or not included in the filtering, list all jobs regardless of equity.
   **/

  static async filterJobs({ title, minSalary, hasEquity }) {
    let filterStrArr = [];
    if (title && !title.includes(`'`) && !title.includes(`;`)) {
      filterStrArr.push(`title ILIKE '%${title}%'`);
    }
    if (minSalary !== undefined) {
      filterStrArr.push(`salary >= ${minSalary}`);
    }
    if (hasEquity === true) {
      filterStrArr.push(`equity > 0`);
    }
    const whereClause = filterStrArr.join(" AND ");
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE ${whereClause}
       ORDER BY id`);
    return jobsRes.rows;
  }

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



  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity }
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data, {});
    const idIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idIdx}
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
