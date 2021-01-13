const { BadRequestError } = require("../expressError");


/* 
Helper function that is used by companies and users model, to partially update information in the database, when not all keys are present. 
takes in: 
    dataToUpdate like {firstName: 'Aliya', age: 32}
    and jstoSql like {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        }
returns an object like
  {
    setCols: "\"num_employees\"=$1, \"logo_url\"=$2"
    values: [2, "url"]
  }
*/
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
